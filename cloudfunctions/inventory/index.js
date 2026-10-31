const cloud = require('wx-server-sdk');
const { ownershipFromSpace, ownershipMatches } = require('./domain');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const PAGE_SIZE = 100;

class BusinessError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function ok(data) {
  return { code: 200, success: true, data };
}

function assert(condition, code, message) {
  if (!condition) throw new BusinessError(code, message);
}

async function withTransaction(handler) {
  if (typeof db.runTransaction === 'function') return db.runTransaction(handler);
  return handler(db);
}

async function queryAll(collection, where = {}, offset = 0, result = []) {
  const page = await db.collection(collection).where(where).skip(offset).limit(PAGE_SIZE).get();
  const rows = page.data || [];
  result.push(...rows);
  if (rows.length < PAGE_SIZE) return result;
  return queryAll(collection, where, offset + rows.length, result);
}

async function safeDoc(collection, id) {
  if (!id) return null;
  try {
    const result = await db.collection(collection).doc(id).get();
    return result.data || null;
  } catch (error) {
    return null;
  }
}

async function getCurrentUser() {
  const { OPENID } = cloud.getWXContext();
  assert(OPENID, 401, '未获取到微信身份');
  const result = await db.collection('users').where({ openid: OPENID }).limit(1).get();
  const user = result.data[0];
  assert(user, 401, '请先登录');
  return user;
}

async function getActiveMember(familyId, userId) {
  if (!familyId || !userId) return null;
  const result = await db
    .collection('family_members')
    .where({ familyId, userId, status: 'active' })
    .limit(1)
    .get();
  return result.data[0] || null;
}

async function getAccessibleSpaces(user) {
  const ownSpaces = (await queryAll('spaces', { ownerId: user._id })).filter((space) => !space.deletedAt);
  const byId = new Map(ownSpaces.map((space) => [space._id, { space, access: 'owner' }]));

  if (!user.currentFamilyId) return Array.from(byId.values());

  const membership = await getActiveMember(user.currentFamilyId, user._id);
  if (!membership) return Array.from(byId.values());

  const familySpaces = await queryAll('spaces', { familyId: user.currentFamilyId });
  familySpaces
    .filter((space) => !space.deletedAt && !space.ownerId && space.visibility === 'shared')
    .forEach((space) => byId.set(space._id, { space, access: 'edit' }));

  const permissions = await queryAll('space_permissions', { userId: user._id, status: 'active' });
  await Promise.all(
    permissions.map(async (permission) => {
      if (byId.has(permission.spaceId)) return;
      const space = await safeDoc('spaces', permission.spaceId);
      if (
        space &&
        !space.deletedAt &&
        space.ownerId &&
        space.ownerId !== user._id &&
        space.familyId === user.currentFamilyId &&
        space.visibility === 'shared'
      ) {
        byId.set(space._id, { space, access: 'view' });
      }
    }),
  );

  return Array.from(byId.values());
}

async function requireSpaceAccess(user, spaceId, write = false) {
  const space = await safeDoc('spaces', spaceId);
  assert(space && !space.deletedAt, 404, '空间不存在');

  if (space.ownerId === user._id) return { space, access: 'owner' };

  if (!space.ownerId && space.familyId && space.visibility === 'shared') {
    const member = await getActiveMember(space.familyId, user._id);
    assert(member, 403, '无权访问该家庭空间');
    return { space, access: 'edit' };
  }

  assert(!write, 403, '个人共享空间仅支持查看');
  assert(space.visibility === 'shared' && space.familyId, 403, '无权访问该个人空间');
  const member = await getActiveMember(space.familyId, user._id);
  assert(member, 403, '你已不在该空间所属家庭中');
  const permission = await db
    .collection('space_permissions')
    .where({ spaceId: space._id, userId: user._id, status: 'active' })
    .limit(1)
    .get();
  assert(permission.data[0], 403, '空间所有者未向你开放该空间');
  return { space, access: 'view' };
}

function spaceTheme(type) {
  if (type === 'fridge') return { icon: 'fridge', tint: '#dcedef', image: '#b4d1d5' };
  if (type === 'cabinet') return { icon: 'box', tint: '#e3f0e3', image: '#bdd9bd' };
  if (type === 'layer' || type === 'grid') return { icon: 'door', tint: '#f6ead4', image: '#dfc08b' };
  return { icon: 'box', tint: '#eee7f4', image: '#d0bde1' };
}

async function toSpaceView(entry) {
  const { space, access } = entry;
  const batches = (await queryAll('item_batches', { spaceId: space._id })).filter(
    (batch) => !batch.archivedAt && Number(batch.quantity) > 0,
  );
  const count = new Set(batches.map((batch) => batch.itemId)).size;
  const stock = batches.reduce((total, batch) => total + Number(batch.quantity || 0), 0);
  const isPersonal = !!space.ownerId;
  const theme = spaceTheme(space.type);
  return {
    ...space,
    id: space._id,
    ...theme,
    access,
    canEdit: access !== 'view',
    isPersonal,
    shared: !isPersonal,
    count,
    stock,
    sub: `${count} 件物品${isPersonal ? ' · 个人空间' : ''}`,
  };
}

async function listSpaces(user) {
  const entries = await getAccessibleSpaces(user);
  const spaces = await Promise.all(entries.map(toSpaceView));
  spaces.sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
  return ok({ spaces });
}

async function getSpace(user, data) {
  const entry = await requireSpaceAccess(user, data.spaceId || data.id);
  const space = await toSpaceView(entry);
  if (space.isPersonal && entry.access === 'owner') {
    const permissions = await queryAll('space_permissions', {
      spaceId: space._id,
      status: 'active',
    });
    space.sharedUserIds = permissions.map((permission) => permission.userId);
  } else {
    space.sharedUserIds = [];
  }
  return ok({ space });
}

async function createSpace(user, data) {
  const name = String(data.name || '').trim();
  assert(name, 400, '请填写空间名称');
  assert(name.length <= 64, 400, '空间名称最多 64 个字');

  const scope = data.scope === 'family' ? 'family' : 'personal';
  const now = new Date();
  let familyId = '';
  let ownerId = '';
  let visibility = 'private';
  const shareUserIds = scope === 'personal'
    ? Array.from(
      new Set((Array.isArray(data.shareUserIds) ? data.shareUserIds : []).filter((id) => id && id !== user._id)),
    )
    : [];

  if (scope === 'family') {
    assert(user.currentFamilyId, 400, '请先加入家庭');
    const member = await getActiveMember(user.currentFamilyId, user._id);
    assert(member, 403, '你已不在该家庭中');
    familyId = user.currentFamilyId;
    visibility = 'shared';
  } else {
    ownerId = user._id;
    familyId = user.currentFamilyId || '';
    if (shareUserIds.length) {
      assert(familyId, 400, '未加入家庭时不能共享个人空间');
      const valid = (
        await Promise.all(
          shareUserIds.map(async (userId) => ((await getActiveMember(familyId, userId)) ? userId : null)),
        )
      ).filter(Boolean);
      assert(valid.length === shareUserIds.length, 400, '共享名单包含非当前家庭成员');
      visibility = 'shared';
    }
  }

  const spaceId = await withTransaction(async (transaction) => {
    const result = await transaction.collection('spaces').add({
      data: {
        familyId,
        ownerId,
        parentId: data.parentId || '',
        name,
        type: data.type || 'other',
        visibility,
        photoUrl: '',
        capacityNote: String(data.capacityNote || ''),
        sortOrder: Number(data.sortOrder || 0),
        createdBy: user._id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    });
    await Promise.all(
      shareUserIds.map((userId) =>
        transaction.collection('space_permissions').add({
          data: {
            spaceId: result._id,
            userId,
            status: 'active',
            grantedBy: user._id,
            createdAt: now,
            updatedAt: now,
          },
        }),
      ),
    );
    return result._id;
  });

  return ok({ spaceId });
}

async function updateSpaceSharing(user, data) {
  const space = await safeDoc('spaces', data.spaceId);
  assert(space && !space.deletedAt, 404, '空间不存在');
  assert(space.ownerId === user._id, 403, '只有空间所有者可以调整共享名单');

  const requested = Array.from(new Set((data.userIds || []).filter((id) => id && id !== user._id)));
  assert(!requested.length || user.currentFamilyId, 400, '未加入家庭时不能共享个人空间');

  if (requested.length) {
    assert(!space.familyId || space.familyId === user.currentFamilyId, 409, '空间已关联其他家庭');
    const valid = (
      await Promise.all(
        requested.map(async (userId) => ((await getActiveMember(user.currentFamilyId, userId)) ? userId : null)),
      )
    ).filter(Boolean);
    assert(valid.length === requested.length, 400, '共享名单包含非当前家庭成员');
  }

  const existing = await queryAll('space_permissions', { spaceId: space._id });
  const existingByUser = new Map(existing.map((permission) => [permission.userId, permission]));
  const now = new Date();

  await withTransaction(async (transaction) => {
    await Promise.all(
      existing.map((permission) => {
        const status = requested.includes(permission.userId) ? 'active' : 'revoked';
        return transaction.collection('space_permissions').doc(permission._id).update({
          data: { status, updatedAt: now },
        });
      }),
    );

    await Promise.all(
      requested
        .filter((userId) => !existingByUser.has(userId))
        .map((userId) =>
          transaction.collection('space_permissions').add({
            data: {
              spaceId: space._id,
              userId,
              status: 'active',
              grantedBy: user._id,
              createdAt: now,
              updatedAt: now,
            },
          }),
        ),
    );

    await transaction.collection('spaces').doc(space._id).update({
      data: {
        familyId: requested.length ? user.currentFamilyId : space.familyId || '',
        visibility: requested.length ? 'shared' : 'private',
        ...(data.name ? { name: String(data.name).trim() } : {}),
        ...(data.type ? { type: data.type } : {}),
        updatedAt: now,
      },
    });
  });
  return ok({ visibility: requested.length ? 'shared' : 'private', userIds: requested });
}

async function updateSpace(user, data) {
  const { space } = await requireSpaceAccess(user, data.spaceId, true);
  const name = String(data.name || '').trim();
  assert(name, 400, '请填写空间名称');
  assert(name.length <= 64, 400, '空间名称最多 64 个字');
  if (space.ownerId) {
    assert(space.ownerId === user._id, 403, '只有空间所有者可以修改个人空间');
    await updateSpaceSharing(user, {
      spaceId: space._id,
      userIds: data.shareUserIds || [],
      name,
      type: data.type || space.type || 'other',
    });
    return ok({ spaceId: space._id });
  }
  await db.collection('spaces').doc(space._id).update({
    data: {
      name,
      type: data.type || space.type || 'other',
      updatedAt: new Date(),
    },
  });
  return ok({ spaceId: space._id });
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  assert(!Number.isNaN(date.getTime()), 400, '日期格式不正确');
  return date;
}

async function createItem(user, data) {
  const name = String(data.name || '').trim();
  const quantity = Number(data.quantity);
  assert(name, 400, '请填写物品名称');
  assert(Number.isFinite(quantity) && quantity > 0, 400, '数量必须大于 0');

  const { space } = await requireSpaceAccess(user, data.spaceId, true);
  const ownership = ownershipFromSpace(space);
  const unit = String(data.unit || '件').trim() || '件';
  const category = String(data.category || '').trim();
  const barcode = String(data.barcode || '').trim();
  const where = ownership.familyId
    ? { familyId: ownership.familyId, ownerId: '', name }
    : { familyId: '', ownerId: ownership.ownerId, name };
  const matches = await db.collection('items').where(where).limit(20).get();
  const item = (matches.data || []).find(
    (row) => !row.deletedAt && row.unit === unit && (!barcode || !row.barcode || row.barcode === barcode),
  );
  const now = new Date();

  const productionDate = normalizeDate(data.productionDate);
  const expiryDate = normalizeDate(data.expiryDate);
  const ids = await withTransaction(async (transaction) => {
    let itemId = item && item._id;
    if (!itemId) {
      const itemResult = await transaction.collection('items').add({
        data: {
          ...ownership,
          name,
          category,
          barcode,
          imageUrl: '',
          unit,
          defaultShelfLifeDays: data.defaultShelfLifeDays ? Number(data.defaultShelfLifeDays) : null,
          createdBy: user._id,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      });
      itemId = itemResult._id;
    }

    const batchResult = await transaction.collection('item_batches').add({
      data: {
        itemId,
        spaceId: space._id,
        ...ownership,
        quantity,
        productionDate,
        expiryDate,
        openedAt: null,
        afterOpeningDays: data.afterOpeningDays ? Number(data.afterOpeningDays) : null,
        status: 'normal',
        note: String(data.note || ''),
        createdBy: user._id,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      },
    });

    await transaction.collection('stock_events').add({
      data: {
        batchId: batchResult._id,
        userId: user._id,
        type: 'in',
        quantity,
        fromSpaceId: '',
        toSpaceId: space._id,
        note: '录入物品',
        createdAt: now,
      },
    });
    return { itemId, batchId: batchResult._id };
  });

  return ok(ids);
}

function expiryView(expiryDate) {
  if (!expiryDate) return { expiry: '长期保存', expiryDate: '', daysToExpiry: null, level: '', tone: '' };
  const expiry = new Date(expiryDate);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const days = Math.round((target.getTime() - start.getTime()) / 86400000);
  if (days <= 0) {
    return { expiry: days < 0 ? '已过期' : '今天到期', expiryDate: expiry.toISOString(), daysToExpiry: days, level: 'today', tone: 'red' };
  }
  if (days <= 3) {
    return { expiry: `${days} 天后到期`, expiryDate: expiry.toISOString(), daysToExpiry: days, level: 'soon', tone: 'orange' };
  }
  const label = `${expiry.getMonth() + 1} 月 ${expiry.getDate()} 日`;
  return { expiry: label, expiryDate: expiry.toISOString(), daysToExpiry: days, level: days <= 7 ? 'watch' : '', tone: days <= 7 ? 'green' : '' };
}

async function listItems(user, data = {}) {
  const accessible = await getAccessibleSpaces(user);
  const requestedSpaceId = data.spaceId || '';
  const entries = requestedSpaceId
    ? accessible.filter((entry) => entry.space._id === requestedSpaceId)
    : accessible;
  if (requestedSpaceId) assert(entries.length, 403, '无权访问该空间');

  const batchRows = await Promise.all(
    entries.map(async (entry) => {
      const rows = await queryAll('item_batches', { spaceId: entry.space._id });
      return rows
        .filter((batch) => !batch.archivedAt && Number(batch.quantity) > 0)
        .map((batch) => ({ batch, entry }));
    }),
  );
  const flattened = batchRows.flat();
  const itemIds = Array.from(new Set(flattened.map(({ batch }) => batch.itemId)));
  const itemPairs = await Promise.all(itemIds.map(async (id) => [id, await safeDoc('items', id)]));
  const itemById = new Map(itemPairs.filter(([, item]) => item && !item.deletedAt));
  const keyword = String(data.keyword || '').trim().toLowerCase();
  const requestedItemId = data.itemId || '';
  const grouped = new Map();

  flattened.forEach(({ batch, entry }) => {
    const item = itemById.get(batch.itemId);
    if (
      !item ||
      !ownershipMatches(item, batch, entry.space) ||
      (requestedItemId && item._id !== requestedItemId)
    ) return;
    const searchable = `${item.name} ${item.category || ''} ${entry.space.name}`.toLowerCase();
    if (keyword && !searchable.includes(keyword)) return;
    const expiry = expiryView(batch.expiryDate);
    const batchView = {
      id: batch._id,
      quantity: Number(batch.quantity),
      amount: `${batch.quantity} ${item.unit || '件'}`,
      spaceId: entry.space._id,
      spaceName: entry.space.name,
      canEdit: entry.access !== 'view',
      ...expiry,
    };
    if (!grouped.has(item._id)) {
      grouped.set(item._id, {
        id: item._id,
        name: item.name,
        category: item.category || '未分类',
        unit: item.unit || '件',
        icon: 'bag',
        iconColor: '#7b8a46',
        iconBg: item.category === '食品' ? 'food' : 'goods',
        quantity: 0,
        batches: [],
        places: new Set(),
        canEdit: false,
      });
    }
    const view = grouped.get(item._id);
    view.quantity += Number(batch.quantity);
    view.batches.push(batchView);
    view.places.add(entry.space.name);
    view.canEdit = view.canEdit || batchView.canEdit;
  });

  const items = Array.from(grouped.values()).map((item) => {
    item.batches.sort((left, right) => {
      if (!left.expiryDate) return 1;
      if (!right.expiryDate) return -1;
      return left.expiryDate.localeCompare(right.expiryDate);
    });
    const nearest = item.batches[0] || expiryView(null);
    return {
      ...item,
      places: undefined,
      place: Array.from(item.places).join('、'),
      amount: `${item.quantity} ${item.unit}`,
      expiry: nearest.expiry,
      expiryDate: nearest.expiryDate,
      daysToExpiry: nearest.daysToExpiry,
      level: nearest.level,
      tone: nearest.tone,
    };
  });
  items.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
  return ok({ items });
}

async function getItem(user, data) {
  const result = await listItems(user, { itemId: data.itemId || data.id });
  const item = result.data.items[0];
  assert(item, 404, '物品不存在或无权访问');
  return ok({ item });
}

async function listExpiry(user) {
  const result = await listItems(user);
  const expiring = result.data.items.filter(
    (item) => item.daysToExpiry !== null && item.daysToExpiry <= 7,
  );
  return ok({
    total: expiring.length,
    groups: [
      { title: '今天到期', level: 'today', list: expiring.filter((item) => item.daysToExpiry <= 0) },
      { title: '3 天内到期', level: 'soon', list: expiring.filter((item) => item.daysToExpiry > 0 && item.daysToExpiry <= 3) },
      { title: '7 天内关注', level: 'watch', list: expiring.filter((item) => item.daysToExpiry > 3 && item.daysToExpiry <= 7) },
    ],
  });
}

async function archiveBatch(user, data) {
  const batch = await safeDoc('item_batches', data.batchId);
  assert(batch && !batch.archivedAt, 404, '批次不存在');
  const [{ space }, item] = await Promise.all([
    requireSpaceAccess(user, batch.spaceId, true),
    safeDoc('items', batch.itemId),
  ]);
  assert(item && ownershipMatches(item, batch, space), 409, '物品、批次与空间归属不一致');
  const now = new Date();
  await withTransaction(async (transaction) => {
    await transaction.collection('item_batches').doc(batch._id).update({
      data: { quantity: 0, status: 'consumed', archivedAt: now, updatedAt: now },
    });
    await transaction.collection('stock_events').add({
      data: {
        batchId: batch._id,
        userId: user._id,
        type: 'out',
        quantity: Number(batch.quantity || 0),
        fromSpaceId: batch.spaceId,
        toSpaceId: '',
        note: '清空批次',
        createdAt: now,
      },
    });
  });
  return ok({ batchId: batch._id });
}

function shoppingScope(user, requested) {
  if (requested === 'family') {
    assert(user.currentFamilyId, 400, '请先加入家庭');
    return { familyId: user.currentFamilyId, ownerId: '' };
  }
  return { familyId: '', ownerId: user._id };
}

async function listShopping(user) {
  const personal = await queryAll('shopping_items', { ownerId: user._id });
  let family = [];
  if (user.currentFamilyId && (await getActiveMember(user.currentFamilyId, user._id))) {
    family = await queryAll('shopping_items', { familyId: user.currentFamilyId });
  }
  const items = [...personal, ...family]
    .filter((item) => item.status !== 'cancelled')
    .map((item) => ({
      id: item._id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || '件',
      amount: `${item.quantity} ${item.unit || '件'}`,
      status: item.status,
      done: item.status === 'bought',
      scope: item.familyId ? 'family' : 'personal',
    }));
  return ok({ items });
}

async function addShopping(user, data) {
  const name = String(data.name || '').trim();
  const quantity = Number(data.quantity || 1);
  assert(name, 400, '请填写购物项名称');
  assert(Number.isFinite(quantity) && quantity > 0, 400, '数量必须大于 0');
  const scope = shoppingScope(user, data.scope || (user.currentFamilyId ? 'family' : 'personal'));
  if (scope.familyId) assert(await getActiveMember(scope.familyId, user._id), 403, '你已不在该家庭中');
  if (data.spaceId) {
    const { space } = await requireSpaceAccess(user, data.spaceId, true);
    const spaceScope = ownershipFromSpace(space);
    assert(
      spaceScope.familyId === scope.familyId && spaceScope.ownerId === scope.ownerId,
      400,
      '购物项归属与计划存放空间不一致',
    );
  }
  const now = new Date();
  const result = await db.collection('shopping_items').add({
    data: {
      ...scope,
      spaceId: data.spaceId || '',
      name,
      quantity,
      unit: String(data.unit || '件'),
      status: 'pending',
      relatedItemId: data.relatedItemId || '',
      convertedBatchId: '',
      createdBy: user._id,
      boughtBy: '',
      boughtAt: null,
      createdAt: now,
      updatedAt: now,
    },
  });
  return ok({ shoppingItemId: result._id });
}

async function toggleShopping(user, data) {
  const item = await safeDoc('shopping_items', data.shoppingItemId || data.id);
  assert(item, 404, '购物项不存在');
  if (item.familyId) {
    assert(await getActiveMember(item.familyId, user._id), 403, '无权修改该家庭购物项');
  } else {
    assert(item.ownerId === user._id, 403, '无权修改该个人购物项');
  }
  const bought = data.bought !== undefined ? !!data.bought : item.status !== 'bought';
  await db.collection('shopping_items').doc(item._id).update({
    data: {
      status: bought ? 'bought' : 'pending',
      boughtBy: bought ? user._id : '',
      boughtAt: bought ? new Date() : null,
      updatedAt: new Date(),
    },
  });
  return ok({ shoppingItemId: item._id, status: bought ? 'bought' : 'pending' });
}

const handlers = {
  listSpaces,
  getSpace,
  createSpace,
  updateSpace,
  updateSpaceSharing,
  createItem,
  listItems,
  getItem,
  listExpiry,
  archiveBatch,
  listShopping,
  addShopping,
  toggleShopping,
};

exports.main = async (event = {}) => {
  try {
    const user = await getCurrentUser();
    const handler = handlers[event.action];
    assert(handler, 400, `unknown action: ${event.action || ''}`);
    return await handler(user, event);
  } catch (error) {
    console.error(error);
    return {
      code: error.code || 500,
      success: false,
      message: error.message || '操作失败',
    };
  }
};

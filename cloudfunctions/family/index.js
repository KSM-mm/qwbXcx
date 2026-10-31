const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const PAGE_SIZE = 100;

function fail(code, message) {
  return { code, success: false, message };
}

function ok(data) {
  return { code: 200, success: true, data };
}

async function queryAll(collection, where, offset = 0, result = []) {
  const page = await db.collection(collection).where(where).skip(offset).limit(PAGE_SIZE).get();
  const rows = page.data || [];
  result.push(...rows);
  if (rows.length < PAGE_SIZE) return result;
  return queryAll(collection, where, offset + rows.length, result);
}

async function withTransaction(handler) {
  if (typeof db.runTransaction === 'function') {
    return db.runTransaction(handler);
  }
  return handler(db);
}

async function safeDoc(collection, id) {
  if (!id) return null;
  try {
    const res = await db.collection(collection).doc(id).get();
    return res.data || null;
  } catch (error) {
    return null;
  }
}

async function getUserByOpenid(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  return res.data[0] || null;
}

async function getActiveMember(familyId, userId) {
  const res = await db
    .collection('family_members')
    .where({ familyId, userId, status: 'active' })
    .limit(1)
    .get();
  return res.data[0] || null;
}

function familyView(family, member) {
  return {
    _id: family._id,
    name: family.name,
    ownerId: family.ownerId,
    role: member.role,
    status: member.status,
  };
}

async function revokeSpacePermissions(spaceId, now) {
  const permissions = await queryAll('space_permissions', { spaceId, status: 'active' });
  await Promise.all(
    permissions.map((permission) =>
      db.collection('space_permissions').doc(permission._id).update({
        data: { status: 'revoked', updatedAt: now },
      }),
    ),
  );
}

async function detachPersonalSpaces(userId, familyId, now) {
  const spaces = await queryAll('spaces', { ownerId: userId, familyId });
  await Promise.all(
    spaces.map(async (space) => {
      await db.collection('spaces').doc(space._id).update({
        data: { familyId: '', visibility: 'private', updatedAt: now },
      });
      await revokeSpacePermissions(space._id, now);
    }),
  );
}

async function createFamily(user, name) {
  const familyName = (name || '').trim();
  if (!familyName) return fail(400, '请填写家庭名称');
  if (familyName.length > 64) return fail(400, '家庭名称最多 64 个字');
  if (user.currentFamilyId) return fail(409, '已加入家庭，需先退出');

  const now = new Date();
  try {
    const familyId = await withTransaction(async (transaction) => {
      const currentUserResult = await transaction.collection('users').doc(user._id).get();
      const currentUser = currentUserResult.data;
      if (currentUser && currentUser.currentFamilyId) {
        const error = new Error('已加入家庭，需先退出');
        error.code = 409;
        throw error;
      }
      const familyAdd = await transaction.collection('families').add({
        data: {
          name: familyName,
          ownerId: user._id,
          status: 'active',
          dissolvedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      });
      const id = familyAdd._id;
      await transaction.collection('family_members').add({
        data: {
          familyId: id,
          userId: user._id,
          role: 'owner',
          status: 'active',
          joinedAt: now,
          leftAt: null,
        },
      });
      await transaction.collection('users').doc(user._id).update({
        data: {
          currentFamilyId: id,
          updatedAt: now,
        },
      });
      return id;
    });
    return ok({
      family: {
        _id: familyId,
        name: familyName,
        ownerId: user._id,
        role: 'owner',
        status: 'active',
      },
    });
  } catch (error) {
    return fail(error.code || 500, error.message || '创建家庭失败');
  }
}

async function getCurrent(user) {
  if (!user.currentFamilyId) return ok({ family: null });
  const family = await safeDoc('families', user.currentFamilyId);
  const member = await getActiveMember(user.currentFamilyId, user._id);
  if (!family || family.status === 'dissolved' || !member) {
    await db.collection('users').doc(user._id).update({
      data: { currentFamilyId: '', updatedAt: new Date() },
    });
    return ok({ family: null });
  }
  return ok({ family: familyView(family, member) });
}

async function leaveFamily(user) {
  if (!user.currentFamilyId) return fail(400, '当前未加入家庭');
  const member = await getActiveMember(user.currentFamilyId, user._id);
  if (!member) return fail(404, '未找到家庭成员记录');
  if (member.role === 'owner') return fail(403, '拥有者不能退出，请解散家庭');

  const now = new Date();
  try {
    await withTransaction(async (transaction) => {
      await transaction.collection('family_members').doc(member._id).update({
        data: { status: 'left', leftAt: now },
      });
      await transaction.collection('users').doc(user._id).update({
        data: { currentFamilyId: '', updatedAt: now },
      });
    });
    await detachPersonalSpaces(user._id, user.currentFamilyId, now);
    return ok({ family: null });
  } catch (error) {
    return fail(500, error.message || '退出失败');
  }
}

async function dissolveFamily(user) {
  if (!user.currentFamilyId) return fail(400, '当前未加入家庭');
  const family = await safeDoc('families', user.currentFamilyId);
  if (!family) return fail(404, '家庭不存在');
  if (family.ownerId !== user._id) return fail(403, '仅拥有者可解散家庭');

  const now = new Date();
  const membersRes = await db
    .collection('family_members')
    .where({ familyId: family._id, status: 'active' })
    .get();
  const members = membersRes.data || [];

  try {
    await withTransaction(async (transaction) => {
      const memberUsers = await Promise.all(
        members.map((item) => transaction.collection('users').doc(item.userId).get()),
      );
      await Promise.all(
        members.flatMap((item, index) => {
          const updates = [
            transaction.collection('family_members').doc(item._id).update({
              data: { status: 'left', leftAt: now },
            }),
          ];
          const memberUser = memberUsers[index].data;
          if (memberUser && memberUser.currentFamilyId === family._id) {
            updates.push(
              transaction.collection('users').doc(item.userId).update({
                data: { currentFamilyId: '', updatedAt: now },
              }),
            );
          }
          return updates;
        }),
      );
      await transaction.collection('families').doc(family._id).update({
        data: { status: 'dissolved', dissolvedAt: now, updatedAt: now },
      });
    });
    await Promise.all(members.map((item) => detachPersonalSpaces(item.userId, family._id, now)));
    return ok({ family: null });
  } catch (error) {
    return fail(500, error.message || '解散失败');
  }
}

async function listMembers(user) {
  if (!user.currentFamilyId) return fail(400, '当前未加入家庭');
  const current = await getActiveMember(user.currentFamilyId, user._id);
  if (!current) return fail(403, '你已不在该家庭中');
  const relations = await queryAll('family_members', {
    familyId: user.currentFamilyId,
    status: 'active',
  });
  const members = (
    await Promise.all(
      relations.map(async (relation) => {
        const memberUser = await safeDoc('users', relation.userId);
        if (!memberUser) return null;
        return {
        userId: memberUser._id,
        nickname: memberUser.nickname || memberUser.name || '微信用户',
        avatarUrl: memberUser.avatarUrl || memberUser.image || '',
        role: relation.role,
        self: memberUser._id === user._id,
        };
      }),
    )
  ).filter(Boolean);
  return ok({ members });
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return fail(401, '未获取到微信身份');

  const user = await getUserByOpenid(OPENID);
  if (!user) return fail(401, '请先登录');

  const action = event.action || 'get';
  if (action === 'create') return createFamily(user, event.name);
  if (action === 'get') return getCurrent(user);
  if (action === 'leave') return leaveFamily(user);
  if (action === 'dissolve') return dissolveFamily(user);
  if (action === 'members') return listMembers(user);
  return fail(400, `unknown action: ${action}`);
};

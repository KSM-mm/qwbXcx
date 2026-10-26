const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function fail(code, message) {
  return { code, success: false, message };
}

function ok(data) {
  return { code: 200, success: true, data };
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

async function createFamily(user, name) {
  const familyName = (name || '').trim();
  if (!familyName) return fail(400, '请填写家庭名称');
  if (familyName.length > 64) return fail(400, '家庭名称最多 64 个字');
  if (user.currentFamilyId) return fail(409, '已加入家庭，需先退出');

  const now = new Date();
  try {
    const familyId = await withTransaction(async (transaction) => {
      const familyAdd = await transaction.collection('families').add({
        data: {
          name: familyName,
          ownerId: user._id,
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
    return fail(500, error.message || '创建家庭失败');
  }
}

async function getCurrent(user) {
  if (!user.currentFamilyId) return ok({ family: null });
  const family = await safeDoc('families', user.currentFamilyId);
  const member = await getActiveMember(user.currentFamilyId, user._id);
  if (!family || !member) {
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
      for (let i = 0; i < members.length; i += 1) {
        const item = members[i];
        await transaction.collection('family_members').doc(item._id).update({
          data: { status: 'left', leftAt: now },
        });
        const userRes = await transaction.collection('users').doc(item.userId).get();
        const memberUser = userRes.data;
        if (memberUser && memberUser.currentFamilyId === family._id) {
          await transaction.collection('users').doc(item.userId).update({
            data: { currentFamilyId: '', updatedAt: now },
          });
        }
      }
      await transaction.collection('families').doc(family._id).update({
        data: { updatedAt: now },
      });
    });
    return ok({ family: null });
  } catch (error) {
    return fail(500, error.message || '解散失败');
  }
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
  return fail(400, `unknown action: ${action}`);
};

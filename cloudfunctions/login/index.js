const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function fail(code, message) {
  return { code, success: false, message };
}

function ok(data) {
  return { code: 200, success: true, data };
}

function toUser(doc) {
  return {
    _id: doc._id,
    openid: doc.openid,
    nickname: doc.nickname || doc.name || '微信用户',
    avatarUrl: doc.avatarUrl || doc.image || '',
    phone: doc.phone || '',
    currentFamilyId: doc.currentFamilyId || '',
  };
}

async function getFamilyPayload(userId, familyId) {
  if (!familyId) return null;
  let family = null;
  try {
    const familyRes = await db.collection('families').doc(familyId).get();
    family = familyRes.data;
  } catch (error) {
    family = null;
  }
  const memberRes = await db
    .collection('family_members')
    .where({ familyId, userId, status: 'active' })
    .limit(1)
    .get();
  const member = memberRes.data[0];
  if (!family || family.status === 'dissolved' || !member) return null;
  return {
    _id: family._id,
    name: family.name,
    ownerId: family.ownerId,
    role: member.role,
    status: member.status,
  };
}

exports.main = async () => {
  const { OPENID, UNIONID } = cloud.getWXContext();
  if (!OPENID) return fail(401, '未获取到微信身份');

  const users = db.collection('users');
  const now = new Date();
  const existed = await users.where({ openid: OPENID }).limit(1).get();
  let doc = existed.data[0];

  if (!doc) {
    const addRes = await users.add({
      data: {
        openid: OPENID,
        unionid: UNIONID || '',
        nickname: '微信用户',
        avatarUrl: '',
        phone: '',
        currentFamilyId: '',
        createdAt: now,
        updatedAt: now,
      },
    });
    doc = {
      _id: addRes._id,
      openid: OPENID,
      unionid: UNIONID || '',
      nickname: '微信用户',
      avatarUrl: '',
      phone: '',
      currentFamilyId: '',
    };
  } else {
    const patch = { updatedAt: now };
    if (UNIONID && doc.unionid !== UNIONID) patch.unionid = UNIONID;
    if (!doc.nickname && doc.name) patch.nickname = doc.name;
    if (!doc.avatarUrl && doc.image) patch.avatarUrl = doc.image;
    if (Object.keys(patch).length > 1) {
      await users.doc(doc._id).update({ data: patch });
      Object.assign(doc, patch);
    }
  }

  const user = toUser(doc);
  const family = await getFamilyPayload(user._id, user.currentFamilyId);
  if (user.currentFamilyId && !family) {
    await users.doc(user._id).update({ data: { currentFamilyId: '', updatedAt: now } });
    user.currentFamilyId = '';
  }

  return ok({
    token: user._id,
    user,
    family,
  });
};

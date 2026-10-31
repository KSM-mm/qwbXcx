function unwrap(res) {
  const result = (res && res.result) || {};
  if (result.code === 200 || result.success) return result;
  const error = new Error(result.message || '云函数调用失败');
  error.result = result;
  throw error;
}

export function callLogin() {
  return wx.cloud.callFunction({ name: 'login' }).then(unwrap);
}

export function callFamily(action, data = {}) {
  return wx.cloud.callFunction({ name: 'family', data: { action, ...data } }).then(unwrap);
}

export function callInventory(action, data = {}) {
  return wx.cloud.callFunction({ name: 'inventory', data: { action, ...data } }).then(unwrap);
}

export function saveSession(payload) {
  const { token, user, family } = payload.data || payload;
  wx.setStorageSync('access_token', token || (user && user._id) || '');
  wx.setStorageSync('user', user || null);
  wx.setStorageSync('family', family || null);
  const app = getApp();
  if (app) {
    app.globalData.userInfo = user || null;
    app.globalData.family = family || null;
  }
}

export function clearSession() {
  wx.removeStorageSync('access_token');
  wx.removeStorageSync('user');
  wx.removeStorageSync('family');
  const app = getApp();
  if (app) {
    app.globalData.userInfo = null;
    app.globalData.family = null;
  }
}

export function getSession() {
  return {
    token: wx.getStorageSync('access_token') || '',
    user: wx.getStorageSync('user') || null,
    family: wx.getStorageSync('family') || null,
  };
}

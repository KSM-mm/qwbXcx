import { getSession } from '~/api/cloud';

export function ensureSession() {
  const session = getSession();
  if (!session.user) {
    wx.redirectTo({ url: '/pages/login/login' });
    return null;
  }
  return session;
}

export function ensureFamily() {
  const session = ensureSession();
  if (!session) return null;
  if (!session.family) {
    wx.redirectTo({ url: '/pages/family/create' });
    return null;
  }
  return session;
}

export function roleText(role) {
  if (role === 'owner' || role === 'admin') return '管理员';
  if (role === 'member') return '可编辑';
  return role || '';
}

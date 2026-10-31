import { callFamily, getSession, saveSession } from '~/api/cloud';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],
  data: {
    name: '',
    canSubmit: false,
    loading: false,
  },

  onLoad() {
    const { user, family } = getSession();
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    if (family) {
      wx.switchTab({ url: '/pages/home/index' });
    }
  },

  onNameChange(e) {
    const name = (e.detail.value || '').trim();
    this.setData({
      name: e.detail.value || '',
      canSubmit: !!name,
    });
  },

  async onCreate() {
    if (!this.data.canSubmit || this.data.loading) return;
    this.setData({ loading: true });
    try {
      const result = await callFamily('create', { name: this.data.name.trim() });
      const session = getSession();
      saveSession({
        token: session.token,
        user: { ...session.user, currentFamilyId: result.data.family._id },
        family: result.data.family,
      });
      wx.switchTab({ url: '/pages/home/index' });
    } catch (error) {
      this.onShowToast('#t-toast', error.message || '创建失败');
    } finally {
      this.setData({ loading: false });
    }
  },
});

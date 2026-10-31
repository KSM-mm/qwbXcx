import { callLogin, getSession, saveSession } from '~/api/cloud';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],
  data: {
    isCheck: false,
    loading: false,
  },

  onLoad() {
    const { user, family } = getSession();
    if (user && family) {
      wx.switchTab({ url: '/pages/home/index' });
    } else if (user && !family) {
      wx.redirectTo({ url: '/pages/family/create' });
    }
  },

  onToggleAgree() {
    this.setData({ isCheck: !this.data.isCheck });
  },

  async loginWithWeChat() {
    if (this.data.loading) return;
    if (!this.data.isCheck) {
      this.onShowToast('#t-toast', '请先阅读并同意用户协议');
      return;
    }
    this.setData({ loading: true });
    try {
      const result = await callLogin();
      saveSession(result);
      if (result.data.family) {
        wx.switchTab({ url: '/pages/home/index' });
      } else {
        wx.redirectTo({ url: '/pages/family/create' });
      }
    } catch (error) {
      this.onShowToast('#t-toast', error.message || '登录失败');
    } finally {
      this.setData({ loading: false });
    }
  },
});

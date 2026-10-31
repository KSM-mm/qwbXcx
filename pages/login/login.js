import { callLogin, getSession, saveSession } from '~/api/cloud';

Page({
  data: {
    isCheck: false,
    loading: false,
  },

  onLoad() {
    const { user } = getSession();
    if (user) {
      wx.switchTab({ url: '/pages/home/index' });
    }
  },

  onToggleAgree() {
    this.setData({ isCheck: !this.data.isCheck });
  },

  async loginWithWeChat() {
    if (this.data.loading) return;
    if (!this.data.isCheck) {
      wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const result = await callLogin();
      saveSession(result);
      wx.switchTab({ url: '/pages/home/index' });
    } catch (error) {
      wx.showToast({ title: error.message || '登录失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});

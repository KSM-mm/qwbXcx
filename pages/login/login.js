import { callLogin, saveSession } from '~/api/cloud';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],
  data: {
    isCheck: false,
    radioValue: '',
    loading: false,
  },

  onCheckChange(e) {
    const { value } = e.detail;
    this.setData({
      radioValue: value,
      isCheck: value === 'agree',
    });
  },

  async loginWithWeChat() {
    if (!this.data.isCheck || this.data.loading) return;
    this.setData({ loading: true });
    try {
      const result = await callLogin();
      saveSession(result);
      if (result.data.family) {
        wx.switchTab({ url: '/pages/my/index' });
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

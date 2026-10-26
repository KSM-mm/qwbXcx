import { callFamily, clearSession, getSession, saveSession } from '~/api/cloud';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    personalInfo: {},
    family: null,
    isOwner: false,
  },

  onShow() {
    const { token, user, family } = getSession();
    if (!token || !user) {
      this.setData({ isLoad: false, personalInfo: {}, family: null, isOwner: false });
      return;
    }
    this.setData({
      isLoad: true,
      personalInfo: {
        name: user.nickname || '微信用户',
        image: user.avatarUrl || '',
        star: family ? family.role : '',
        city: family ? family.name : '未加入家庭',
      },
      family,
      isOwner: !!(family && family.role === 'owner'),
    });
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  onCreateFamily() {
    wx.navigateTo({ url: '/pages/family/create' });
  },

  onNavigateTo() {
    wx.navigateTo({ url: '/pages/my/info-edit/index' });
  },

  async onLeaveFamily() {
    wx.showModal({
      title: '退出家庭',
      content: '退出后需重新加入或创建家庭',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await callFamily('leave');
          const session = getSession();
          saveSession({ token: session.token, user: { ...session.user, currentFamilyId: '' }, family: null });
          this.onShow();
        } catch (error) {
          this.onShowToast('#t-toast', error.message || '退出失败');
        }
      },
    });
  },

  async onDissolveFamily() {
    wx.showModal({
      title: '解散家庭',
      content: '所有成员将离开该家庭',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await callFamily('dissolve');
          const session = getSession();
          saveSession({ token: session.token, user: { ...session.user, currentFamilyId: '' }, family: null });
          this.onShow();
        } catch (error) {
          this.onShowToast('#t-toast', error.message || '解散失败');
        }
      },
    });
  },

  onLogout() {
    clearSession();
    this.onShow();
  },
});

import { getSpaces } from '~/utils/qi-data';
import { callFamily, getSession, saveSession } from '~/api/cloud';
import { ensureSession, roleText } from '~/utils/auth';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],
  data: {
    spaces: [],
    family: null,
    familyName: '',
    roleLabel: '',
    isOwner: false,
    memberCount: 1,
  },
  onShow() {
    const session = ensureSession();
    if (!session) return;
    this.setData({
      spaces: getSpaces().slice(0, 3),
      family: session.family,
      familyName: session.family.name,
      roleLabel: roleText(session.family.role),
      isOwner: session.family.role === 'owner',
      memberCount: 1,
    });
  },
  goSpace(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/space/index?id=${id}` });
  },
  goMembers() {
    wx.navigateTo({ url: '/pages/members/index' });
  },
  goInvite() {
    this.onShowToast('#t-toast', '邀请功能暂未开放');
  },
  goSpaceForm() {
    wx.navigateTo({ url: '/pages/space/form' });
  },
  onLeaveFamily() {
    wx.showModal({
      title: '退出家庭',
      content: '退出后需重新创建或加入家庭',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await callFamily('leave');
          const session = getSession();
          saveSession({ token: session.token, user: { ...session.user, currentFamilyId: '' }, family: null });
          wx.redirectTo({ url: '/pages/family/create' });
        } catch (error) {
          this.onShowToast('#t-toast', error.message || '退出失败');
        }
      },
    });
  },
  onDissolveFamily() {
    wx.showModal({
      title: '解散家庭',
      content: '所有成员将离开该家庭',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await callFamily('dissolve');
          const session = getSession();
          saveSession({ token: session.token, user: { ...session.user, currentFamilyId: '' }, family: null });
          wx.redirectTo({ url: '/pages/family/create' });
        } catch (error) {
          this.onShowToast('#t-toast', error.message || '解散失败');
        }
      },
    });
  },
});

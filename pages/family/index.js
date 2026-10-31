import { callFamily, callInventory, getSession, saveSession } from '~/api/cloud';
import { ensureFamily, roleText } from '~/utils/auth';

Page({
  data: {
    spaces: [],
    family: null,
    familyName: '',
    roleLabel: '',
    isOwner: false,
    memberCount: 1,
  },
  async onShow() {
    const session = ensureFamily();
    if (!session) return;
    try {
      const [spaceResult, memberResult] = await Promise.all([
        callInventory('listSpaces'),
        callFamily('members'),
      ]);
      this.setData({
        spaces: spaceResult.data.spaces.filter((space) => !space.isPersonal),
        family: session.family,
        familyName: session.family.name,
        roleLabel: roleText(session.family.role),
        isOwner: session.family.role === 'owner',
        memberCount: memberResult.data.members.length,
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  goSpace(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/space/index?id=${id}` });
  },
  goMembers() {
    wx.navigateTo({ url: '/pages/members/index' });
  },
  goInvite() {
    wx.showToast({ title: '邀请功能暂未开放', icon: 'none' });
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
          wx.switchTab({ url: '/pages/home/index' });
        } catch (error) {
          wx.showToast({ title: error.message || '退出失败', icon: 'none' });
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
          wx.switchTab({ url: '/pages/home/index' });
        } catch (error) {
          wx.showToast({ title: error.message || '解散失败', icon: 'none' });
        }
      },
    });
  },
});

import { callInventory, getSession } from '~/api/cloud';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    spaces: [],
    statusBarHeight: 20,
    familyName: '个人空间',
    hasFamily: false,
    expiryCount: 0,
    expirySummary: '暂无需要处理的临期物品',
  },
  onLoad() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: info.statusBarHeight || 20,
    });
  },
  async onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'home' });
    }
    const session = ensureSession();
    if (!session) return;
    try {
      const [spaceResult, expiryResult] = await Promise.all([
        callInventory('listSpaces'),
        callInventory('listExpiry'),
      ]);
      const expiryItems = expiryResult.data.groups.reduce((list, group) => [...list, ...group.list], []);
      this.setData({
        spaces: spaceResult.data.spaces,
        familyName: session.family ? session.family.name : '个人空间',
        hasFamily: !!session.family,
        expiryCount: expiryResult.data.total,
        expirySummary: expiryItems.length
          ? expiryItems.slice(0, 2).map((item) => `${item.name}${item.expiry}`).join('，')
          : '暂无需要处理的临期物品',
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  goFamily() {
    const { family } = getSession();
    wx.navigateTo({ url: family ? '/pages/family/index' : '/pages/family/create' });
  },
  goMembers() {
    const { family } = getSession();
    wx.navigateTo({ url: family ? '/pages/members/index' : '/pages/family/create' });
  },
  goExpiry() {
    wx.switchTab({ url: '/pages/expiry/index' });
  },
  goSpaceForm() {
    wx.navigateTo({ url: '/pages/space/form' });
  },
  goSpace(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/space/index?id=${id}` });
  },
  goScan() {
    wx.navigateTo({ url: '/pages/scan/index' });
  },
  goVoice() {
    wx.navigateTo({ url: '/pages/voice/index?mode=add' });
  },
});

import { getSpaces } from '~/utils/qi-data';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    spaces: [],
    statusBarHeight: 20,
    familyName: '',
  },
  onLoad() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      spaces: getSpaces(),
      statusBarHeight: info.statusBarHeight || 20,
    });
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'home' });
    }
    const session = ensureSession();
    if (!session) return;
    this.setData({ familyName: session.family.name });
  },
  goFamily() {
    wx.navigateTo({ url: '/pages/family/index' });
  },
  goMembers() {
    wx.navigateTo({ url: '/pages/members/index' });
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

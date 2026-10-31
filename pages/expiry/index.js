import { callInventory } from '~/api/cloud';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    groups: [],
    total: 0,
  },
  async onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'expiry' });
    }
    if (!ensureSession()) return;
    try {
      const result = await callInventory('listExpiry');
      this.setData({ groups: result.data.groups, total: result.data.total });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
});

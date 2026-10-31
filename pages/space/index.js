import { callInventory } from '~/api/cloud';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    space: {},
    items: [],
    sheet: false,
    spaceId: '',
  },
  onLoad(query) {
    this.setData({ spaceId: query.id || '' });
  },
  async onShow() {
    if (!ensureSession() || !this.data.spaceId) return;
    try {
      const [spaceResult, itemResult] = await Promise.all([
        callInventory('getSpace', { spaceId: this.data.spaceId }),
        callInventory('listItems', { spaceId: this.data.spaceId }),
      ]);
      const { space } = spaceResult.data;
      let pillText = '家庭共享空间';
      let pillTone = 'green';
      if (space.isPersonal) {
        pillText = space.visibility === 'shared' ? '个人空间 · 已共享' : '仅自己可见';
        pillTone = 'purple';
      }
      this.setData({
        space,
        items: itemResult.data.items,
        guideText: space.canEdit
          ? '物品可按批次记录数量和到期日；点击右下角添加可选择扫码、语音或手动录入。'
          : '空间所有者已向你开放只读权限，你不能修改其中的物品和库存。',
        pillText,
        pillTone,
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  onAdd() {
    if (!this.data.space.canEdit) return;
    this.setData({ sheet: true });
  },
  onCloseSheet() {
    this.setData({ sheet: false });
  },
  goScan() {
    wx.navigateTo({ url: '/pages/scan/index' });
  },
  goSearch() {
    wx.switchTab({ url: '/pages/search/index' });
  },
  goManage() {
    wx.navigateTo({ url: `/pages/space/form?id=${this.data.spaceId}` });
  },
});

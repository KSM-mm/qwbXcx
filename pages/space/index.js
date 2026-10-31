import { getSpace, getItems } from '~/utils/qi-data';

Page({
  data: {
    space: {},
    items: [],
    sheet: false,
  },
  onLoad(query) {
    const space = getSpace(query.id);
    this.setData({
      space,
      items: getItems(),
      guideText: space.shared
        ? '物品可按批次记录数量和到期日；点击右下角添加可选择扫码、语音或手动录入。'
        : '这是仅自己可见的私人空间，家庭成员无法查看其中物品。',
      pillText: space.shared ? '家庭共享空间' : '仅自己可见',
      pillTone: space.shared ? 'green' : 'purple',
    });
  },
  onAdd() {
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
});

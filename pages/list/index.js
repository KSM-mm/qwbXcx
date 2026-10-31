import { getShopping } from '~/utils/qi-data';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    pending: [],
    done: [],
    sheet: false,
    toast: '',
    checkedMap: {},
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'list' });
    }
    if (!ensureSession()) return;
    const list = getShopping();
    this.setData({
      pending: list.filter((item) => !item.done),
      done: list.filter((item) => item.done),
    });
  },
  onToggle(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ [`checkedMap.${id}`]: !this.data.checkedMap[id] });
  },
  onAdd() {
    this.setData({ sheet: true });
  },
  onCloseSheet() {
    this.setData({ sheet: false });
  },
  onKeepAdd() {
    this.setData({ sheet: false, toast: '已加入购物清单' });
    setTimeout(() => this.setData({ toast: '' }), 1800);
  },
  onViewStock() {
    this.setData({ sheet: false });
    wx.setStorageSync('searchKeyword', '纸巾');
    wx.switchTab({ url: '/pages/search/index' });
  },
  noop() {},
});

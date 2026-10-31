import { filterItems } from '~/utils/qi-data';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    search: '',
    history: ['纸巾', '牛奶', '洗衣凝珠'],
    hints: ['“保质期快到了的食物”', '“玄关柜里有什么”', '“还有多少纸巾”'],
    results: [],
    statusBarHeight: 20,
  },
  onLoad() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({ statusBarHeight: info.statusBarHeight || 20 });
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'search' });
    }
    if (!ensureSession()) return;
    const search = wx.getStorageSync('searchKeyword') || this.data.search;
    if (wx.getStorageSync('searchKeyword')) wx.removeStorageSync('searchKeyword');
    this.setData({ search, results: filterItems(search) });
  },
  onBack() {
    wx.switchTab({ url: '/pages/home/index' });
  },
  onInput(e) {
    const search = e.detail.value;
    this.setData({ search, results: filterItems(search) });
  },
  onClear() {
    this.setData({ search: '', results: filterItems('') });
  },
  onHistory(e) {
    const search = e.currentTarget.dataset.value;
    this.setData({ search, results: filterItems(search) });
  },
});

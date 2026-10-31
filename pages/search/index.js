import { callInventory } from '~/api/cloud';
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
  async onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'search' });
    }
    if (!ensureSession()) return;
    const search = wx.getStorageSync('searchKeyword') || this.data.search;
    if (wx.getStorageSync('searchKeyword')) wx.removeStorageSync('searchKeyword');
    this.setData({ search });
    if (search) await this.loadResults(search);
  },
  onBack() {
    wx.switchTab({ url: '/pages/home/index' });
  },
  onInput(e) {
    const search = e.detail.value;
    this.setData({ search });
    clearTimeout(this.searchTimer);
    if (!search.trim()) {
      this.setData({ results: [] });
      return;
    }
    this.searchTimer = setTimeout(() => this.loadResults(search), 250);
  },
  onClear() {
    this.setData({ search: '', results: [] });
  },
  onHistory(e) {
    const search = e.currentTarget.dataset.value;
    this.setData({ search });
    this.loadResults(search);
  },
  async loadResults(keyword) {
    try {
      const result = await callInventory('listItems', { keyword });
      if (this.data.search === keyword) this.setData({ results: result.data.items });
    } catch (error) {
      wx.showToast({ title: error.message || '搜索失败', icon: 'none' });
    }
  },
  onUnload() {
    clearTimeout(this.searchTimer);
  },
});

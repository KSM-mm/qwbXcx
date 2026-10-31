import { callInventory, getSession } from '~/api/cloud';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    pending: [],
    done: [],
    sheet: false,
    toast: '',
    checkedMap: {},
    addName: '',
    addQuantity: '1',
    addUnit: '件',
    addScope: 'personal',
    hasFamily: false,
  },
  async onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'list' });
    }
    if (!ensureSession()) return;
    const { family } = getSession();
    this.setData({ hasFamily: !!family, addScope: family ? 'family' : 'personal' });
    await this.loadList();
  },
  async loadList() {
    try {
      const result = await callInventory('listShopping');
      this.setData({
        pending: result.data.items.filter((item) => !item.done),
        done: result.data.items.filter((item) => item.done),
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  async onToggle(e) {
    const { id } = e.currentTarget.dataset;
    try {
      await callInventory('toggleShopping', { shoppingItemId: id, bought: true });
      await this.loadList();
    } catch (error) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  },
  onAdd() {
    this.setData({ sheet: true });
  },
  onCloseSheet() {
    this.setData({ sheet: false });
  },
  onAddField(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },
  onScope(e) {
    this.setData({ addScope: e.currentTarget.dataset.scope });
  },
  async onKeepAdd() {
    try {
      await callInventory('addShopping', {
        name: this.data.addName,
        quantity: this.data.addQuantity,
        unit: this.data.addUnit,
        scope: this.data.addScope,
      });
      this.setData({ sheet: false, addName: '', addQuantity: '1', toast: '已加入购物清单' });
      await this.loadList();
      setTimeout(() => this.setData({ toast: '' }), 1800);
    } catch (error) {
      wx.showToast({ title: error.message || '添加失败', icon: 'none' });
    }
  },
  onViewStock() {
    this.setData({ sheet: false });
    wx.setStorageSync('searchKeyword', '纸巾');
    wx.switchTab({ url: '/pages/search/index' });
  },
  noop() {},
});

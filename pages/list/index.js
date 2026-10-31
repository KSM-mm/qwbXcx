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
    adding: false,
  },
  async onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'list', hidden: false });
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
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden: true });
    }
  },
  onCloseSheet() {
    this.setData({ sheet: false });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden: false });
    }
  },
  onHide() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden: false, sheet: false });
    }
  },
  onAddField(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },
  onScope(e) {
    this.setData({ addScope: e.currentTarget.dataset.scope });
  },
  async onKeepAdd() {
    const name = this.data.addName.trim();
    const quantity = Number(this.data.addQuantity);
    if (!name) {
      wx.showToast({ title: '请填写物品名称', icon: 'none' });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      wx.showToast({ title: '数量必须大于 0', icon: 'none' });
      return;
    }
    if (this.data.adding) return;
    this.setData({ adding: true });
    try {
      await callInventory('addShopping', {
        name,
        quantity,
        unit: this.data.addUnit,
        scope: this.data.addScope,
      });
      this.setData({ sheet: false, addName: '', addQuantity: '1', toast: '已加入购物清单' });
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ hidden: false });
      }
      await this.loadList();
      setTimeout(() => this.setData({ toast: '' }), 1800);
    } catch (error) {
      wx.showToast({ title: error.message || error.errMsg || '添加失败', icon: 'none' });
    } finally {
      this.setData({ adding: false });
    }
  },
  onViewStock() {
    this.setData({ sheet: false });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden: false });
    }
    wx.setStorageSync('searchKeyword', '纸巾');
    wx.switchTab({ url: '/pages/search/index' });
  },
  noop() {},
});

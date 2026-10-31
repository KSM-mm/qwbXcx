import { callInventory } from '~/api/cloud';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    name: '',
    quantity: '1',
    unit: '件',
    category: '',
    expiryDate: '',
    spaces: [],
    spaceIndex: 0,
    loading: false,
    toast: '',
  },
  async onLoad(query) {
    if (!ensureSession()) return;
    try {
      const result = await callInventory('listSpaces');
      const spaces = result.data.spaces.filter((space) => space.canEdit);
      const requestedIndex = spaces.findIndex((space) => space.id === query.spaceId);
      this.setData({ spaces, spaceIndex: requestedIndex >= 0 ? requestedIndex : 0 });
    } catch (error) {
      wx.showToast({ title: error.message || '空间加载失败', icon: 'none' });
    }
  },
  onField(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },
  onSpaceChange(e) {
    this.setData({ spaceIndex: Number(e.detail.value) });
  },
  onDateChange(e) {
    this.setData({ expiryDate: e.detail.value });
  },
  async onSave() {
    if (this.data.loading) return;
    const space = this.data.spaces[this.data.spaceIndex];
    if (!space) {
      wx.showToast({ title: '请先创建可编辑空间', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const result = await callInventory('createItem', {
        name: this.data.name,
        quantity: this.data.quantity,
        unit: this.data.unit,
        category: this.data.category,
        expiryDate: this.data.expiryDate,
        spaceId: space.id,
      });
      this.setData({ toast: `已添加到${space.name}` });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/item/index?id=${result.data.itemId}` });
      }, 500);
    } catch (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});

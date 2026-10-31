import { callInventory } from '~/api/cloud';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    item: {},
    batches: [],
    sheet: false,
    toast: '',
    itemId: '',
    pendingBatchId: '',
  },
  onLoad(query) {
    this.setData({ itemId: query.id || '' });
  },
  async onShow() {
    if (!ensureSession() || !this.data.itemId) return;
    try {
      const result = await callInventory('getItem', { itemId: this.data.itemId });
      this.setData({ item: result.data.item, batches: result.data.item.batches });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  onDelete(e) {
    this.setData({ sheet: true, pendingBatchId: e.currentTarget.dataset.id });
  },
  onCancel() {
    this.setData({ sheet: false });
  },
  async onConfirmDelete() {
    try {
      await callInventory('archiveBatch', { batchId: this.data.pendingBatchId });
      this.setData({ sheet: false, pendingBatchId: '', toast: '批次已清空' });
      await this.onShow();
      setTimeout(() => this.setData({ toast: '' }), 1800);
    } catch (error) {
      this.setData({ sheet: false });
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  },
});

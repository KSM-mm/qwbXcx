import { getItem } from '~/utils/qi-data';

Page({
  data: {
    item: {},
    batches: [],
    sheet: false,
    toast: '',
  },
  onLoad(query) {
    const item = getItem(query.id);
    const batches = item.batches && item.batches.length
      ? item.batches
      : [{ amount: item.amount, expiry: item.expiry, level: item.level, tone: item.tone }];
    this.setData({ item, batches });
  },
  onDelete() {
    this.setData({ sheet: true });
  },
  onCancel() {
    this.setData({ sheet: false });
  },
  onConfirmDelete() {
    this.setData({ sheet: false, toast: '批次已清空' });
    setTimeout(() => this.setData({ toast: '' }), 1800);
  },
});

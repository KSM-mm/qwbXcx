import { addItem } from '~/utils/qi-data';

Page({
  data: {
    fields: [
      { label: '物品名称', value: '燕麦奶' },
      { label: '数量', value: '2' },
      { label: '单位', value: '盒' },
      { label: '存放空间', value: '厨房 · 储物柜' },
      { label: '到期日期', value: '2025 年 6 月 25 日' },
      { label: '分类', value: '食品' },
    ],
    toast: '',
  },
  onSave() {
    addItem();
    this.setData({ toast: '已添加到厨房' });
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/space/index?id=kitchen' });
    }, 500);
  },
});

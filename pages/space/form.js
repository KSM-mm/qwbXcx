Page({
  data: {
    name: '阳台储物柜',
    types: [
      { icon: 'box', label: '柜子' },
      { icon: 'fridge', label: '冰箱' },
      { icon: 'door', label: '抽屉' },
      { icon: 'more', label: '其他' },
    ],
    typeIndex: 0,
    privateOn: false,
    toast: '',
  },
  onName(e) {
    this.setData({ name: e.detail.value });
  },
  onType(e) {
    this.setData({ typeIndex: Number(e.currentTarget.dataset.index) });
  },
  onTogglePrivate() {
    this.setData({ privateOn: !this.data.privateOn });
  },
  onSave() {
    this.setData({ toast: '空间已创建' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/home/index' });
    }, 600);
  },
});

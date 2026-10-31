Page({
  data: {
    toast: '',
  },
  onEnter() {
    this.setData({ toast: '已进入厨房' });
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/space/index?id=kitchen' });
    }, 400);
  },
});

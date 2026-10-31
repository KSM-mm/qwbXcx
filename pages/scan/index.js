Page({
  data: {
    scanState: 'ready',
    toast: '',
  },
  onReadySuccess() {
    this.setData({ scanState: 'loading' });
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/scan/confirm' });
    }, 700);
  },
  onFail() {
    this.setData({ scanState: 'failed' });
  },
  onRetry() {
    this.setData({ scanState: 'ready' });
  },
  onManual() {
    wx.redirectTo({ url: '/pages/space/index?id=kitchen' });
  },
});

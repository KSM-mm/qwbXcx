Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    onClose() {
      this.triggerEvent('close');
    },
    noop() {},
    goScan() {
      this.triggerEvent('close');
      wx.navigateTo({ url: '/pages/scan/index' });
    },
    goVoice() {
      this.triggerEvent('close');
      wx.navigateTo({ url: '/pages/voice/index?mode=add' });
    },
    goForm() {
      this.triggerEvent('close');
      wx.navigateTo({ url: '/pages/item/form' });
    },
  },
});

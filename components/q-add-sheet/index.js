Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    spaceId: {
      type: String,
      value: '',
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
      const suffix = this.data.spaceId ? `&spaceId=${this.data.spaceId}` : '';
      wx.navigateTo({ url: `/pages/voice/index?mode=add${suffix}` });
    },
    goForm() {
      this.triggerEvent('close');
      const suffix = this.data.spaceId ? `?spaceId=${this.data.spaceId}` : '';
      wx.navigateTo({ url: `/pages/item/form${suffix}` });
    },
  },
});

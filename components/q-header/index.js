Component({
  options: {
    multipleSlots: true,
  },
  properties: {
    title: {
      type: String,
      value: '',
    },
    light: {
      type: Boolean,
      value: false,
    },
    showBack: {
      type: Boolean,
      value: true,
    },
  },
  data: {
    statusBarHeight: 20,
  },
  lifetimes: {
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.setData({ statusBarHeight: info.statusBarHeight || 20 });
    },
  },
  methods: {
    onBack() {
      wx.navigateBack({
        fail: () => wx.switchTab({ url: '/pages/home/index' }),
      });
    },
  },
});

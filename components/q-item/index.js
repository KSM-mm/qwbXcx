Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },
  methods: {
    onTap() {
      const { id } = this.data.item;
      wx.navigateTo({ url: `/pages/item/index?id=${id}` });
    },
  },
});

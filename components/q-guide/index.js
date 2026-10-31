Component({
  properties: {
    text: {
      type: String,
      value: '',
    },
  },
  data: {
    open: false,
  },
  methods: {
    onToggle() {
      this.setData({ open: !this.data.open });
    },
  },
});

Component({
  data: {
    value: 'home',
    hidden: false,
    sheet: false,
    list: [
      { icon: 'home', value: 'home', label: '首页', url: '/pages/home/index' },
      { icon: 'search', value: 'search', label: '搜索', url: '/pages/search/index' },
      { icon: 'clock', value: 'expiry', label: '临期', url: '/pages/expiry/index' },
      { icon: 'list', value: 'list', label: '清单', url: '/pages/list/index' },
    ],
  },
  lifetimes: {
    ready() {
      this.syncActive();
    },
  },
  pageLifetimes: {
    show() {
      this.syncActive();
    },
  },
  methods: {
    syncActive() {
      const pages = getCurrentPages();
      const curPage = pages[pages.length - 1];
      if (!curPage) return;
      const route = curPage.route || '';
      const found = this.data.list.find((item) => route.indexOf(`pages/${item.value}/`) !== -1);
      this.setData({ value: found ? found.value : 'home' });
    },
    onNav(e) {
      const { url } = e.currentTarget.dataset;
      wx.switchTab({ url });
    },
    onAdd() {
      this.setData({ sheet: true, hidden: true });
    },
    onCloseSheet() {
      this.setData({ sheet: false, hidden: false });
    },
  },
});

Page({
  data: {
    mode: 'add',
    voiceState: 'idle',
    waves: [16, 36, 56, 30, 68, 40, 20, 54, 28],
    statusText: '按住按钮，说给我听',
  },
  onLoad(query) {
    this.setData({ mode: query.mode === 'query' ? 'query' : 'add' });
  },
  setAdd() {
    this.setData({ mode: 'add' });
  },
  setQuery() {
    this.setData({ mode: 'query' });
  },
  onMic() {
    const { voiceState, mode } = this.data;
    if (voiceState === 'recording') {
      this.setData({ voiceState: 'parsing', statusText: '正在整理你的话…' });
      setTimeout(() => {
        if (mode === 'add') {
          wx.navigateTo({ url: '/pages/item/form' });
        } else {
          wx.setStorageSync('searchKeyword', '纸巾');
          wx.switchTab({ url: '/pages/search/index' });
        }
      }, 650);
    } else {
      this.setData({ voiceState: 'recording', statusText: '正在聆听…' });
    }
  },
  onFail() {
    this.setData({ voiceState: 'failed', statusText: '没有听清楚' });
  },
  goForm() {
    wx.navigateTo({ url: '/pages/item/form' });
  },
});

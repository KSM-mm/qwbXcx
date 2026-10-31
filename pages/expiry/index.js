import { getItems } from '~/utils/qi-data';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    groups: [],
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'expiry' });
    }
    if (!ensureSession()) return;
    const items = getItems();
    this.setData({
      groups: [
        { title: '今天到期', level: 'today', list: items.filter((item) => item.level === 'today') },
        { title: '3 天内到期', level: 'soon', list: items.filter((item) => item.level === 'soon') },
        {
          title: '7 天内关注',
          level: 'watch',
          list: [
            {
              id: 99,
              name: '燕麦奶',
              amount: '2 盒',
              place: '厨房 · 储物柜',
              expiry: '6 月 25 日',
              level: 'watch',
              tone: 'green',
              category: '食品',
              icon: 'bag',
              iconColor: '#7b8a46',
              iconBg: 'food',
            },
          ],
        },
      ],
    });
  },
});

export const spaces = [
  {
    id: 'kitchen',
    name: '厨房',
    sub: '23 件物品',
    icon: 'box',
    tint: '#e3f0e3',
    image: '#bdd9bd',
    count: 23,
    stock: 57,
    shared: true,
  },
  {
    id: 'fridge',
    name: '冰箱',
    sub: '9 件物品 · 2 件临期',
    icon: 'fridge',
    tint: '#dcedef',
    image: '#b4d1d5',
    count: 9,
    stock: 18,
    shared: true,
  },
  {
    id: 'entry',
    name: '玄关柜',
    sub: '17 件物品',
    icon: 'door',
    tint: '#f6ead4',
    image: '#dfc08b',
    count: 17,
    stock: 32,
    shared: true,
  },
  {
    id: 'private',
    name: '我的私人空间',
    sub: '6 件物品 · 仅自己可见',
    icon: 'lock',
    tint: '#eee7f4',
    image: '#d0bde1',
    count: 6,
    stock: 8,
    shared: false,
  },
];

let items = [
  {
    id: 1,
    name: '鲜牛奶',
    amount: '2 盒',
    place: '冰箱 · 冷藏层',
    expiry: '今天到期',
    level: 'today',
    tone: 'red',
    category: '食品',
    icon: 'bag',
    iconColor: '#7b8a46',
    iconBg: 'food',
    batches: [
      { amount: '1 盒', expiry: '今天到期', level: 'today', tone: 'red' },
      { amount: '1 盒', expiry: '6 月 18 日', level: 'watch', tone: 'green' },
    ],
  },
  {
    id: 2,
    name: '意面',
    amount: '3 包',
    place: '厨房 · 储物柜',
    expiry: '6 月 16 日',
    level: 'soon',
    tone: 'orange',
    category: '食品',
    icon: 'bag',
    iconColor: '#7b8a46',
    iconBg: 'food',
    batches: [{ amount: '3 包', expiry: '6 月 16 日', level: 'soon', tone: 'orange' }],
  },
  {
    id: 3,
    name: '洗衣凝珠',
    amount: '18 颗',
    place: '玄关柜 · 下层',
    expiry: '2026 年 3 月',
    category: '日用品',
    icon: 'box',
    iconColor: '#56829a',
    iconBg: 'goods',
  },
  {
    id: 4,
    name: '纸巾',
    amount: '6 包',
    place: '玄关柜 · 上层',
    expiry: '长期保存',
    category: '日用品',
    icon: 'box',
    iconColor: '#56829a',
    iconBg: 'goods',
  },
];

const shopping = [
  { id: 10, name: '垃圾袋', amount: '1 卷', done: false },
  { id: 11, name: '洗洁精', amount: '2 瓶', done: false },
  { id: 12, name: '鸡蛋', amount: '1 盒', done: false },
  { id: 13, name: '洗衣液', amount: '1 瓶', done: true },
];

const members = [
  { name: '林安', role: '管理员', initials: '林', color: '#f2c5a5', self: true, tone: 'green' },
  { name: '周周', role: '可编辑', initials: '周', color: '#bad3ed', self: false, tone: 'orange' },
];

export function getSpaces() {
  return spaces;
}

export function getSpace(id) {
  return spaces.find((space) => space.id === id) || spaces[0];
}

export function getItems() {
  return items;
}

export function getItem(id) {
  const num = Number(id);
  return items.find((item) => item.id === num) || items[0];
}

export function filterItems(keyword) {
  if (!keyword) return items;
  return items.filter((item) => item.name.includes(keyword) || item.place.includes(keyword));
}

export function addItem(item) {
  items = [
    ...items,
    {
      id: Date.now(),
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
      ...item,
    },
  ];
  return items[items.length - 1];
}

export function getShopping() {
  return shopping;
}

export function getMembers() {
  return members;
}

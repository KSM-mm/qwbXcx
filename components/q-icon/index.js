const ICON_MAP = {
  arrow: 'arrow-left',
  bag: 'cart',
  bell: 'notification',
  box: 'outbox',
  camera: 'camera',
  check: 'check',
  chevron: 'chevron-right',
  clock: 'time',
  close: 'close',
  door: 'logout',
  edit: 'edit',
  flash: 'flashlight',
  fridge: 'folder',
  home: 'home',
  image: 'image',
  key: 'key',
  list: 'list',
  lock: 'lock-on',
  mic: 'microphone',
  more: 'more',
  plus: 'plus',
  scan: 'scan',
  search: 'search',
  settings: 'setting',
  trash: 'delete',
  users: 'usergroup',
  voice: 'microphone',
};

Component({
  properties: {
    name: {
      type: String,
      value: 'home',
      observer(name) {
        this.setData({ iconName: ICON_MAP[name] || name });
      },
    },
    size: {
      type: Number,
      value: 40,
    },
    color: {
      type: String,
      value: 'currentColor',
    },
  },
  data: {
    iconName: 'home',
  },
  lifetimes: {
    attached() {
      const { name } = this.properties;
      this.setData({ iconName: ICON_MAP[name] || name });
    },
  },
});

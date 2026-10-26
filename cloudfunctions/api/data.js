const homeCards = [
  {
    url: '/static/home/card0.png',
    desc: '少年,星空与梦想',
    tags: [
      { text: 'AI绘画', theme: 'primary' },
      { text: '版权素材', theme: 'success' },
    ],
  },
  {
    url: '/static/home/card1.png',
    desc: '仰望星空的少女',
    tags: [
      { text: 'AI绘画', theme: 'primary' },
      { text: '版权素材', theme: 'success' },
    ],
  },
  {
    url: '/static/home/card3.png',
    desc: '仰望星空的少年',
    tags: [
      { text: 'AI绘画', theme: 'primary' },
      { text: '版权素材', theme: 'success' },
    ],
  },
  {
    url: '/static/home/card2.png',
    desc: '少年,星空与梦想',
    tags: [
      { text: 'AI绘画', theme: 'primary' },
      { text: '版权素材', theme: 'success' },
    ],
  },
  {
    url: '/static/home/card4.png',
    desc: '多彩的天空',
    tags: [
      { text: 'AI绘画', theme: 'primary' },
      { text: '版权素材', theme: 'success' },
    ],
  },
];

const homeSwipers = new Array(6).fill('/static/home/swiper0.png');

const serviceList = [
  { image: '/static/icon_wx.png', name: '微信', type: 'weixin', url: '' },
  { image: '/static/icon_qq.png', name: 'QQ', type: 'QQ', url: '' },
  { image: '/static/icon_doc.png', name: '腾讯文档', type: 'document', url: '' },
  { image: '/static/icon_map.png', name: '腾讯地图', type: 'map', url: '' },
  { image: '/static/icon_td.png', name: '数据中心', type: 'data', url: '/pages/dataCenter/index' },
  { image: '/static/icon_td.png', name: '数据中心', type: 'data', url: '/pages/dataCenter/index' },
  { image: '/static/icon_td.png', name: '数据中心', type: 'data', url: '/pages/dataCenter/index' },
  { image: '/static/icon_td.png', name: '数据中心', type: 'data', url: '/pages/dataCenter/index' },
];

const personalInfo = {
  image: '/static/avatar1.png',
  name: '小小轩',
  star: '天枰座',
  gender: 0,
  birth: '1994-09-27',
  address: ['440000', '440300'],
  brief: '在你身边，为你设计',
  photos: [],
};

const searchHistory = ['AI绘画', 'Stable Diffusion', '版权素材', '星空', 'illustration', '原创'];

const searchPopular = [
  '考研和靠边同时上岸应该怎么选？有哪些参考建议',
  '日常饮食中，如何选择优质蛋白',
  '你有没有网购维权成功的经历？求分享经验',
  '夏季带孩子旅游，你的必备物品有哪些',
  '在海外越卖越贵，中国汽车做对了什么',
  '当HR问你离职原因，怎么回答最能被接受',
];

const memberList = [
  { name: '浏览量', number: '202W' },
  { name: 'PV', number: '233W' },
  { name: 'UV', number: '102W' },
];

const interactionList = [
  { name: '浏览量', number: '919' },
  { name: '点赞量', number: '887' },
  { name: '分享量', number: '104' },
  { name: '收藏', number: '47' },
];

const completeRateList = [
  { time: '12:00', percentage: '80' },
  { time: '14:00', percentage: '60' },
  { time: '16:00', percentage: '85' },
  { time: '18:00', percentage: '43' },
  { time: '20:00', percentage: '60' },
  { time: '22:00', percentage: '95' },
];

const areaList = [
  { 标题: '视频A', 全球: '4442', 华北: '456', 华东: '456' },
  { 标题: '视频A', 全球: '4442', 华北: '456', 华东: '456' },
  { 标题: '视频A', 全球: '4442', 华北: '456', 华东: '456' },
  { 标题: '视频A', 全球: '4442', 华北: '456', 华东: '456' },
  { 标题: '视频A', 全球: '4442', 华北: '456', 华东: '456' },
  { 标题: '视频A', 全球: '4442', 华北: '456', 华东: '456' },
  { 标题: '视频A', 全球: '4442', 华北: '456', 华东: '456' },
  { 标题: '视频A', 全球: '4442', 华北: '456', 华东: '456' },
];

function wrapList(list) {
  return {
    template: {
      succ: {
        data: { list },
        statusCode: 200,
      },
    },
  };
}

function ok(data) {
  return { code: 200, success: true, data };
}

const routes = {
  '/home/cards': () => ok({ code: 200, message: '请求成功', data: homeCards }),
  '/home/swipers': () => ok({ code: 200, message: '请求成功', data: homeSwipers }),
  '/login/postPasswordLogin': (_data, openid) => ok({ message: '登录成功', token: openid }),
  '/login/getSendMessage': () => ok({ message: '发送成功' }),
  '/login/postCodeVerify': (_data, openid) => ok({ message: '验证码正确', token: openid }),
  '/api/getServiceList': () => ok({ code: 200, message: 'success', data: { service: serviceList } }),
  '/api/genPersonalInfo': () => ok({ code: 200, message: 'success', data: personalInfo }),
  '/api/searchHistory': () => ({
    code: 200,
    success: true,
    data: { historyWords: searchHistory },
  }),
  '/api/searchPopular': () => ({
    code: 200,
    success: true,
    data: { popularWords: searchPopular },
  }),
  '/dataCenter/member': () => ok(wrapList(memberList)),
  '/dataCenter/interaction': () => ok(wrapList(interactionList)),
  '/dataCenter/complete-rate': () => ok(wrapList(completeRateList)),
  '/dataCenter/area': () => ok(wrapList(areaList)),
};

module.exports = { routes, ok };

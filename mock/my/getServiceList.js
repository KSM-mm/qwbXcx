export default {
  path: '/api/getServiceList',
  data: {
    code: 200,
    message: 'success',
    data: {
      service: [
        { image: '/static/icons/image.svg', name: '微信', type: 'weixin', url: '' },
        { image: '/static/icons/image.svg', name: 'QQ', type: 'QQ', url: '' },
        { image: '/static/icons/image.svg', name: '腾讯文档', type: 'document', url: '' },
        { image: '/static/icons/image.svg', name: '腾讯地图', type: 'map', url: '' },
        { image: '/static/icons/image.svg', name: '数据中心', type: 'data', url: '/pages/dataCenter/index' },
        { image: '/static/icons/image.svg', name: '数据中心', type: 'data', url: '/pages/dataCenter/index' },
        { image: '/static/icons/image.svg', name: '数据中心', type: 'data', url: '/pages/dataCenter/index' },
        { image: '/static/icons/image.svg', name: '数据中心', type: 'data', url: '/pages/dataCenter/index' },
      ],
    },
  },
};

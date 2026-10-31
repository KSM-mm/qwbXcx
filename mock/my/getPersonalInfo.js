import { getLocalUrl } from '~/utils/util.js';

export default {
  path: '/api/genPersonalInfo',
  data: {
    code: 200,
    message: 'success',
    data: {
      image: '/static/chat/avatar.png',
      name: '小小轩',
      star: '天枰座',
      gender: 0,
      birth: '1994-09-27',
      address: ['440000', '440300'],
      brief: '在你身边，为你设计',
      photos: [
        {
          url: getLocalUrl('/static/image1.png', 'uploaded1.png'),
          name: 'uploaded1.png',
          type: 'image',
        },
        {
          url: getLocalUrl('/static/image2.png', 'uploaded2.png'),
          name: 'uploaded2.png',
          type: 'image',
        },
      ],
    },
  },
};

const cloud = require('wx-server-sdk');
const { routes } = require('./data');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const url = event.url || event.path;
  const data = event.data || {};
  const handler = routes[url];

  if (!handler) {
    return { code: 404, success: false, message: `unknown path: ${url}` };
  }

  try {
    return await handler(data, OPENID);
  } catch (error) {
    return { code: 500, success: false, message: error.message };
  }
};

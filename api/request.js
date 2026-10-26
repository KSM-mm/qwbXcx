import config from '~/config';

const { baseUrl } = config;
const delay = config.isMock ? 500 : 0;

function callCloud(url, method, data) {
  return wx.cloud.callFunction({
    name: 'api',
    data: { url, method, data },
  }).then((res) => {
    const result = res.result || {};
    if (result.code === 200 || result.success) {
      return result;
    }
    return Promise.reject(result);
  });
}

function callHttp(url, method, data) {
  const header = {
    'content-type': 'application/json',
  };
  const tokenString = wx.getStorageSync('access_token');
  if (tokenString) {
    header.Authorization = `Bearer ${tokenString}`;
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method,
      data,
      dataType: 'json',
      header,
      success(res) {
        setTimeout(() => {
          if (res.code === 200) {
            resolve(res);
          } else {
            reject(res);
          }
        }, delay);
      },
      fail(err) {
        setTimeout(() => {
          reject(err);
        }, delay);
      },
    });
  });
}

function request(url, method = 'GET', data = {}) {
  if (config.useCloud && !config.isMock) {
    return callCloud(url, method, data);
  }
  return callHttp(url, method, data);
}

export default request;

import { ensureSession, roleText } from '~/utils/auth';

Page({
  data: {
    members: [],
    roles: [
      { role: '管理员', desc: '管理成员、空间及所有共享物品', color: '#63a070' },
      { role: '可编辑', desc: '新增、修改和整理共享物品', color: '#d69a45' },
      { role: '仅查看', desc: '查看共享物品，不能编辑', color: '#8197aa' },
      { role: '无权限', desc: '无法访问此家庭', color: '#b9c0bc' },
    ],
  },
  onInvite() {
    wx.showToast({ title: '邀请功能暂未开放', icon: 'none' });
  },
  onShow() {
    const session = ensureSession();
    if (!session) return;
    const nickname = session.user.nickname || '微信用户';
    this.setData({
      members: [
        {
          name: nickname,
          initials: nickname.slice(0, 1),
          role: roleText(session.family.role),
          tone: 'green',
          color: '#f2c5a5',
          self: true,
        },
      ],
    });
  },
});

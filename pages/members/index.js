import { callFamily } from '~/api/cloud';
import { ensureFamily, roleText } from '~/utils/auth';

Page({
  data: {
    members: [],
    roles: [
      { role: '拥有者 / 管理员', desc: '管理成员、家庭空间及家庭物品', color: '#63a070' },
      { role: '家庭成员', desc: '新增、修改和整理家庭共享物品', color: '#d69a45' },
      { role: '个人空间访客', desc: '仅查看空间所有者明确共享的个人空间', color: '#8197aa' },
    ],
  },
  onInvite() {
    wx.showToast({ title: '邀请功能暂未开放', icon: 'none' });
  },
  async onShow() {
    const session = ensureFamily();
    if (!session) return;
    try {
      const result = await callFamily('members');
      this.setData({
        members: result.data.members.map((member) => ({
          ...member,
          name: member.nickname,
          initials: member.nickname.slice(0, 1),
          role: roleText(member.role),
          tone: member.role === 'owner' || member.role === 'admin' ? 'green' : 'orange',
          color: member.self ? '#f2c5a5' : '#bad3ed',
        })),
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
});

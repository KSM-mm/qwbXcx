import { callFamily, callInventory } from '~/api/cloud';
import { ensureSession } from '~/utils/auth';

Page({
  data: {
    name: '',
    types: [
      { icon: 'box', label: '柜子', value: 'cabinet' },
      { icon: 'fridge', label: '冰箱', value: 'fridge' },
      { icon: 'door', label: '抽屉', value: 'layer' },
      { icon: 'more', label: '其他', value: 'other' },
    ],
    typeIndex: 0,
    privateOn: false,
    hasFamily: false,
    members: [],
    shareMap: {},
    loading: false,
    editing: false,
    spaceId: '',
    toast: '',
  },
  async onLoad(query) {
    const session = ensureSession();
    if (!session) return;
    const hasFamily = !!session.family;
    const editing = !!query.id;
    this.setData({ hasFamily, privateOn: !hasFamily, editing, spaceId: query.id || '' });
    try {
      const [memberResult, spaceResult] = await Promise.all([
        hasFamily ? callFamily('members') : Promise.resolve({ data: { members: [] } }),
        editing ? callInventory('getSpace', { spaceId: query.id }) : Promise.resolve(null),
      ]);
      const members = memberResult.data.members.filter((member) => !member.self);
      if (!spaceResult) {
        this.setData({ members });
        return;
      }
      const { space } = spaceResult.data;
      const typeIndex = Math.max(0, this.data.types.findIndex((type) => type.value === space.type));
      const shareMap = {};
      (space.sharedUserIds || []).forEach((id) => {
        shareMap[id] = true;
      });
      this.setData({
        members,
        name: space.name,
        typeIndex,
        privateOn: space.isPersonal,
        shareMap,
      });
    } catch (error) {
      wx.showToast({ title: error.message || '成员加载失败', icon: 'none' });
    }
  },
  onName(e) {
    this.setData({ name: e.detail.value });
  },
  onType(e) {
    this.setData({ typeIndex: Number(e.currentTarget.dataset.index) });
  },
  onTogglePrivate() {
    if (!this.data.hasFamily || this.data.editing) return;
    this.setData({ privateOn: !this.data.privateOn });
  },
  onToggleMember(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ [`shareMap.${id}`]: !this.data.shareMap[id] });
  },
  async onSave() {
    if (this.data.loading) return;
    const name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: '请填写空间名称', icon: 'none' });
      return;
    }
    const shareUserIds = Object.keys(this.data.shareMap).filter((id) => this.data.shareMap[id]);
    this.setData({ loading: true });
    try {
      const payload = {
        name,
        type: this.data.types[this.data.typeIndex].value,
        scope: this.data.privateOn ? 'personal' : 'family',
        shareUserIds: this.data.privateOn ? shareUserIds : [],
      };
      const result = this.data.editing
        ? await callInventory('updateSpace', { ...payload, spaceId: this.data.spaceId })
        : await callInventory('createSpace', payload);
      this.setData({ toast: this.data.editing ? '空间已更新' : '空间已创建' });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/space/index?id=${result.data.spaceId}` });
      }, 500);
    } catch (error) {
      wx.showToast({ title: error.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});

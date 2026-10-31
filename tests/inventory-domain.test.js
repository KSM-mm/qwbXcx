const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ownershipFromSpace,
  ownershipMatches,
} = require('../cloudfunctions/inventory/domain');

test('家庭共享空间产生家庭归属', () => {
  assert.deepEqual(ownershipFromSpace({ familyId: 'family-1', ownerId: '' }), {
    familyId: 'family-1',
    ownerId: '',
  });
});

test('家庭成员个人空间仍产生个人归属', () => {
  assert.deepEqual(ownershipFromSpace({ familyId: 'family-1', ownerId: 'user-1' }), {
    familyId: '',
    ownerId: 'user-1',
  });
});

test('家庭物品、批次与空间归属一致时允许读取', () => {
  const space = { familyId: 'family-1', ownerId: '' };
  const item = { familyId: 'family-1', ownerId: '' };
  const batch = { familyId: 'family-1', ownerId: '' };
  assert.equal(ownershipMatches(item, batch, space), true);
});

test('家庭物品不能出现在其他家庭空间', () => {
  const space = { familyId: 'family-2', ownerId: '' };
  const item = { familyId: 'family-1', ownerId: '' };
  const batch = { familyId: 'family-1', ownerId: '' };
  assert.equal(ownershipMatches(item, batch, space), false);
});

test('个人物品必须属于个人空间所有者', () => {
  const space = { familyId: 'family-1', ownerId: 'user-1' };
  const item = { familyId: '', ownerId: 'user-2' };
  const batch = { familyId: '', ownerId: 'user-2' };
  assert.equal(ownershipMatches(item, batch, space), false);
});

test('个人空间共享不会改变其中物品的个人归属', () => {
  const space = { familyId: 'family-1', ownerId: 'user-1', visibility: 'shared' };
  const item = { familyId: '', ownerId: 'user-1' };
  const batch = { familyId: '', ownerId: 'user-1' };
  assert.equal(ownershipMatches(item, batch, space), true);
});

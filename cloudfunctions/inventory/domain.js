function ownershipFromSpace(space) {
  if (space.ownerId) return { familyId: '', ownerId: space.ownerId };
  return { familyId: space.familyId, ownerId: '' };
}

function ownershipMatches(item, batch, space) {
  if (space.ownerId) {
    return (
      !item.familyId &&
      item.ownerId === space.ownerId &&
      !batch.familyId &&
      batch.ownerId === space.ownerId
    );
  }
  return (
    !item.ownerId &&
    item.familyId === space.familyId &&
    !batch.ownerId &&
    batch.familyId === space.familyId
  );
}

module.exports = {
  ownershipFromSpace,
  ownershipMatches,
};

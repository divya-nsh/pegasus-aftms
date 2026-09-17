interface Item<TID extends number | string> {
  id?: TID | null; // optional because new items don't have id yet
  [key: string]: any;
}

export function diffIds<T extends Item<TID>, TID extends number | string>(
  newItems: T[],
  existingIds: TID[],
) {
  const existingIdSet = new Set(existingIds);
  const incomingIdSet = new Set<TID>();

  const toInsert: T[] = [];
  const toUpdate: T[] = [];

  for (const item of newItems) {
    if (item.id != null && existingIdSet.has(item.id)) {
      // Item already exists → update
      toUpdate.push(item);
      incomingIdSet.add(item.id);
    } else {
      // No id or id doesn't exist → insert
      toInsert.push(item);
    }
  }

  // IDs that exist in DB but were not sent by client → delete
  const toDelete = existingIds.filter((id) => !incomingIdSet.has(id));

  return {
    toInsert,
    toUpdate,
    toDelete,
  };
}

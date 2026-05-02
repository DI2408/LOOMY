const onlineStoreIds = new Set<string>();

export const storePresence = {
  markOnline(storeId: string): void {
    onlineStoreIds.add(storeId);
  },
  markOffline(storeId: string): void {
    onlineStoreIds.delete(storeId);
  },
  isStoreOnline(storeId: string): boolean {
    return onlineStoreIds.has(storeId);
  },
};

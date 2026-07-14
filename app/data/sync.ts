export const ApiActionSyncUrl = "/api/action/sync";

export const SyncAction = {
  Add: "add",
  AddFromCache: "add-from-cache",
  AddWithNametag: "add-with-nametag",
  AddWithSticker: "add-with-sticker",
  ApplyItemPatch: "apply-item-patch",
  ApplyItemSticker: "apply-item-sticker",
  DepositToStorageUnit: "deposit-to-storage-unit",
  Edit: "edit",
  Equip: "equip",
  Remove: "remove",
  RemoveAllItems: "remove-all-items",
  RemoveItemPatch: "remove-item-patch",
  RemoveItemSticker: "remove-item-sticker",
  RenameItem: "rename-item",
  RenameStorageUnit: "rename-storage-unit",
  RetrieveFromStorageUnit: "retrieve-from-storage-unit",
  ScrapeItemSticker: "scrape-item-sticker",
  SwapItemsStatTrak: "swap-items-stattrak",
  Unequip: "unequip"
} as const;

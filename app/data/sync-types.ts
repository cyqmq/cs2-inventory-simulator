export interface ApiActionSyncData {
  syncedAt: number;
}

export interface ApiActionResyncData {
  syncedAt: number;
  inventory: string | null;
}

export interface ApiActionUnlockCaseActionData {
  syncedAt: number;
  unlockedItem: import("@ianlucas/cs2-lib").CS2UnlockedItem;
}

export type ActionShape = Record<string, unknown> & { type: string };

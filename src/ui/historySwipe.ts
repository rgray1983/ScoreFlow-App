export const HISTORY_DELETE_WIDTH = 88;

export function snapHistorySwipe(offset: number): number {
  return offset >= HISTORY_DELETE_WIDTH / 2 ? HISTORY_DELETE_WIDTH : 0;
}

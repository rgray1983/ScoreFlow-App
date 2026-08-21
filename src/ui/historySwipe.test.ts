import { describe, expect, it } from "vitest";
import { HISTORY_DELETE_WIDTH, snapHistorySwipe } from "./historySwipe";

describe("match history swipe", () => {
  it("snaps open once the row is halfway to Delete", () => {
    expect(snapHistorySwipe(0)).toBe(0);
    expect(snapHistorySwipe(HISTORY_DELETE_WIDTH / 2 - 1)).toBe(0);
    expect(snapHistorySwipe(HISTORY_DELETE_WIDTH / 2)).toBe(HISTORY_DELETE_WIDTH);
    expect(snapHistorySwipe(HISTORY_DELETE_WIDTH)).toBe(HISTORY_DELETE_WIDTH);
  });
});

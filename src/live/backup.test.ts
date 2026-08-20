import { describe, expect, it } from "vitest";
import { accountChipText, accountStatusText, hasCloudAccount, signInErrorMessage } from "./firebase";
import { canWriteCloudBackup } from "./backup";

function user(partial: { uid: string; isAnonymous: boolean; email?: string | null }) {
  return partial as Parameters<typeof hasCloudAccount>[0];
}

describe("account helpers", () => {
  it("treats anonymous Auth as guest, not a backup account", () => {
    const guest = user({ uid: "anon-1", isAnonymous: true, email: null });
    expect(hasCloudAccount(guest)).toBe(false);
    expect(hasCloudAccount(null)).toBe(false);
    expect(accountStatusText(guest)).toBe("Guest mode — sign in to sync teams and history.");
    expect(accountChipText(guest)).toBe("Guest Mode");
  });

  it("treats a non-anonymous user as a signed-in backup account", () => {
    const signedIn = user({ uid: "uid-1", isAnonymous: false, email: "richie@example.com" });
    expect(hasCloudAccount(signedIn)).toBe(true);
    expect(accountStatusText(signedIn)).toBe("Signed in as richie@example.com");
    expect(accountChipText(signedIn)).toBe("richie@example.com");
  });

  it("only writes cloud backup for Pro + signed-in + toggle on", () => {
    const signedIn = user({ uid: "uid-1", isAnonymous: false, email: "richie@example.com" });
    const guest = user({ uid: "anon-1", isAnonymous: true, email: null });
    expect(canWriteCloudBackup({ user: signedIn, isPro: true, cloudBackup: true })).toBe(true);
    expect(canWriteCloudBackup({ user: signedIn, isPro: true, cloudBackup: false })).toBe(false);
    expect(canWriteCloudBackup({ user: signedIn, isPro: false, cloudBackup: true })).toBe(false);
    expect(canWriteCloudBackup({ user: guest, isPro: true, cloudBackup: true })).toBe(false);
  });

  it("keeps the current-app provider enablement copy", () => {
    expect(signInErrorMessage(new Error("nope"), "google")).toBe("Google sign in needs to be enabled");
    expect(signInErrorMessage(new Error("nope"), "apple")).toBe("Apple sign in needs to be enabled");
    expect(signInErrorMessage(new Error("Enter email and 6+ character password"))).toBe("Enter email and 6+ character password");
  });
});

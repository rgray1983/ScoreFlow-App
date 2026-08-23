import { describe, expect, it } from "vitest";
import { memoryStorage } from "./local";
import {
  ACCOUNT_PROFILE_KEY,
  loadAccountProfile,
  mergeAccountProfiles,
  parseAccountProfile,
  profileInitials,
  profileDisplayName,
  saveAccountProfile,
  seedProfileFromUser
} from "./accountProfile";

describe("account profile", () => {
  it("parses and round-trips a scorer name and photo", () => {
    const storage = memoryStorage();
    const saved = saveAccountProfile({
      displayName: "Richie Gray",
      avatar: "data:image/png;base64,xx",
      updatedAtMs: 1000
    }, storage);
    expect(JSON.parse(storage.getItem(ACCOUNT_PROFILE_KEY) || "{}")).toMatchObject({
      displayName: "Richie Gray",
      avatar: "data:image/png;base64,xx"
    });
    expect(loadAccountProfile(storage)).toEqual(saved);
    expect(profileInitials("Richie Gray")).toBe("RG");
    expect(profileInitials("", "coach@example.com")).toBe("CO");
    expect(profileDisplayName(saved)).toBe("Richie Gray");
  });

  it("keeps a local custom photo when seeding from Google", () => {
    const local = parseAccountProfile({
      displayName: "Richie",
      avatar: "data:image/jpeg;base64,custom",
      updatedAtMs: 50
    });
    const seeded = seedProfileFromUser(local, {
      isAnonymous: false,
      displayName: "Google Name",
      photoURL: "https://example.com/google.jpg"
    } as never);
    expect(seeded.displayName).toBe("Richie");
    expect(seeded.avatar).toBe("data:image/jpeg;base64,custom");
  });

  it("uses the newer cloud profile when merging", () => {
    const local = parseAccountProfile({ displayName: "Local", avatar: "", updatedAtMs: 10 });
    const cloud = parseAccountProfile({ displayName: "Cloud", avatar: "https://cdn/a.png", updatedAtMs: 20 });
    expect(mergeAccountProfiles(local, cloud).displayName).toBe("Cloud");
    expect(mergeAccountProfiles(cloud, local).displayName).toBe("Cloud");
  });
});

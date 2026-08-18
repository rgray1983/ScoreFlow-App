import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rules = readFileSync(resolve(root, "firestore.rules"), "utf8");

let testEnv;
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await testEnv.clearFirestore();
    await fn();
    passed += 1;
    console.log(`ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(error);
  }
}

function authedDb(uid, provider = "anonymous") {
  return testEnv.authenticatedContext(uid, {
    firebase: { sign_in_provider: provider }
  }).firestore();
}

function guestDb() {
  return testEnv.unauthenticatedContext().firestore();
}

function publicState(overrides = {}) {
  return {
    homeScore: 0,
    awayScore: 0,
    homeSets: 0,
    awaySets: 0,
    setNumber: 1,
    winBy: 2,
    setsToWin: 2,
    matchFormat: "club",
    matchSets: 3,
    lastAlert: "",
    homeColor: "#d62828",
    awayColor: "#1565c0",
    matchTitle: "Game Night",
    homeName: "Team 1",
    awayName: "Team 2",
    winner: "",
    setFlashTeam: "",
    setFlashId: 0,
    completedSets: [],
    lastPointFlashId: 0,
    homeLogo: "",
    awayLogo: "",
    ended: false,
    updatedAtMs: Date.now(),
    ...overrides
  };
}

async function seedGame(ownerId, gameId = "game-seed-1", extra = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "volleyballGames", gameId), {
      ...publicState(),
      ownerId,
      ...extra
    });
  });
}

async function run() {
  testEnv = await initializeTestEnvironment({
    projectId: "scoreflow-6059f",
    firestore: { rules, host: "127.0.0.1", port: 8080 }
  });

  await test("unauthenticated users cannot write private account data", async () => {
    const db = guestDb();
    await assertFails(setDoc(doc(db, "users", "user-1", "teams", "team-1"), { name: "Blazers" }));
    await assertFails(getDoc(doc(db, "users", "user-1", "settings", "premium")));
  });

  await test("signed-in users can read and write only their own account data", async () => {
    const owner = authedDb("user-1", "password");
    const other = authedDb("user-2", "password");
    await assertSucceeds(setDoc(doc(owner, "users", "user-1", "settings", "premium"), {
      isPro: true,
      theme: "classic",
      cloudBackup: true,
      updatedAtMs: Date.now()
    }, { merge: true }));
    await assertSucceeds(setDoc(doc(owner, "users", "user-1", "teams", "team-blazers"), {
      id: "team-blazers",
      name: "Blazers",
      color: "#d62828",
      logo: "",
      favorite: true,
      updatedAtMs: Date.now()
    }, { merge: true }));
    await assertSucceeds(setDoc(doc(owner, "users", "user-1", "matches", "match-1"), {
      id: "match-1",
      title: "Game Night",
      homeName: "Blazers",
      awayName: "Rivals",
      homeSets: 2,
      awaySets: 1,
      winner: "Blazers",
      updatedAtMs: Date.now()
    }, { merge: true }));
    await assertSucceeds(getDocs(query(collection(owner, "users", "user-1", "teams"), orderBy("updatedAtMs", "desc"), limit(50))));
    await assertSucceeds(getDocs(query(collection(owner, "users", "user-1", "matches"), orderBy("updatedAtMs", "desc"), limit(3))));
    await assertFails(getDocs(query(collection(other, "users", "user-1", "teams"), orderBy("updatedAtMs", "desc"), limit(50))));
    await assertFails(setDoc(doc(other, "users", "user-1", "teams", "stolen"), { name: "Nope" }));
  });

  await test("anonymous guests cannot use another account's user path", async () => {
    const anon = authedDb("anon-1", "anonymous");
    await assertFails(getDocs(query(collection(anon, "users", "user-1", "matches"), orderBy("updatedAtMs", "desc"), limit(3))));
    await assertSucceeds(setDoc(doc(anon, "users", "anon-1", "teams", "local-team"), {
      id: "local-team",
      name: "Local",
      updatedAtMs: Date.now()
    }));
  });

  await test("anyone with the game id can read a live game, but cannot list all games", async () => {
    await seedGame("scorer-1");
    const db = guestDb();
    await assertSucceeds(getDoc(doc(db, "volleyballGames", "game-seed-1")));
    await assertFails(getDocs(collection(db, "volleyballGames")));
  });

  await test("unauthenticated clients cannot create or update live games", async () => {
    const db = guestDb();
    await assertFails(setDoc(doc(db, "volleyballGames", "game-open"), {
      ...publicState(),
      ownerId: "anyone"
    }));
    await seedGame("scorer-1");
    await assertFails(setDoc(doc(db, "volleyballGames", "game-seed-1"), { homeScore: 9 }, { merge: true }));
  });

  await test("scorer can create and update their live game, viewers cannot hijack the score", async () => {
    const scorer = authedDb("scorer-1");
    const viewer = authedDb("viewer-1");
    await assertSucceeds(setDoc(doc(scorer, "volleyballGames", "game-live"), {
      ...publicState(),
      ownerId: "scorer-1",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));
    await assertSucceeds(setDoc(doc(scorer, "volleyballGames", "game-live"), {
      homeScore: 14,
      ownerId: "scorer-1",
      ended: false,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true }));
    await assertFails(setDoc(doc(viewer, "volleyballGames", "game-live"), {
      homeScore: 99,
      ownerId: "scorer-1",
      ended: false,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true }));
    await assertFails(setDoc(doc(scorer, "volleyballGames", "game-live"), {
      ownerId: "viewer-1"
    }, { merge: true }));
    await assertSucceeds(getDoc(doc(viewer, "volleyballGames", "game-live")));
  });

  await test("scorer cannot create a live game owned by someone else", async () => {
    const scorer = authedDb("scorer-1");
    await assertFails(setDoc(doc(scorer, "volleyballGames", "game-spoof"), {
      ...publicState(),
      ownerId: "someone-else"
    }));
  });

  await test("legacy live games without ownerId can be claimed by the next authenticated scorer write", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "volleyballGames", "game-legacy"), publicState());
    });
    const scorer = authedDb("scorer-2");
    const viewer = authedDb("viewer-2");
    await assertSucceeds(setDoc(doc(scorer, "volleyballGames", "game-legacy"), {
      ownerId: "scorer-2",
      homeScore: 1,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true }));
    await assertFails(setDoc(doc(viewer, "volleyballGames", "game-legacy"), {
      ownerId: "viewer-2",
      homeScore: 8,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true }));
  });

  await test("owner can end a live match", async () => {
    await seedGame("scorer-1", "game-end");
    const scorer = authedDb("scorer-1");
    const viewer = authedDb("viewer-1");
    await assertFails(setDoc(doc(viewer, "volleyballGames", "game-end"), {
      ownerId: "scorer-1",
      ended: true,
      endedAtMs: Date.now(),
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true }));
    await assertSucceeds(setDoc(doc(scorer, "volleyballGames", "game-end"), {
      ownerId: "scorer-1",
      ended: true,
      endedAt: serverTimestamp(),
      endedAtMs: Date.now(),
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true }));
  });

  await test("fan chat, reactions, and presence match ScoreFlow queries and write rules", async () => {
    await seedGame("scorer-1", "game-fan");
    const scorer = authedDb("scorer-1");
    const viewer = authedDb("viewer-1");
    const guest = guestDb();

    await assertSucceeds(getDocs(query(collection(guest, "volleyballGames", "game-fan", "chat"), orderBy("createdAtMs", "asc"), limit(40))));
    await assertSucceeds(getDocs(query(collection(guest, "volleyballGames", "game-fan", "reactions"), orderBy("createdAtMs", "asc"), limit(60))));
    await assertSucceeds(getDocs(query(collection(guest, "volleyballGames", "game-fan", "presence"), orderBy("updatedAtMs", "desc"), limit(100))));

    await assertFails(addDoc(collection(guest, "volleyballGames", "game-fan", "chat"), {
      text: "Go team",
      name: "Fan",
      role: "viewer",
      sessionId: "session-1",
      uid: "viewer-1",
      createdAt: serverTimestamp(),
      createdAtMs: Date.now()
    }));

    await assertSucceeds(addDoc(collection(viewer, "volleyballGames", "game-fan", "chat"), {
      text: "Go team",
      name: "Fan",
      role: "viewer",
      sessionId: "session-1",
      uid: "viewer-1",
      createdAt: serverTimestamp(),
      createdAtMs: Date.now()
    }));

    await assertFails(addDoc(collection(viewer, "volleyballGames", "game-fan", "chat"), {
      text: "I am the scorer",
      name: "Scorer",
      role: "scorer",
      sessionId: "scorer",
      uid: "viewer-1",
      createdAt: serverTimestamp(),
      createdAtMs: Date.now()
    }));

    await assertSucceeds(addDoc(collection(scorer, "volleyballGames", "game-fan", "chat"), {
      text: "Nice serve",
      name: "Scorer",
      role: "scorer",
      sessionId: "scorer",
      uid: "scorer-1",
      createdAt: serverTimestamp(),
      createdAtMs: Date.now()
    }));

    await assertFails(addDoc(collection(viewer, "volleyballGames", "game-fan", "chat"), {
      text: "x".repeat(61),
      name: "Fan",
      role: "viewer",
      sessionId: "session-1",
      uid: "viewer-1",
      createdAt: serverTimestamp(),
      createdAtMs: Date.now()
    }));

    await assertSucceeds(addDoc(collection(viewer, "volleyballGames", "game-fan", "reactions"), {
      emoji: "🏐",
      uid: "viewer-1",
      createdAt: serverTimestamp(),
      createdAtMs: Date.now()
    }));

    await assertFails(addDoc(collection(viewer, "volleyballGames", "game-fan", "reactions"), {
      emoji: "💩",
      uid: "viewer-1",
      createdAt: serverTimestamp(),
      createdAtMs: Date.now()
    }));

    await assertSucceeds(setDoc(doc(viewer, "volleyballGames", "game-fan", "presence", "viewer-1"), {
      role: "viewer",
      uid: "viewer-1",
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true }));

    await assertFails(setDoc(doc(viewer, "volleyballGames", "game-fan", "presence", "scorer-1"), {
      role: "viewer",
      uid: "viewer-1",
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true }));
  });

  await test("planned Coach collections stay denied until that product uses Firestore", async () => {
    const coach = authedDb("coach-1", "password");
    await assertFails(setDoc(doc(coach, "organizations", "org-1"), { name: "Club" }));
    await assertFails(setDoc(doc(coach, "teams", "team-1"), { name: "Varsity" }));
    await assertFails(setDoc(doc(coach, "players", "player-1"), { name: "Ada" }));
    await assertFails(getDoc(doc(coach, "seasons", "season-1")));
  });

  await testEnv.cleanup();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

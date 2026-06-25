import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const params = new URLSearchParams(window.location.search);
const GAME_ID_FROM_URL = params.get("game");
const MODE_FROM_URL = params.get("mode") || "scorer";
const isViewer = MODE_FROM_URL === "view";

const state = {
  homeScore: 0,
  awayScore: 0,
  homeSets: 0,
  awaySets: 0,
  setNumber: 1,
  winBy: 2,
  setsToWin: 2,
  matchFormat: "club",
  matchSets: 3,
  history: [],
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
  confettiRunning: false,
  confettiAnimation: null
};

const COLORS = [
  { name: "Red", value: "#d62828" },
  { name: "Orange", value: "#f97316" },
  { name: "Gold", value: "#fbbf24" },
  { name: "Green", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Blue", value: "#1565c0" },
  { name: "Purple", value: "#7e22ce" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gray", value: "#6b7280" },
  { name: "Black", value: "#111827" }
];

const $ = (id) => document.getElementById(id);
const els = {
  app: $("app"),
  scoreboardHomeBtn: $("scoreboardHomeBtn"),
  matchTitle: $("matchTitle"),
  liveStatus: $("liveStatus"),
  titleInput: $("titleInput"),
  homeName: $("homeName"),
  awayName: $("awayName"),
  homeNameSetting: $("homeNameSetting"),
  awayNameSetting: $("awayNameSetting"),
  matchFormatSetting: $("matchFormatSetting"),
  matchPill: $("matchPill"),
  homeScoreBtn: $("homeScoreBtn"),
  awayScoreBtn: $("awayScoreBtn"),
  homeSetWinBadge: $("homeSetWinBadge"),
  awaySetWinBadge: $("awaySetWinBadge"),
  homeSets: $("homeSets"),
  awaySets: $("awaySets"),
  homeSetDots: $("homeSetDots"),
  awaySetDots: $("awaySetDots"),
  setNumber: $("setNumber"),
  raceTo: $("raceTo"),
  alertBanner: $("alertBanner"),
  settingsDialog: $("settingsDialog"),
  shareDialog: $("shareDialog"),
  toast: $("toast"),
  homeLogoInput: $("homeLogoInput"),
  awayLogoInput: $("awayLogoInput"),
  homeLogo: $("homeLogo"),
  awayLogo: $("awayLogo"),
  homeInitial: $("homeInitial"),
  awayInitial: $("awayInitial"),
  homeSwatches: $("homeSwatches"),
  awaySwatches: $("awaySwatches"),
  winnerOverlay: $("winnerOverlay"),
  winnerText: $("winnerText"),
  viewerLink: $("viewerLink"),
  nativeShareBtn: $("nativeShareBtn"),
  showQrBtn: $("showQrBtn"),
  qrCard: $("qrCard"),
  qrImage: $("qrImage"),
  posterBtn: $("posterBtn"),
  pointPulse: $("pointPulse"),
  recapDialog: $("recapDialog"),
  recapContent: $("recapContent"),
  shareRecapBtn: $("shareRecapBtn"),
  posterRecapBtn: $("posterRecapBtn"),
  posterDialog: $("posterDialog"),
  posterCanvas: $("posterCanvas"),
  sharePosterBtn: $("sharePosterBtn"),
  downloadPosterBtn: $("downloadPosterBtn"),
  saveTeamsBtn: $("saveTeamsBtn"),
  loadTeamsBtn: $("loadTeamsBtn"),
  splashLogoImg: document.querySelector(".splash-logo-img"),
  liveStartOverlay: $("liveStartOverlay"),
  liveStartTitle: $("liveStartTitle"),
  liveStartHome: $("liveStartHome"),
  liveStartAway: $("liveStartAway"),
  liveStartMeta: $("liveStartMeta"),
  liveStartWatchBtn: $("liveStartWatchBtn"),
  firebaseNote: $("firebaseNote"),
  homeScreen: $("homeScreen"),
  openScoreboardBtn: $("openScoreboardBtn"),
  homeNewMatchBtn: $("homeNewMatchBtn"),
  homeCreateLiveBtn: $("homeCreateLiveBtn"),
  homeSettingsBtn: $("homeSettingsBtn"),
  appSettingsDialog: $("appSettingsDialog"),
  closeAppSettingsBtn: $("closeAppSettingsBtn"),
  userEmail: $("userEmail"),
  userPassword: $("userPassword"),
  emailSignInBtn: $("emailSignInBtn"),
  emailCreateBtn: $("emailCreateBtn"),
  googleSignInBtn: $("googleSignInBtn"),
  appleSignInBtn: $("appleSignInBtn"),
  signOutBtn: $("signOutBtn"),
  authStatus: $("authStatus"),
  savedTeamsList: $("savedTeamsList"),
  favoriteTeamsList: $("favoriteTeamsList"),
  matchHistoryList: $("matchHistoryList"),
  accountChip: $("accountChip")
};


function selectExistingText(event) {
  const input = event.currentTarget;
  if (!input || typeof input.select !== "function") return;
  requestAnimationFrame(() => input.select());
}

let db = null;
let auth = null;
let currentUser = null;
let lastSavedWinnerKey = "";
let liveGameId = GAME_ID_FROM_URL || "";
let unsubscribeLive = null;
let applyingRemote = false;
let liveReady = false;
let remoteTimer = null;
let initialSetupActive = false;
let setupComplete = false;
let splashClosed = false;

function hideSplash() {
  if (splashClosed) return;
  splashClosed = true;
  document.body.classList.add("splash-done");
}

function setConnectionStatus(status, label) {
  if (!els.liveStatus) return;
  const cleanStatus = ["online", "offline", "error", "connecting"].includes(status) ? status : "offline";
  els.liveStatus.classList.remove("online", "offline", "error", "connecting");
  els.liveStatus.classList.add(cleanStatus);
  els.liveStatus.textContent = label || (cleanStatus === "online" ? "Online" : cleanStatus === "connecting" ? "Connecting" : cleanStatus === "error" ? "Sync Error" : "Offline");
}

function applySplashImageFromStorage() {
  const savedSplash = localStorage.getItem("scoreflowSplashImage");
  const src = savedSplash || "splash-logo.png";
  if (els.splashLogoImg) els.splashLogoImg.src = src;
}


function updateLiveStartOverlay() {
  if (!els.liveStartOverlay) return;
  els.liveStartTitle.textContent = state.matchTitle || "Game Night";
  els.liveStartHome.textContent = teamName("home");
  els.liveStartAway.textContent = teamName("away");
  els.liveStartMeta.textContent = `Set ${state.setNumber} · Race to ${pointsToWinForCurrentSet()}`;
  els.liveStartOverlay.style.setProperty("--live-home", state.homeColor);
  els.liveStartOverlay.style.setProperty("--live-away", state.awayColor);
}

function showLiveStartOverlay() {
  if (!isViewer || !els.liveStartOverlay) return;
  updateLiveStartOverlay();
  els.liveStartOverlay.classList.add("show");
  els.liveStartOverlay.setAttribute("aria-hidden", "false");
}

function hideLiveStartOverlay() {
  if (!els.liveStartOverlay) return;
  els.liveStartOverlay.classList.remove("show");
  els.liveStartOverlay.setAttribute("aria-hidden", "true");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["https:", "http:"].includes(window.location.protocol)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("ScoreFlow service worker registration failed:", error);
    });
  });
}


function hasFirebaseConfig() {
  return Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId && firebaseConfig?.appId);
}

function initFirebase() {
  if (!hasFirebaseConfig()) return false;
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    watchAuth();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function userDocPath(...parts) {
  if (!currentUser) return null;
  return ["users", currentUser.uid, ...parts];
}

function setAuthStatus(message) {
  if (els.authStatus) els.authStatus.textContent = message;
  if (els.accountChip) els.accountChip.textContent = currentUser ? (currentUser.email || "Signed In") : "Guest Mode";
  if (els.signOutBtn) els.signOutBtn.hidden = !currentUser;
}

function watchAuth() {
  if (!auth) return;
  onAuthStateChanged(auth, async (user) => {
    currentUser = user || null;
    setAuthStatus(currentUser ? `Signed in as ${currentUser.email || "ScoreFlow user"}` : "Guest mode — sign in to sync teams and history.");
    await syncLocalDataToCloud();
    await renderHomeData();
  });
}

async function emailSignIn(createAccount = false) {
  if (!auth) {
    toast("Firebase Auth is not ready", true);
    return;
  }
  const email = els.userEmail?.value?.trim();
  const password = els.userPassword?.value || "";
  if (!email || password.length < 6) {
    toast("Enter email and 6+ character password", true);
    return;
  }
  try {
    if (createAccount) await createUserWithEmailAndPassword(auth, email, password);
    else await signInWithEmailAndPassword(auth, email, password);
    toast(createAccount ? "Account created" : "Signed in");
  } catch (error) {
    console.error(error);
    toast(error.message || "Sign in failed", true);
  }
}

async function providerSignIn(providerName) {
  if (!auth) {
    toast("Firebase Auth is not ready", true);
    return;
  }
  const provider = providerName === "apple"
    ? new OAuthProvider("apple.com")
    : new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    toast("Signed in");
  } catch (error) {
    console.error(error);
    toast(`${providerName === "apple" ? "Apple" : "Google"} sign in needs to be enabled`, true);
  }
}

async function doSignOut() {
  if (!auth) return;
  await signOut(auth);
  toast("Signed out");
}

function showHomeScreen() {
  if (isViewer) return;
  document.body.classList.add("screen-transitioning");
  document.body.classList.add("home-active");
  document.body.classList.remove("scoreboard-active", "setup-active");
  initialSetupActive = false;
  updateRotateScreenState();
  renderHomeData();
  window.setTimeout(() => document.body.classList.remove("screen-transitioning"), 260);
}

function openScoreboardFromHome(startFresh = false) {
  if (isViewer) return;
  document.body.classList.add("screen-transitioning");
  document.body.classList.remove("home-active");
  document.body.classList.add("scoreboard-active");
  window.setTimeout(() => document.body.classList.remove("screen-transitioning"), 260);
  if (startFresh) {
    resetMatchState(false);
    toast("New match ready");
  }
  if (!setupComplete && isPortraitOrientation()) {
    initialSetupActive = true;
    document.body.classList.add("setup-active");
    openSettings();
  } else {
    setupComplete = true;
    updateRotateScreenState();
  }
}

function resetMatchState(keepHistory = true) {
  if (keepHistory) snapshot();
  state.homeScore = 0;
  state.awayScore = 0;
  state.homeSets = 0;
  state.awaySets = 0;
  state.setNumber = 1;
  state.lastAlert = "";
  state.winner = "";
  state.setFlashTeam = "";
  state.setFlashId = 0;
  state.completedSets = [];
  state.lastPointFlashId = 0;
  lastSavedWinnerKey = "";
  stopConfetti();
  hideWinner();
  render();
  queueRemoteUpdate();
}

function getLocalJson(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function setLocalJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function currentTeamEntries() {
  return [
    {
      id: `team-${teamName("home").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "home"}`,
      name: teamName("home"),
      color: state.homeColor,
      logo: els.homeLogo?.src?.startsWith("data:") ? els.homeLogo.src : "",
      favorite: false,
      updatedAtMs: Date.now()
    },
    {
      id: `team-${teamName("away").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "away"}`,
      name: teamName("away"),
      color: state.awayColor,
      logo: els.awayLogo?.src?.startsWith("data:") ? els.awayLogo.src : "",
      favorite: false,
      updatedAtMs: Date.now()
    }
  ];
}

function localTeams() {
  return getLocalJson("scoreflowTeamsV2", []);
}

function saveLocalTeam(team) {
  const teams = localTeams();
  const existing = teams.findIndex((item) => item.id === team.id);
  const next = existing >= 0 ? { ...teams[existing], ...team, favorite: teams[existing].favorite || team.favorite } : team;
  if (existing >= 0) teams[existing] = next;
  else teams.unshift(next);
  setLocalJson("scoreflowTeamsV2", teams.slice(0, 40));
  return next;
}

async function saveCloudTeam(team) {
  if (!currentUser || !db) return;
  await setDoc(doc(db, ...userDocPath("teams", team.id)), {
    ...team,
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  }, { merge: true });
}

async function syncLocalDataToCloud() {
  if (!currentUser || !db) return;
  const teams = localTeams();
  await Promise.allSettled(teams.map((team) => saveCloudTeam(team)));
  const matches = getLocalJson("scoreflowMatchHistoryV2", []);
  await Promise.allSettled(matches.slice(0, 20).map((match) =>
    setDoc(doc(db, ...userDocPath("matches", match.id)), { ...match, updatedAt: serverTimestamp() }, { merge: true })
  ));
}

async function getAllTeams() {
  const local = localTeams();
  if (!currentUser || !db) return local;
  try {
    const snap = await getDocs(query(collection(db, ...userDocPath("teams")), orderBy("updatedAtMs", "desc"), limit(50)));
    const cloud = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const merged = [...cloud];
    local.forEach((team) => {
      if (!merged.some((item) => item.id === team.id)) merged.push(team);
    });
    setLocalJson("scoreflowTeamsV2", merged);
    return merged;
  } catch (error) {
    console.warn(error);
    return local;
  }
}

function applyTeamToSlot(team, slot) {
  if (!team) return;
  state[`${slot}Name`] = team.name || (slot === "home" ? "Team 1" : "Team 2");
  setTeamColor(slot, team.color || (slot === "home" ? state.homeColor : state.awayColor), false);
  const img = slot === "home" ? els.homeLogo : els.awayLogo;
  if (team.logo && img) {
    img.src = team.logo;
    img.closest(".logo-picker")?.classList.add("has-logo");
  }
  render();
  queueRemoteUpdate();
  toast(`${team.name} loaded`);
}

async function toggleFavoriteTeam(teamId) {
  const teams = localTeams();
  const team = teams.find((item) => item.id === teamId);
  if (!team) return;
  team.favorite = !team.favorite;
  setLocalJson("scoreflowTeamsV2", teams);
  await saveCloudTeam(team);
  await renderHomeData();
}

function localMatches() {
  return getLocalJson("scoreflowMatchHistoryV2", []);
}

async function getAllMatches() {
  const local = localMatches();
  if (!currentUser || !db) return local;
  try {
    const snap = await getDocs(query(collection(db, ...userDocPath("matches")), orderBy("updatedAtMs", "desc"), limit(30)));
    const cloud = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const merged = [...cloud];
    local.forEach((match) => {
      if (!merged.some((item) => item.id === match.id)) merged.push(match);
    });
    setLocalJson("scoreflowMatchHistoryV2", merged);
    return merged;
  } catch (error) {
    console.warn(error);
    return local;
  }
}

async function saveMatchHistory() {
  if (!state.winner) return;
  const winnerKey = `${state.winner}-${state.homeSets}-${state.awaySets}-${state.completedSets.length}`;
  if (lastSavedWinnerKey === winnerKey) return;
  lastSavedWinnerKey = winnerKey;
  const match = {
    id: `match-${Date.now().toString(36)}`,
    title: state.matchTitle || "Game Night",
    homeName: teamName("home"),
    awayName: teamName("away"),
    homeSets: state.homeSets,
    awaySets: state.awaySets,
    winner: teamName(state.winner),
    completedSets: state.completedSets,
    matchFormat: state.matchFormat,
    updatedAtMs: Date.now()
  };
  const matches = localMatches();
  matches.unshift(match);
  setLocalJson("scoreflowMatchHistoryV2", matches.slice(0, 50));
  if (currentUser && db) {
    await setDoc(doc(db, ...userDocPath("matches", match.id)), {
      ...match,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
  await renderHomeData();
}

function teamCard(team) {
  return `
    <article class="home-list-card">
      <div class="mini-logo" style="--mini-color:${team.color || "#ffd166"}">
        ${team.logo ? `<img src="${team.logo}" alt="">` : `<span>${(team.name || "T").charAt(0).toUpperCase()}</span>`}
      </div>
      <div>
        <strong>${team.name || "Saved Team"}</strong>
        <small>${team.favorite ? "Favorite team" : "Saved team"}</small>
      </div>
      <div class="mini-actions">
        <button type="button" data-load-team="${team.id}" data-slot="home">T1</button>
        <button type="button" data-load-team="${team.id}" data-slot="away">T2</button>
        <button type="button" data-favorite-team="${team.id}">${team.favorite ? "★" : "☆"}</button>
      </div>
    </article>`;
}

function matchCard(match) {
  const date = match.updatedAtMs ? new Date(match.updatedAtMs).toLocaleDateString() : "Saved match";
  return `
    <article class="home-list-card match-history-card">
      <div class="mini-logo match-mini">🏆</div>
      <div>
        <strong>${match.homeName || "Team 1"} ${match.homeSets ?? 0} - ${match.awaySets ?? 0} ${match.awayName || "Team 2"}</strong>
        <small>${match.winner || "Final"} won · ${date}</small>
      </div>
    </article>`;
}

async function renderHomeData() {
  if (!els.homeScreen) return;
  const teams = await getAllTeams();
  const favorites = teams.filter((team) => team.favorite);
  const matches = await getAllMatches();
  if (els.savedTeamsList) {
    els.savedTeamsList.innerHTML = teams.length ? teams.slice(0, 6).map(teamCard).join("") : `<p class="empty-note">No saved teams yet. Save teams from Game Setup or after entering team names.</p>`;
  }
  if (els.favoriteTeamsList) {
    els.favoriteTeamsList.innerHTML = favorites.length ? favorites.slice(0, 4).map(teamCard).join("") : `<p class="empty-note">Tap ☆ on a saved team to favorite it.</p>`;
  }
  if (els.matchHistoryList) {
    els.matchHistoryList.innerHTML = matches.length ? matches.slice(0, 6).map(matchCard).join("") : `<p class="empty-note">Completed matches will show up here.</p>`;
  }
  setAuthStatus(currentUser ? `Signed in as ${currentUser.email || "ScoreFlow user"}` : "Guest mode — sign in to sync teams and history.");
}

function wireHomeListClicks(event) {
  const loadBtn = event.target.closest("[data-load-team]");
  if (loadBtn) {
    const team = localTeams().find((item) => item.id === loadBtn.dataset.loadTeam);
    applyTeamToSlot(team, loadBtn.dataset.slot || "home");
    return;
  }
  const favBtn = event.target.closest("[data-favorite-team]");
  if (favBtn) toggleFavoriteTeam(favBtn.dataset.favoriteTeam);
}

function isPortraitOrientation() {
  return window.matchMedia("(orientation: portrait)").matches;
}

function beginInitialPortraitSetup() {
  if (isViewer || liveGameId || !isPortraitOrientation()) return;
  initialSetupActive = true;
  document.body.classList.add("setup-active");
  openSettings();
}

function updateRotateScreenState() {
  document.body.classList.toggle("needs-rotate", !isViewer && setupComplete && isPortraitOrientation() && !document.body.classList.contains("setup-active"));
}

function endInitialPortraitSetup() {
  initialSetupActive = false;
  setupComplete = true;
  document.body.classList.remove("setup-active");
  updateRotateScreenState();
}

function publicState() {
  return {
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    homeSets: state.homeSets,
    awaySets: state.awaySets,
    setNumber: state.setNumber,
    winBy: state.winBy,
    setsToWin: state.setsToWin,
    matchFormat: state.matchFormat,
    matchSets: state.matchSets,
    lastAlert: state.lastAlert,
    homeColor: state.homeColor,
    awayColor: state.awayColor,
    matchTitle: state.matchTitle,
    homeName: state.homeName,
    awayName: state.awayName,
    winner: state.winner,
    setFlashTeam: state.setFlashTeam,
    setFlashId: state.setFlashId,
    completedSets: state.completedSets,
    lastPointFlashId: state.lastPointFlashId
  };
}

function applyState(next) {
  const previousHomeScore = state.homeScore;
  const previousAwayScore = state.awayScore;
  const incomingFlashId = Number(next.setFlashId ?? 0);
  const incomingFlashTeam = next.setFlashTeam || "";
  const incomingPointFlashId = Number(next.lastPointFlashId ?? 0);
  const shouldFlashSetWinner = incomingFlashId && incomingFlashId !== state.setFlashId;

  Object.assign(state, {
    homeScore: Number(next.homeScore ?? 0),
    awayScore: Number(next.awayScore ?? 0),
    homeSets: Number(next.homeSets ?? 0),
    awaySets: Number(next.awaySets ?? 0),
    setNumber: Number(next.setNumber ?? 1),
    winBy: Number(next.winBy ?? 2),
    setsToWin: Number(next.setsToWin ?? 2),
    matchFormat: next.matchFormat || (Number(next.setsToWin ?? 2) === 3 ? "highschool" : "club"),
    matchSets: Number(next.matchSets ?? (Number(next.setsToWin ?? 2) === 3 ? 5 : 3)),
    lastAlert: next.lastAlert ?? "",
    homeColor: next.homeColor || "#d62828",
    awayColor: next.awayColor || "#1565c0",
    matchTitle: next.matchTitle || "Game Night",
    homeName: next.homeName || "Team 1",
    awayName: next.awayName || "Team 2",
    winner: next.winner || "",
    setFlashTeam: incomingFlashTeam,
    setFlashId: incomingFlashId,
    completedSets: Array.isArray(next.completedSets) ? next.completedSets : [],
    lastPointFlashId: incomingPointFlashId
  });
  setTeamColor("home", state.homeColor, false);
  setTeamColor("away", state.awayColor, false);
  render();
  if (incomingPointFlashId && (state.homeScore > previousHomeScore || state.awayScore > previousAwayScore)) {
    const pointTeam = state.homeScore > previousHomeScore ? "home" : "away";
    showPointPulse(pointTeam);
  }
  if (shouldFlashSetWinner) triggerSetWinBadge(incomingFlashTeam);
  if (state.winner) {
    showWinner(state.winner, false);
    renderRecap();
  } else hideWinner();
}

function liveDocRef() {
  return doc(db, "volleyballGames", liveGameId);
}

function buildViewerLink(gameId = liveGameId) {
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  return `${cleanUrl}?game=${encodeURIComponent(gameId)}&mode=view`;
}

function buildScorerLink(gameId = liveGameId) {
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  return `${cleanUrl}?game=${encodeURIComponent(gameId)}&mode=scorer`;
}

async function createLiveGame() {
  if (!db) {
    els.firebaseNote.textContent = "Live sharing needs Firebase connected first. Fill in firebase-config.js, then push again.";
    toast("Firebase config needed", true);
    return;
  }

  if (!liveGameId) {
    liveGameId = `game-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  await setDoc(liveDocRef(), {
    ...publicState(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  }, { merge: true });

  els.viewerLink.value = buildViewerLink();
  updateShareExtras();
  els.firebaseNote.textContent = "Live game created. Share the viewer link with family.";
  window.history.replaceState({}, "", buildScorerLink());
  await startLiveListener();
  toast("Live game created");
}

function queueRemoteUpdate() {
  // Push every scorer change to Firestore. Use setDoc(..., merge:true) instead
  // of updateDoc so a live game can recover even if the document was not fully ready yet.
  if (!db || !liveGameId || isViewer || applyingRemote) return;
  clearTimeout(remoteTimer);
  remoteTimer = setTimeout(pushRemoteUpdate, 120);
}

async function pushRemoteUpdate() {
  if (!db || !liveGameId || isViewer || applyingRemote) return;
  try {
    await setDoc(liveDocRef(), {
      ...publicState(),
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true });
    liveReady = true;
    setConnectionStatus("online", "Online");
  } catch (error) {
    console.error(error);
    setConnectionStatus("error", "Sync Error");
    toast("Live update failed", true);
  }
}

async function startLiveListener() {
  if (!db || !liveGameId) return;
  unsubscribeLive?.();
  const ref = liveDocRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    if (isViewer) {
      setConnectionStatus("error", "Not Found");
      toast("Game link not found", true);
      return;
    }
    await setDoc(ref, { ...publicState(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  els.viewerLink.value = buildViewerLink();
  updateShareExtras();
  liveReady = true;
  setConnectionStatus("online", "Online");
  document.body.classList.toggle("viewer-mode", isViewer);

  unsubscribeLive = onSnapshot(ref, (documentSnap) => {
    if (!documentSnap.exists()) return;
    applyingRemote = true;
    applyState(documentSnap.data());
    applyingRemote = false;
    liveReady = true;
    setConnectionStatus("online", "Online");
  }, (error) => {
    console.error(error);
    setConnectionStatus("error", "Sync Error");
    toast("Live connection error", true);
  });
}

function teamName(team) {
  return (team === "home" ? state.homeName : state.awayName).trim() || (team === "home" ? "Team 1" : "Team 2");
}

function otherTeam(team) {
  return team === "home" ? "away" : "home";
}

function pointsToWinForCurrentSet() {
  return state.setNumber >= state.matchSets ? 15 : 25;
}

function matchLabel() {
  return state.matchFormat === "highschool" ? "High School · Best 3 of 5" : "Club · Best 2 of 3";
}

function applyMatchFormat(format) {
  state.matchFormat = format === "highschool" ? "highschool" : "club";
  state.matchSets = state.matchFormat === "highschool" ? 5 : 3;
  state.setsToWin = state.matchFormat === "highschool" ? 3 : 2;

  if (state.setNumber > state.matchSets) state.setNumber = state.matchSets;
  if (state.homeSets > state.setsToWin) state.homeSets = state.setsToWin;
  if (state.awaySets > state.setsToWin) state.awaySets = state.setsToWin;
}

function snapshot() {
  state.history.push(JSON.stringify(publicState()));
  if (state.history.length > 80) state.history.shift();
}

function toast(message, hot = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle("hot", hot);
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 1700);
}

function renderSetDots(container, won) {
  container.innerHTML = "";
  for (let i = 1; i <= state.setsToWin; i++) {
    const dot = document.createElement("span");
    dot.className = `set-dot${i <= won ? " won" : ""}`;
    container.appendChild(dot);
  }
}

function render() {
  const target = pointsToWinForCurrentSet();
  els.matchTitle.textContent = state.matchTitle.toUpperCase();
  els.titleInput.value = state.matchTitle;
  els.homeName.value = state.homeName;
  els.awayName.value = state.awayName;
  els.homeNameSetting.value = state.homeName;
  els.awayNameSetting.value = state.awayName;
  els.matchFormatSetting.value = state.matchFormat;
  els.matchPill.textContent = matchLabel();
  els.homeScoreBtn.textContent = state.homeScore;
  els.awayScoreBtn.textContent = state.awayScore;
  els.homeSets.textContent = state.homeSets;
  els.awaySets.textContent = state.awaySets;
  els.setNumber.textContent = state.setNumber;
  if (els.raceTo) els.raceTo.textContent = target;
  els.homeInitial.textContent = teamName("home").charAt(0).toUpperCase();
  els.awayInitial.textContent = teamName("away").charAt(0).toUpperCase();
  renderSetDots(els.homeSetDots, state.homeSets);
  renderSetDots(els.awaySetDots, state.awaySets);
  updateAlertBanner();
  updateLiveStartOverlay();
}

function updateAlertBanner() {
  const target = pointsToWinForCurrentSet();
  const homePoint = isPointOpportunity("home");
  const awayPoint = isPointOpportunity("away");
  els.alertBanner.classList.toggle("hot", homePoint || awayPoint);

  if (homePoint) {
    els.alertBanner.textContent = state.homeSets === state.setsToWin - 1 ? "Match Point" : "Set Point";
  } else if (awayPoint) {
    els.alertBanner.textContent = state.awaySets === state.setsToWin - 1 ? "Match Point" : "Set Point";
  } else {
    els.alertBanner.textContent = `Race ${target}`;
  }
}

function scoreOf(team) { return state[`${team}Score`]; }
function setScore(team, value) { state[`${team}Score`] = Math.max(0, value); }

function hasWonSet(team) {
  const target = pointsToWinForCurrentSet();
  const own = scoreOf(team);
  const opp = scoreOf(otherTeam(team));
  return own >= target && own - opp >= state.winBy;
}

function isPointOpportunity(team) {
  const target = pointsToWinForCurrentSet();
  const own = scoreOf(team);
  const opp = scoreOf(otherTeam(team));
  const pointNeeded = Math.max(target, opp + state.winBy);
  return own === pointNeeded - 1;
}

function point(team) {
  if (isViewer) return;
  if (state.homeSets >= state.setsToWin || state.awaySets >= state.setsToWin) return;
  snapshot();
  setScore(team, scoreOf(team) + 1);
  state.lastPointFlashId = Date.now();
  render();
  showPointPulse(team);
  checkMilestones(team);
  queueRemoteUpdate();
}

function subtract(team) {
  if (isViewer || scoreOf(team) <= 0) return;
  snapshot();
  setScore(team, scoreOf(team) - 1);
  state.lastAlert = "";
  state.winner = "";
  state.setFlashTeam = "";
  state.setFlashId = 0;
  state.lastPointFlashId = 0;
  render();
  queueRemoteUpdate();
}

function checkMilestones(team) {
  if (hasWonSet(team)) {
    winSet(team);
    return;
  }

  if (isPointOpportunity(team)) {
    const possibleMatch = state[`${team}Sets`] === state.setsToWin - 1;
    const msg = possibleMatch ? `MATCH POINT — ${teamName(team)}!` : `SET POINT — ${teamName(team)}!`;
    if (state.lastAlert !== msg) {
      state.lastAlert = msg;
      toast(msg, true);
      pulseCenter();
    }
  }
}

function winSet(team) {
  state.completedSets.push({
    set: state.setNumber,
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    winner: team
  });
  state[`${team}Sets`] += 1;
  state.setFlashTeam = team;
  state.setFlashId = Date.now();
  const wonMatch = state[`${team}Sets`] >= state.setsToWin;
  render();
  triggerSetWinBadge(team);

  if (wonMatch) {
    state.winner = team;
    showWinner(team, true);
    renderRecap();
    queueRemoteUpdate();
    return;
  }

  toast(`${teamName(team)} wins Set ${state.setNumber}!`, true);
  startTimedConfetti(1600);
  queueRemoteUpdate();
  setTimeout(() => {
    if (state.winner) return;
    state.setNumber += 1;
    state.homeScore = 0;
    state.awayScore = 0;
    state.lastAlert = "";
    render();
    queueRemoteUpdate();
  }, 1100);
}

function newSet() {
  if (isViewer) return;
  if (state.setNumber >= state.matchSets) {
    toast(`${matchLabel()} only has ${state.matchSets} sets`, true);
    return;
  }
  snapshot();
  state.homeScore = 0;
  state.awayScore = 0;
  state.setNumber += 1;
  state.lastAlert = "";
  state.winner = "";
  render();
  queueRemoteUpdate();
  toast(`Set ${state.setNumber} ready`);
}

function newMatch() {
  if (isViewer) return;
  const ok = confirm("Start a new match? This clears scores and sets.");
  if (!ok) return;
  resetMatchState(true);
  toast("New match ready");
}

function undo() {
  if (isViewer) return;
  const previous = state.history.pop();
  if (!previous) {
    toast("Nothing to undo");
    return;
  }
  applyState(JSON.parse(previous));
  stopConfetti();
  hideWinner();
  queueRemoteUpdate();
  toast("Undone");
}

function saveSettings() {
  if (isViewer) return;
  const nextFormat = els.matchFormatSetting.value;
  const formatChanged = nextFormat !== state.matchFormat;

  state.matchTitle = els.titleInput.value.trim() || "Game Night";
  state.homeName = els.homeNameSetting.value.trim() || "Team 1";
  state.awayName = els.awayNameSetting.value.trim() || "Team 2";

  if (formatChanged && (state.homeScore || state.awayScore || state.homeSets || state.awaySets)) {
    const ok = confirm("Changing match format will reset the current match. Continue?");
    if (!ok) return;
    state.homeScore = 0;
    state.awayScore = 0;
    state.homeSets = 0;
    state.awaySets = 0;
    state.setNumber = 1;
    state.winner = "";
    state.setFlashTeam = "";
    state.setFlashId = 0;
    state.completedSets = [];
    state.lastPointFlashId = 0;
    hideWinner();
    stopConfetti();
  }

  applyMatchFormat(nextFormat);
  state.lastAlert = "";
  render();
  endInitialPortraitSetup();
  queueRemoteUpdate();
  toast("Setup saved");
}

function openSettings() {
  if (isViewer) return;
  if (isPortraitOrientation()) {
    document.body.classList.add("setup-active");
    document.body.classList.remove("needs-rotate");
  }
  els.titleInput.value = state.matchTitle;
  els.homeNameSetting.value = state.homeName;
  els.awayNameSetting.value = state.awayName;
  els.matchFormatSetting.value = state.matchFormat;
  els.matchPill.textContent = matchLabel();
  els.settingsDialog.showModal();
}

function openShare() {
  els.viewerLink.value = liveGameId ? buildViewerLink() : "";
  updateShareExtras();
  els.firebaseNote.textContent = hasFirebaseConfig()
    ? (liveGameId ? "This is your read-only viewer link." : "Create a live game to get a viewer link.")
    : "Live sharing needs Firebase connected first. Fill in firebase-config.js.";
  els.shareDialog.showModal();
}

async function copyViewerLink() {
  if (!els.viewerLink.value) {
    toast("Create a live game first", true);
    return;
  }
  await navigator.clipboard.writeText(els.viewerLink.value);
  toast("Viewer link copied");
}

async function shareViewerLink() {
  if (!els.viewerLink.value) {
    toast("Create a live game first", true);
    return;
  }

  const shareData = {
    title: "ScoreFlow Live Score",
    text: "Follow the live score here:",
    url: els.viewerLink.value
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      toast("Share screen opened");
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error(error);
    }
  }

  await navigator.clipboard.writeText(els.viewerLink.value);
  toast("Sharing not supported here — link copied");
}

function updateShareExtras() {
  const link = els.viewerLink?.value || "";
  if (!els.qrCard || !els.qrImage) return;
  if (!link) {
    els.qrCard.hidden = true;
    els.qrImage.removeAttribute("src");
    return;
  }
  els.qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`;
}

function toggleQrCard() {
  if (!els.viewerLink.value) {
    toast("Create a live game first", true);
    return;
  }
  updateShareExtras();
  els.qrCard.hidden = !els.qrCard.hidden;
}

function showPointPulse(team) {
  if (!els.pointPulse) return;
  const name = teamName(team).toUpperCase();
  const color = team === "home" ? state.homeColor : state.awayColor;
  els.pointPulse.textContent = `POINT ${name}!`;
  els.pointPulse.style.setProperty("--pulse-color", color);
  els.pointPulse.classList.remove("show");
  void els.pointPulse.offsetWidth;
  els.pointPulse.classList.add("show");
  clearTimeout(showPointPulse.timer);
  showPointPulse.timer = setTimeout(() => els.pointPulse.classList.remove("show"), 1250);
}

function recapText() {
  const lines = [
    `FINAL`,
    `${teamName("home")} ${state.homeSets}`,
    `${teamName("away")} ${state.awaySets}`,
    "",
    ...state.completedSets.map((set) => `Set ${set.set}: ${set.homeScore}-${set.awayScore}`),
    "",
    "Powered by ScoreFlow"
  ];
  return lines.join("\n");
}

function renderRecap() {
  if (!els.recapContent) return;
  const winnerName = state.winner ? teamName(state.winner) : "Final";
  const rows = state.completedSets.map((set) => `
    <div class="recap-set-row">
      <span>Set ${set.set}</span>
      <strong>${set.homeScore} - ${set.awayScore}</strong>
    </div>`).join("");
  els.recapContent.innerHTML = `
    <div class="recap-final">Final</div>
    <h3>${winnerName} Wins</h3>
    <div class="recap-scoreline">
      <div><span>${teamName("home")}</span><strong>${state.homeSets}</strong></div>
      <div><span>${teamName("away")}</span><strong>${state.awaySets}</strong></div>
    </div>
    <div class="recap-sets">${rows || "<p>No completed sets yet.</p>"}</div>
    <small>Powered by ScoreFlow</small>`;
}

function openRecap() {
  renderRecap();
  els.recapDialog?.showModal();
}

async function shareRecap() {
  const text = recapText();
  if (navigator.share) {
    try {
      await navigator.share({ title: "ScoreFlow Final", text });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  await navigator.clipboard.writeText(text);
  toast("Recap copied");
}

function drawPoster(finalMode = false) {
  const canvas = els.posterCanvas;
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#070a12");
  gradient.addColorStop(0.55, "#101827");
  gradient.addColorStop(1, "#05070c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = state.homeColor;
  ctx.globalAlpha = 0.23;
  ctx.beginPath();
  ctx.arc(160, 240, 340, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = state.awayColor;
  ctx.beginPath();
  ctx.arc(900, 1580, 380, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd166";
  ctx.font = "900 54px Inter, Arial";
  ctx.letterSpacing = "8px";
  ctx.fillText(finalMode || state.winner ? "FINAL SCORE" : "LIVE MATCH", w / 2, 190);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 86px Inter, Arial";
  wrapCanvasText(ctx, state.matchTitle.toUpperCase(), w / 2, 310, 900, 92);

  ctx.font = "900 96px Inter, Arial";
  ctx.fillStyle = state.homeColor;
  ctx.fillText(teamName("home").toUpperCase(), w / 2, 600);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 56px Inter, Arial";
  ctx.fillText("VS", w / 2, 720);
  ctx.fillStyle = state.awayColor;
  ctx.font = "900 96px Inter, Arial";
  ctx.fillText(teamName("away").toUpperCase(), w / 2, 860);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 190px Anton, Impact, Arial";
  ctx.fillText(`${state.homeSets} - ${state.awaySets}`, w / 2, 1160);

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "800 44px Inter, Arial";
  const setLine = state.completedSets.length ? state.completedSets.map((s) => `${s.homeScore}-${s.awayScore}`).join("  •  ") : matchLabel();
  wrapCanvasText(ctx, setLine, w / 2, 1260, 900, 56);

  ctx.fillStyle = "#ffd166";
  ctx.font = "900 58px Inter, Arial";
  ctx.fillText("Powered by ScoreFlow", w / 2, 1730);
  return canvas;
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function openPoster(finalMode = false) {
  drawPoster(finalMode);
  els.posterDialog?.showModal();
}

function posterBlob() {
  return new Promise((resolve) => els.posterCanvas.toBlob(resolve, "image/png", 0.95));
}

async function sharePoster() {
  drawPoster(Boolean(state.winner));
  const blob = await posterBlob();
  const file = new File([blob], "scoreflow-match.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "ScoreFlow Match" });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  downloadPoster();
}

function downloadPoster() {
  drawPoster(Boolean(state.winner));
  const link = document.createElement("a");
  link.download = "scoreflow-match.png";
  link.href = els.posterCanvas.toDataURL("image/png");
  link.click();
}

async function saveTeamProfiles() {
  const entries = currentTeamEntries();
  entries.forEach(saveLocalTeam);
  await Promise.allSettled(entries.map(saveCloudTeam));

  const saved = {
    homeName: entries[0].name,
    awayName: entries[1].name,
    homeColor: entries[0].color,
    awayColor: entries[1].color,
    homeLogo: entries[0].logo,
    awayLogo: entries[1].logo
  };
  localStorage.setItem("scoreflowSavedTeams", JSON.stringify(saved));
  await renderHomeData();
  toast(currentUser ? "Teams saved and synced" : "Teams saved locally");
}

function loadTeamProfiles() {
  const raw = localStorage.getItem("scoreflowSavedTeams");
  if (!raw) {
    toast("No saved teams yet", true);
    return;
  }
  const saved = JSON.parse(raw);
  state.homeName = saved.homeName || "Team 1";
  state.awayName = saved.awayName || "Team 2";
  setTeamColor("home", saved.homeColor || state.homeColor, false);
  setTeamColor("away", saved.awayColor || state.awayColor, false);
  if (saved.homeLogo) {
    els.homeLogo.src = saved.homeLogo;
    els.homeLogo.closest(".logo-picker")?.classList.add("has-logo");
  }
  if (saved.awayLogo) {
    els.awayLogo.src = saved.awayLogo;
    els.awayLogo.closest(".logo-picker")?.classList.add("has-logo");
  }
  render();
  toast("Teams loaded");
}

function handleLogo(input, img, picker) {
  if (isViewer) return;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    img.src = reader.result;
    picker.classList.add("has-logo");
  };
  reader.readAsDataURL(file);
}

function toggleFullscreen() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function pulseCenter() {
  els.alertBanner.animate([
    { transform: "scale(1)", filter: "brightness(1)" },
    { transform: "scale(1.08)", filter: "brightness(1.7)" },
    { transform: "scale(1)", filter: "brightness(1)" }
  ], { duration: 620, easing: "ease-out" });
}

function buildSwatches(container, team) {
  container.innerHTML = "";
  COLORS.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch";
    button.title = color.name;
    button.style.background = color.value;
    button.dataset.value = color.value;
    button.addEventListener("click", () => setTeamColor(team, color.value));
    container.appendChild(button);
  });
}

function setTeamColor(team, value, shouldSync = true) {
  if (isViewer && shouldSync) return;
  state[`${team}Color`] = value;
  document.documentElement.style.setProperty(team === "home" ? "--home" : "--away", value);
  document.querySelectorAll(`#${team}Swatches .swatch`).forEach((swatch) => {
    swatch.classList.toggle("selected", swatch.dataset.value.toLowerCase() === value.toLowerCase());
  });
  if (shouldSync) queueRemoteUpdate();
}

function resizeCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function startConfetti() {
  const canvas = $("confettiCanvas");
  const ctx = canvas.getContext("2d");
  resizeCanvas(canvas, ctx);
  const colors = [state.homeColor, state.awayColor, "#ffd166", "#ffffff", "#ff3b30"];
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * window.innerHeight,
    size: 5 + Math.random() * 9,
    speed: 1.7 + Math.random() * 4.2,
    drift: -1.5 + Math.random() * 3,
    spin: Math.random() * Math.PI,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
  state.confettiRunning = true;
  cancelAnimationFrame(state.confettiAnimation);
  function draw() {
    if (!state.confettiRunning) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      return;
    }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    pieces.forEach((p) => {
      p.y += p.speed;
      p.x += p.drift;
      p.spin += 0.12;
      if (p.y > window.innerHeight + 30) {
        p.y = -30;
        p.x = Math.random() * window.innerWidth;
      }
      if (p.x < -30) p.x = window.innerWidth + 30;
      if (p.x > window.innerWidth + 30) p.x = -30;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
      ctx.restore();
    });
    state.confettiAnimation = requestAnimationFrame(draw);
  }
  draw();
}

function stopConfetti() {
  state.confettiRunning = false;
  cancelAnimationFrame(state.confettiAnimation);
  const canvas = $("confettiCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function startTimedConfetti(ms) {
  startConfetti();
  clearTimeout(startTimedConfetti.timer);
  startTimedConfetti.timer = setTimeout(stopConfetti, ms);
}

function triggerSetWinBadge(team) {
  const badge = team === "home" ? els.homeSetWinBadge : els.awaySetWinBadge;
  if (!badge) return;
  badge.classList.remove("show");
  void badge.offsetWidth;
  badge.classList.add("show");
  clearTimeout(badge.hideTimer);
  badge.hideTimer = setTimeout(() => badge.classList.remove("show"), 3000);
}

function showWinner(team, sync = false) {
  els.winnerText.textContent = `${teamName(team)} Wins!`;
  document.body.classList.add("celebrating");
  els.winnerOverlay.classList.add("show");
  startConfetti();
  saveMatchHistory();
  if (sync) queueRemoteUpdate();
}

function hideWinner() {
  els.winnerOverlay.classList.remove("show");
  document.body.classList.remove("celebrating");
}

function closeWinner() {
  hideWinner();
  stopConfetti();
  if (state.winner) openRecap();
}

function updateNameFromInline(team) {
  if (isViewer) return;
  state[`${team}Name`] = (team === "home" ? els.homeName.value : els.awayName.value).trim() || (team === "home" ? "Team 1" : "Team 2");
  state.lastAlert = "";
  render();
  queueRemoteUpdate();
}

function wireEvents() {
  $("homePlus").addEventListener("click", () => point("home"));
  $("awayPlus").addEventListener("click", () => point("away"));
  $("homeScoreBtn").addEventListener("click", () => point("home"));
  $("awayScoreBtn").addEventListener("click", () => point("away"));
  $("homeMinus").addEventListener("click", () => subtract("home"));
  $("awayMinus").addEventListener("click", () => subtract("away"));
  $("undoBtn").addEventListener("click", undo);
  $("newSetBtn").addEventListener("click", newSet);
  $("newMatchBtn").addEventListener("click", newMatch);
  $("shareBtn").addEventListener("click", openShare);
  els.scoreboardHomeBtn?.addEventListener("click", showHomeScreen);
  $("settingsBtn").addEventListener("click", openSettings);
  $("saveSettingsBtn").addEventListener("click", saveSettings);
  [els.titleInput, els.homeNameSetting, els.awayNameSetting, els.homeName, els.awayName].forEach((input) => {
    input?.addEventListener("focus", selectExistingText);
    input?.addEventListener("click", selectExistingText);
  });
  els.settingsDialog.addEventListener("close", () => {
    if (!initialSetupActive) {
      document.body.classList.remove("setup-active");
      updateRotateScreenState();
    }
  });
  $("createLiveBtn").addEventListener("click", createLiveGame);
  $("copyLinkBtn").addEventListener("click", copyViewerLink);
  els.nativeShareBtn?.addEventListener("click", shareViewerLink);
  els.showQrBtn?.addEventListener("click", toggleQrCard);
  els.posterBtn?.addEventListener("click", () => openPoster(false));
  els.shareRecapBtn?.addEventListener("click", shareRecap);
  els.posterRecapBtn?.addEventListener("click", () => openPoster(true));
  els.sharePosterBtn?.addEventListener("click", sharePoster);
  els.downloadPosterBtn?.addEventListener("click", downloadPoster);
  els.saveTeamsBtn?.addEventListener("click", saveTeamProfiles);
  els.loadTeamsBtn?.addEventListener("click", loadTeamProfiles);
  els.liveStartWatchBtn?.addEventListener("click", hideLiveStartOverlay);
  els.openScoreboardBtn?.addEventListener("click", () => openScoreboardFromHome(false));
  els.homeNewMatchBtn?.addEventListener("click", () => openScoreboardFromHome(true));
  els.homeCreateLiveBtn?.addEventListener("click", async () => {
    openScoreboardFromHome(false);
    await createLiveGame();
    openShare();
  });
  els.homeSettingsBtn?.addEventListener("click", () => els.appSettingsDialog?.showModal());
  els.closeAppSettingsBtn?.addEventListener("click", () => els.appSettingsDialog?.close());
  els.emailSignInBtn?.addEventListener("click", () => emailSignIn(false));
  els.emailCreateBtn?.addEventListener("click", () => emailSignIn(true));
  els.googleSignInBtn?.addEventListener("click", () => providerSignIn("google"));
  els.appleSignInBtn?.addEventListener("click", () => providerSignIn("apple"));
  els.signOutBtn?.addEventListener("click", doSignOut);
  els.savedTeamsList?.addEventListener("click", wireHomeListClicks);
  els.favoriteTeamsList?.addEventListener("click", wireHomeListClicks);
  els.homeLogoInput.addEventListener("change", () => handleLogo(els.homeLogoInput, els.homeLogo, els.homeLogoInput.closest(".logo-picker")));
  els.awayLogoInput.addEventListener("change", () => handleLogo(els.awayLogoInput, els.awayLogo, els.awayLogoInput.closest(".logo-picker")));
  els.homeName.addEventListener("change", () => updateNameFromInline("home"));
  els.awayName.addEventListener("change", () => updateNameFromInline("away"));
  els.winnerOverlay.addEventListener("click", closeWinner);
  els.winnerOverlay.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") closeWinner();
  });
  window.addEventListener("resize", () => {
    if (state.confettiRunning) startConfetti();
    updateRotateScreenState();
  });

  window.addEventListener("orientationchange", () => {
    window.setTimeout(updateRotateScreenState, 160);
  });
}

function applyViewerMode() {
  if (!isViewer) return;
  document.body.classList.add("viewer-mode");
  document.querySelectorAll("button, input").forEach((el) => {
    if (["liveStartWatchBtn"].includes(el.id)) return;
    el.disabled = true;
  });
  els.settingsDialog?.close?.();
  els.shareDialog?.close?.();
}

async function boot() {
  applySplashImageFromStorage();
  buildSwatches(els.homeSwatches, "home");
  buildSwatches(els.awaySwatches, "away");
  wireEvents();
  setTeamColor("home", state.homeColor, false);
  setTeamColor("away", state.awayColor, false);
  applyMatchFormat(state.matchFormat);
  render();
  await renderHomeData();

  if (initFirebase()) {
    setConnectionStatus(liveGameId ? "connecting" : "offline", liveGameId ? "Connecting" : "Offline");
    if (liveGameId) await startLiveListener();
  } else {
    setConnectionStatus("offline", "Offline");
  }
  applyViewerMode();
  if (!isViewer && liveGameId) document.body.classList.add("scoreboard-active");
  updateRotateScreenState();
  registerServiceWorker();

  window.setTimeout(() => {
    hideSplash();
    if (isViewer) requestAnimationFrame(showLiveStartOverlay);
    else requestAnimationFrame(showHomeScreen);
  }, 2500);
}

boot();

import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  addDoc,
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
  homeLogo: "",
  awayLogo: "",
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

const PREMIUM_THEMES = [
  { id: "classic", name: "Classic", pro: false, tag: "Free" },
  { id: "championship", name: "Championship Gold", pro: true, tag: "Pro" },
  { id: "neon", name: "Neon Arena", pro: true, tag: "Pro" },
  { id: "midnight", name: "Midnight Glass", pro: true, tag: "Pro" },
  { id: "ice", name: "Ice Court", pro: true, tag: "Pro" },
  { id: "fire", name: "Firestorm", pro: true, tag: "Pro" }
];

const POSTER_STYLES = ["classic", "championship", "neon", "spotlight"];
const RESULTS_BACKGROUNDS = [
  { id: "default", name: "Default", file: "default.jpg", pro: false },
  { id: "default-blue", name: "Default Blue", file: "default-blue.png", pro: false },
  { id: "water-color", name: "Water Color", file: "water-color.png", pro: true },
  { id: "blue-wave", name: "Blue Wave", file: "blue-wave.png", pro: true },
  { id: "gold-bracket", name: "Gold Bracket", file: "gold-bracket.png", pro: true },
  { id: "neon-lights", name: "Neon Lights", file: "neon-lights.png", pro: true },
  { id: "power-hitter", name: "Power Hitter", file: "power-hitter.png", pro: true }
];
const FREE_MATCH_HISTORY_LIMIT = 3;
const PRO_MATCH_HISTORY_LIMIT = 10000;
const FREE_BRAND_LOGO_SRC = "scoreflow-logo.png";
const PRO_BRAND_LOGO_SRC = "images/scoreflow-pro-logo.png";
const FREE_SPLASH_LOGO_SRC = "splash-logo.png";


const premium = {
  isPro: false,
  theme: "classic",
  posterStyle: "classic",
  resultBackground: "default",
  cloudBackup: false
};

const $ = (id) => document.getElementById(id);
const els = {
  app: $("app"),
  scoreboardHomeBtn: $("scoreboardHomeBtn"),
  matchTitle: $("matchTitle"),
  liveStatus: $("liveStatus"),
  viewerCount: $("viewerCount"),
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
  resultsCloseBtn: $("resultsCloseBtn"),
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
  homeCreateLiveBtn: $("homeCreateLiveBtn"),
  matchSetupScreen: $("matchSetupScreen"),
  matchSetupBackBtn: $("matchSetupBackBtn"),
  startLiveFromSetupBtn: $("startLiveFromSetupBtn"),
  homeSettingsBtn: $("homeSettingsBtn"),
  homeTeamSetupBtn: $("homeTeamSetupBtn"),
  homeTeamSummary: $("homeTeamSummary"),
  homeTeamCard: $("homeTeamCard"),
  homeTeamDisplay: $("homeTeamDisplay"),
  homeTeamCardLogo: $("homeTeamCardLogo"),
  homeTeamCardInitial: $("homeTeamCardInitial"),
  homeTeamCardName: $("homeTeamCardName"),
  homeTeamCardLocation: $("homeTeamCardLocation"),
  homeTeamDialog: $("homeTeamDialog"),
  closeHomeTeamDialogBtn: $("closeHomeTeamDialogBtn"),
  homeTeamLogoInput: $("homeTeamLogoInput"),
  homeTeamLogoPreview: $("homeTeamLogoPreview"),
  homeTeamLogoPreviewWrap: $("homeTeamLogoPreviewWrap"),
  homeTeamLogoInitial: $("homeTeamLogoInitial"),
  homeTeamNameInput: $("homeTeamNameInput"),
  homeTeamLocationInput: $("homeTeamLocationInput"),
  homeTeamColorHex: $("homeTeamColorHex"),
  homeTeamColorField: $("homeTeamColorField"),
  homeTeamColorFieldThumb: $("homeTeamColorFieldThumb"),
  homeTeamHueTrack: $("homeTeamHueTrack"),
  homeTeamHueThumb: $("homeTeamHueThumb"),
  saveHomeTeamBtn: $("saveHomeTeamBtn"),
  appSettingsDialog: $("appSettingsDialog"),
  settingsScreen: $("settingsScreen"),
  settingsBackBtn: $("settingsBackBtn"),
  settingsThemesBtn: $("settingsThemesBtn"),
  settingsGraphicsBtn: $("settingsGraphicsBtn"),
  settingsThemesScreen: $("settingsThemesScreen"),
  settingsThemesBackBtn: $("settingsThemesBackBtn"),
  settingsGraphicsScreen: $("settingsGraphicsScreen"),
  settingsGraphicsBackBtn: $("settingsGraphicsBackBtn"),
  backgroundGraphicsGrid: $("backgroundGraphicsGrid"),
  settingsProCardSlot: $("settingsProCardSlot"),
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
  matchHistoryMoreBtn: $("matchHistoryMoreBtn"),
  matchHistoryScreen: $("matchHistoryScreen"),
  matchHistoryBackBtn: $("matchHistoryBackBtn"),
  fullMatchHistoryList: $("fullMatchHistoryList"),
  accountChip: $("accountChip"),
  proHomeCard: $("proHomeCard"),
  proPlanBadge: $("proPlanBadge"),
  proSummary: $("proSummary"),
  upgradeProBtn: $("upgradeProBtn"),
  themesShortcutBtn: $("themesShortcutBtn"),
  settingsPlanName: $("settingsPlanName"),
  settingsPlanDescription: $("settingsPlanDescription"),
  settingsUpgradeBtn: $("settingsUpgradeBtn"),
  themeGrid: $("themeGrid"),
  posterStyleSelect: $("posterStyleSelect"),
  posterStyleNote: $("posterStyleNote"),
  cloudBackupToggle: $("cloudBackupToggle"),
  cloudBackupToggleText: $("cloudBackupToggleText"),
  backupNowBtn: $("backupNowBtn"),
  historyLimitText: $("historyLimitText"),
  fanZone: $("fanZone"),
  fanZoneToggle: $("fanZoneToggle"),
  chatFeed: $("chatFeed"),
  chatForm: $("chatForm"),
  chatInput: $("chatInput"),
  sendChatBtn: $("sendChatBtn"),
  chatNameDialog: $("chatNameDialog"),
  chatNameInput: $("chatNameInput"),
  chatNameSaveBtn: $("chatNameSaveBtn"),
  landscapeChatOverlay: $("landscapeChatOverlay"),
  reactionRow: $("reactionRow"),
  floatingReactions: $("floatingReactions"),
  inMatchSettingsDrawer: $("inMatchSettingsDrawer"),
  inMatchSettingsCloseBtn: $("inMatchSettingsCloseBtn"),
  inMatchSaveSettingsBtn: $("inMatchSaveSettingsBtn"),
  inMatchTitleInput: $("inMatchTitleInput"),
  inMatchHomeNameInput: $("inMatchHomeNameInput"),
  inMatchAwayNameInput: $("inMatchAwayNameInput"),
  inMatchHomeSwatches: $("inMatchHomeSwatches"),
  inMatchAwaySwatches: $("inMatchAwaySwatches"),
  portraitScoreboard: $("portraitScoreboard"),
  portraitMatchTitle: $("portraitMatchTitle"),
  portraitLiveStatus: $("portraitLiveStatus"),
  portraitViewerCount: $("portraitViewerCount"),
  portraitSetNumber: $("portraitSetNumber"),
  portraitRaceTo: $("portraitRaceTo"),
  portraitHomeName: $("portraitHomeName"),
  portraitAwayName: $("portraitAwayName"),
  portraitHomeSets: $("portraitHomeSets"),
  portraitAwaySets: $("portraitAwaySets"),
  portraitHomeInitial: $("portraitHomeInitial"),
  portraitAwayInitial: $("portraitAwayInitial"),
  portraitHomeLogo: $("portraitHomeLogo"),
  portraitAwayLogo: $("portraitAwayLogo"),
  portraitHomeLogoWrap: $("portraitHomeLogoWrap"),
  portraitAwayLogoWrap: $("portraitAwayLogoWrap"),
  portraitHomeScoreBtn: $("portraitHomeScoreBtn"),
  portraitAwayScoreBtn: $("portraitAwayScoreBtn"),
  portraitAlertBanner: $("portraitAlertBanner"),
  portraitInMatchSettingsScreen: $("portraitInMatchSettingsScreen"),
  portraitInMatchSettingsBackBtn: $("portraitInMatchSettingsBackBtn"),
  portraitInMatchSaveSettingsBtn: $("portraitInMatchSaveSettingsBtn"),
  portraitInMatchTitleInput: $("portraitInMatchTitleInput"),
  portraitInMatchHomeNameInput: $("portraitInMatchHomeNameInput"),
  portraitInMatchAwayNameInput: $("portraitInMatchAwayNameInput"),
  portraitInMatchHomeSwatches: $("portraitInMatchHomeSwatches"),
  portraitInMatchAwaySwatches: $("portraitInMatchAwaySwatches")
};


function selectExistingText(event) {
  const input = event.currentTarget;
  if (!input || typeof input.select !== "function") return;
  requestAnimationFrame(() => input.select());
}

function preventMobileDoubleTapZoom() {
  let lastTouchEnd = 0;
  document.addEventListener("touchend", (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  document.addEventListener("gesturestart", (event) => {
    event.preventDefault();
  }, { passive: false });
}

let db = null;
let auth = null;
let currentUser = null;
let lastSavedWinnerKey = "";
let liveGameId = GAME_ID_FROM_URL || "";
let unsubscribeLive = null;
let unsubscribeChat = null;
let unsubscribeReactions = null;
let unsubscribePresence = null;
let presenceTimer = null;
const viewerSessionId = (() => {
  const key = "scoreflowViewerSessionId";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const next = `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem(key, next);
  return next;
})();
let chatCooldownUntil = 0;
let reactionCooldownUntil = 0;
let viewerChatName = "";
const seenReactionIds = new Set();
const seenLandscapeChatIds = new Set();
let applyingRemote = false;
let liveReady = false;
let remoteTimer = null;
let brandingRemoteTimer = null;
let initialSetupActive = false;
let setupComplete = false;
let splashClosed = false;
let activeResultsMatch = null;
let activeResultsGraphic = null;
let activeResultsGraphicPromise = null;


function updateViewportHeight() {
  const visualHeight = window.visualViewport?.height || 0;
  const innerHeight = window.innerHeight || 0;
  const clientHeight = document.documentElement.clientHeight || 0;
  const screenHeight = window.screen?.height || 0;
  const isPortrait = window.matchMedia?.("(orientation: portrait)")?.matches ?? innerHeight >= window.innerWidth;
  const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;

  // iPhone Safari/PWA can report the smaller "safe" viewport first, then settle.
  // For installed portrait PWAs, screen.height is usually the full usable canvas.
  // In regular Safari, prefer the largest live layout value so fixed screens do
  // not stop short and leave the dark strip at the bottom.
  const candidates = [innerHeight, clientHeight, visualHeight].filter(Boolean);
  if (isPortrait && standalone && screenHeight) candidates.push(screenHeight);

  const layoutHeight = Math.max(...candidates);
  if (!layoutHeight || !Number.isFinite(layoutHeight)) return;

  document.documentElement.style.setProperty("--scoreflow-vh", `${Math.ceil(layoutHeight)}px`);
}

function scheduleViewportUpdate() {
  updateViewportHeight();
  requestAnimationFrame(updateViewportHeight);
  window.setTimeout(updateViewportHeight, 60);
  window.setTimeout(updateViewportHeight, 180);
  window.setTimeout(updateViewportHeight, 420);
}

function hideSplash() {
  if (splashClosed) return;
  splashClosed = true;
  document.body.classList.add("splash-done");
}

function fitHeaderTitle() {
  const title = els.matchTitle;
  if (!title) return;
  title.style.fontSize = "";
  if (isPortraitOrientation()) return;
  const max = 34;
  const min = 18;
  let size = max;
  title.style.fontSize = `${size}px`;
  let guard = 0;
  while (title.scrollWidth > title.clientWidth && size > min && guard < 40) {
    size -= 1;
    title.style.fontSize = `${size}px`;
    guard += 1;
  }
}

function setConnectionStatus(status, label) {
  if (!els.liveStatus) return;
  const cleanStatus = ["online", "offline", "error", "connecting"].includes(status) ? status : "offline";
  els.liveStatus.classList.remove("online", "offline", "error", "connecting");
  els.liveStatus.classList.add(cleanStatus);
  els.liveStatus.textContent = label || (cleanStatus === "online" ? "Online" : cleanStatus === "connecting" ? "Connecting" : cleanStatus === "error" ? "Sync Error" : "Offline");
  if (els.portraitLiveStatus) {
    els.portraitLiveStatus.textContent = els.liveStatus.textContent;
    els.portraitLiveStatus.className = `portrait-live-pill ${cleanStatus}`;
  }
}

function brandLogoSrc() {
  return hasProAccess() ? PRO_BRAND_LOGO_SRC : FREE_BRAND_LOGO_SRC;
}

function brandLogoAlt() {
  return hasProAccess() ? "ScoreFlow Pro" : "ScoreFlow";
}

function updateBranding() {
  const src = brandLogoSrc();
  const alt = brandLogoAlt();
  document.querySelectorAll(".home-brand-logo, .scoreflow-header-logo, .splash-brand-logo, .powered-by-logo img, .results-powered img").forEach((img) => {
    img.src = src;
    img.alt = alt;
  });
  document.body.classList.toggle("pro-branding-active", hasProAccess());
}

function applySplashImageFromStorage() {
  if (els.splashLogoImg) {
    els.splashLogoImg.src = FREE_SPLASH_LOGO_SRC;
    els.splashLogoImg.alt = "ScoreFlow";
  }
}



function liveChatCollectionRef() {
  if (!db || !liveGameId) return null;
  return collection(db, "volleyballGames", liveGameId, "chat");
}

function liveReactionCollectionRef() {
  if (!db || !liveGameId) return null;
  return collection(db, "volleyballGames", liveGameId, "reactions");
}

function livePresenceCollectionRef() {
  if (!db || !liveGameId) return null;
  return collection(db, "volleyballGames", liveGameId, "presence");
}

function setViewerCount(count) {
  if (!els.viewerCount) return;
  const safeCount = Math.max(0, Number(count) || 0);
  els.viewerCount.textContent = `👁 ${safeCount}`;
  els.viewerCount.title = `${safeCount} live viewer${safeCount === 1 ? "" : "s"}`;
  if (els.portraitViewerCount) els.portraitViewerCount.textContent = `Viewers ${safeCount}`;
}

async function updatePresence() {
  if (!db || !liveGameId) return;
  try {
    await setDoc(doc(db, "volleyballGames", liveGameId, "presence", viewerSessionId), {
      role: isViewer ? "viewer" : "scorer",
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true });
  } catch (error) {
    console.warn("Presence update failed", error);
  }
}

async function startPresenceTracking() {
  if (!db || !liveGameId) return;
  window.clearInterval(presenceTimer);
  unsubscribePresence?.();

  await updatePresence();
  presenceTimer = window.setInterval(updatePresence, 15000);

  const presenceRef = livePresenceCollectionRef();
  if (!presenceRef) return;
  const presenceQuery = query(presenceRef, orderBy("updatedAtMs", "desc"), limit(100));
  unsubscribePresence = onSnapshot(presenceQuery, (snap) => {
    const cutoff = Date.now() - 45000;
    const liveViewers = snap.docs
      .map((d) => d.data())
      .filter((item) => item.role === "viewer" && Number(item.updatedAtMs || 0) >= cutoff).length;
    setViewerCount(liveViewers);
  }, (error) => console.warn("Viewer count listener failed", error));
}



/* =========================================================
   Viewer Chat Identity
   Viewer-only name prompt. Uses the unique viewer session id so
   one spectator's chat name never becomes the default for everyone.
   ========================================================= */
function viewerChatNameStorageKey() {
  return `scoreflowViewerChatName:${liveGameId || "local"}:${viewerSessionId}`;
}

function cleanChatName(value) {
  return (value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

function loadViewerChatName() {
  if (!isViewer) return "";
  viewerChatName = cleanChatName(sessionStorage.getItem(viewerChatNameStorageKey()) || "");
  return viewerChatName;
}

function saveViewerChatName(value) {
  if (!isViewer) return "";
  viewerChatName = cleanChatName(value);
  if (viewerChatName) sessionStorage.setItem(viewerChatNameStorageKey(), viewerChatName);
  return viewerChatName;
}

function openChatNamePrompt(force = false) {
  if (!isViewer || !els.chatNameDialog) return;
  const existing = loadViewerChatName();
  if (existing && !force) return;
  if (els.chatNameInput) els.chatNameInput.value = existing;
  if (typeof els.chatNameDialog.showModal === "function") {
    els.chatNameDialog.showModal();
  } else {
    els.chatNameDialog.setAttribute("open", "");
  }
  window.setTimeout(() => els.chatNameInput?.focus?.(), 80);
}

function closeChatNamePrompt() {
  els.chatNameDialog?.close?.();
}

function saveChatNameFromPrompt() {
  const name = saveViewerChatName(els.chatNameInput?.value || "");
  if (!name) {
    toast("Enter a chat name first", true);
    els.chatNameInput?.focus?.();
    return false;
  }
  closeChatNamePrompt();
  return true;
}


function renderChatMessages(messages = []) {
  if (!els.chatFeed) return;
  els.chatFeed.innerHTML = "";
  if (!messages.length) {
    const empty = document.createElement("p");
    empty.className = "chat-empty";
    empty.textContent = "Be the first fan to cheer!";
    els.chatFeed.appendChild(empty);
    return;
  }
  messages.forEach((message) => {
    const item = document.createElement("article");
    item.className = `chat-message ${message.role === "scorer" ? "scorer-message" : ""}`;
    if (message.sessionId && message.sessionId === viewerSessionId) item.classList.add("own-message");
    const name = document.createElement("strong");
    name.textContent = message.name || (message.role === "scorer" ? "Scorer" : "Fan");
    const text = document.createElement("span");
    text.textContent = message.text || "";
    item.append(name, text);
    els.chatFeed.appendChild(item);
  });
  els.chatFeed.scrollTop = els.chatFeed.scrollHeight;
}

function showLandscapeChatMessage(message = {}, docId = "") {
  if (!isViewer || !els.landscapeChatOverlay || !message?.text) return;
  if (docId && seenLandscapeChatIds.has(docId)) return;
  if (docId) seenLandscapeChatIds.add(docId);

  const createdAtMs = Number(message.createdAtMs || 0);
  if (createdAtMs && Date.now() - createdAtMs > 9000) return;

  const item = document.createElement("article");
  item.className = `landscape-chat-toast ${message.role === "scorer" ? "scorer-message" : ""}`;

  const name = document.createElement("strong");
  name.textContent = message.role === "scorer" ? "Scorer:" : `${message.name || "Fan"}:`;

  const text = document.createElement("span");
  text.textContent = message.text || "";

  item.append(name, document.createTextNode(" "), text);
  els.landscapeChatOverlay.appendChild(item);

  while (els.landscapeChatOverlay.children.length > 4) {
    els.landscapeChatOverlay.firstElementChild?.remove();
  }

  window.setTimeout(() => item.classList.add("is-leaving"), 2800);
  window.setTimeout(() => item.remove(), 3600);
}

function showFloatingReaction(emoji) {
  if (!els.floatingReactions || !emoji) return;
  const bubble = document.createElement("div");
  bubble.className = "floating-reaction";
  bubble.textContent = emoji;
  bubble.style.left = `${18 + Math.random() * 64}%`;
  bubble.style.setProperty("--drift", `${(Math.random() - 0.5) * 90}px`);
  els.floatingReactions.appendChild(bubble);
  window.setTimeout(() => bubble.remove(), 5200);
}

async function startFanZoneListeners() {
  if (!db || !liveGameId || !els.fanZone) return;
  unsubscribeChat?.();
  unsubscribeReactions?.();

  const chatRef = liveChatCollectionRef();
  if (chatRef) {
    const chatQuery = query(chatRef, orderBy("createdAtMs", "asc"), limit(40));
    unsubscribeChat = onSnapshot(chatQuery, (snap) => {
      renderChatMessages(snap.docs.map((d) => d.data()));
      snap.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        showLandscapeChatMessage(change.doc.data(), change.doc.id);
      });
    }, (error) => console.warn("Chat listener failed", error));
  }

  const reactionsRef = liveReactionCollectionRef();
  if (reactionsRef) {
    const reactionQuery = query(reactionsRef, orderBy("createdAtMs", "asc"), limit(60));
    unsubscribeReactions = onSnapshot(reactionQuery, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== "added" || seenReactionIds.has(change.doc.id)) return;
        seenReactionIds.add(change.doc.id);
        const data = change.doc.data();
        if (Date.now() - Number(data.createdAtMs || 0) < 9000) showFloatingReaction(data.emoji);
      });
    }, (error) => console.warn("Reaction listener failed", error));
  }
}

async function sendChatMessage(event) {
  event?.preventDefault?.();
  if (!db || !liveGameId) {
    toast("Live chat starts after a live match is created", true);
    return;
  }
  const text = (els.chatInput?.value || "").trim().slice(0, 60);
  if (!text) return;
  if (isViewer && !loadViewerChatName()) {
    openChatNamePrompt(true);
    return;
  }
  if (Date.now() < chatCooldownUntil) {
    toast("Give chat a second", true);
    return;
  }
  chatCooldownUntil = Date.now() + 1800;
  els.chatInput.value = "";
  try {
    await addDoc(liveChatCollectionRef(), {
      text,
      name: isViewer ? viewerChatName : "Scorer",
      role: isViewer ? "viewer" : "scorer",
      sessionId: isViewer ? viewerSessionId : "scorer",
      createdAt: serverTimestamp(),
      createdAtMs: Date.now()
    });
  } catch (error) {
    console.error(error);
    toast("Chat failed to send", true);
  }
}

async function sendReaction(emoji) {
  if (!emoji) return;
  showFloatingReaction(emoji);
  if (!db || !liveGameId) return;
  if (Date.now() < reactionCooldownUntil) return;
  reactionCooldownUntil = Date.now() + 650;
  try {
    await addDoc(liveReactionCollectionRef(), {
      emoji,
      createdAt: serverTimestamp(),
      createdAtMs: Date.now()
    });
  } catch (error) {
    console.warn("Reaction failed", error);
  }
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


function startViewerWatch() {
  hideLiveStartOverlay();
  openChatNamePrompt(false);
}



function bindDialogBackdropClose() {
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
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
  document.body.classList.remove("scoreboard-active", "setup-active", "history-active", "match-setup-active", "settings-active", "in-match-settings-open");
  initialSetupActive = false;
  updateRotateScreenState();
  renderHomeData();
  window.setTimeout(() => document.body.classList.remove("screen-transitioning"), 260);
}

function openScoreboardFromHome(startFresh = false) {
  if (isViewer) return;
  document.body.classList.add("screen-transitioning");
  document.body.classList.remove("home-active", "match-setup-active", "settings-active", "history-active", "in-match-settings-open");
  document.body.classList.add("scoreboard-active");
  window.setTimeout(() => document.body.classList.remove("screen-transitioning"), 260);
  if (startFresh) {
    resetMatchState(false);
    toast("New match ready");
  }
  setupComplete = true;
  updateRotateScreenState();
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

const HOME_TEAM_KEY = "scoreflowHomeTeamV2";
const homeTeamDraft = {
  name: "",
  location: "",
  color: "#d62828",
  logo: "",
  hue: 0,
  saturation: 82,
  value: 84
};

function normalizeHex(value, fallback = "#d62828") {
  const raw = String(value || "").trim();
  const expanded = raw.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, "#$1$1$2$2$3$3");
  return /^#[a-f\d]{6}$/i.test(expanded) ? expanded.toLowerCase() : fallback;
}

function hexToRgb(hex) {
  const safe = normalizeHex(hex).slice(1);
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => {
    const safe = Math.max(0, Math.min(255, Math.round(value)));
    return safe.toString(16).padStart(2, "0");
  }).join("")}`;
}

function hsvToHex(h, s, v) {
  const hue = ((Number(h) % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, Number(s))) / 100;
  const val = Math.max(0, Math.min(100, Number(v))) / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function hexToHsv(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const max = Math.max(rp, gp, bp);
  const min = Math.min(rp, gp, bp);
  const delta = max - min;
  let h = 0;

  if (delta) {
    if (max === rp) h = 60 * (((gp - bp) / delta) % 6);
    else if (max === gp) h = 60 * ((bp - rp) / delta + 2);
    else h = 60 * ((rp - gp) / delta + 4);
  }

  return {
    hue: Math.round((h + 360) % 360),
    saturation: max ? Math.round((delta / max) * 100) : 0,
    value: Math.round(max * 100)
  };
}

function savedHomeTeam() {
  const saved = getLocalJson(HOME_TEAM_KEY, null);
  return saved && typeof saved === "object" ? saved : null;
}

function updateColorPickerUI() {
  const color = normalizeHex(homeTeamDraft.color);
  const pureHue = hsvToHex(homeTeamDraft.hue, 100, 100);
  if (els.homeTeamColorField) {
    els.homeTeamColorField.style.setProperty("--picker-hue", pureHue);
  }
  if (els.homeTeamColorFieldThumb) {
    els.homeTeamColorFieldThumb.style.left = `${homeTeamDraft.saturation}%`;
    els.homeTeamColorFieldThumb.style.top = `${100 - homeTeamDraft.value}%`;
    els.homeTeamColorFieldThumb.style.background = color;
  }
  if (els.homeTeamHueThumb) {
    els.homeTeamHueThumb.style.left = `${(homeTeamDraft.hue / 360) * 100}%`;
    els.homeTeamHueThumb.style.background = pureHue;
  }
  if (els.homeTeamColorHex) els.homeTeamColorHex.value = color;
}

function setHomeTeamDraftColor(hex) {
  const color = normalizeHex(hex, homeTeamDraft.color);
  const next = hexToHsv(color);
  homeTeamDraft.color = color;
  homeTeamDraft.hue = next.hue;
  homeTeamDraft.saturation = next.saturation;
  homeTeamDraft.value = next.value;
  updateColorPickerUI();
}

function setColorFromFieldPoint(clientX, clientY) {
  const field = els.homeTeamColorField;
  if (!field) return;
  const rect = field.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  homeTeamDraft.saturation = Math.round(x * 100);
  homeTeamDraft.value = Math.round((1 - y) * 100);
  homeTeamDraft.color = hsvToHex(homeTeamDraft.hue, homeTeamDraft.saturation, homeTeamDraft.value);
  updateColorPickerUI();
}

function setHueFromPoint(clientX) {
  const track = els.homeTeamHueTrack;
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  homeTeamDraft.hue = Math.round(x * 360);
  homeTeamDraft.color = hsvToHex(homeTeamDraft.hue, homeTeamDraft.saturation, homeTeamDraft.value);
  updateColorPickerUI();
}

function bindColorDrag(target, handler) {
  if (!target) return;
  target.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    target.setPointerCapture?.(event.pointerId);
    handler(event);
    const onMove = (moveEvent) => handler(moveEvent);
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
  });
}

function updateHomeTeamLogoPreview() {
  const logo = homeTeamDraft.logo || "";
  const initial = (homeTeamDraft.name || "T").charAt(0).toUpperCase();
  if (els.homeTeamLogoInitial) els.homeTeamLogoInitial.textContent = initial;
  if (els.homeTeamLogoPreview) {
    if (logo) {
      els.homeTeamLogoPreview.src = logo;
      els.homeTeamLogoPreviewWrap?.classList.add("has-logo");
    } else {
      els.homeTeamLogoPreview.removeAttribute("src");
      els.homeTeamLogoPreviewWrap?.classList.remove("has-logo");
    }
  }
}

function applyHomeTeamToScoreboard(team) {
  if (!team) return;
  state.homeName = team.name || state.homeName;
  state.homeColor = normalizeHex(team.color, state.homeColor);
  if (els.homeName) els.homeName.value = state.homeName;
  if (els.homeNameSetting) els.homeNameSetting.value = state.homeName;
  state.homeLogo = team.logo || state.homeLogo || "";
  setTeamColor("home", state.homeColor, false);
  updateBroadcastLogo("home");
  if (els.homeInitial) els.homeInitial.textContent = (state.homeName || "T").charAt(0).toUpperCase();
}

function applySavedHomeTeam() {
  const team = savedHomeTeam();
  if (!team) return;
  applyHomeTeamToScoreboard(team);
}

function updateHomeTeamCard(team = savedHomeTeam()) {
  if (!els.homeTeamCard) return;
  const hasTeam = Boolean(team?.name);
  const color = normalizeHex(team?.color, state.homeColor);
  els.homeTeamCard.classList.toggle("has-home-team", hasTeam);
  els.homeTeamCard.style.setProperty("--home-team-card-color", color);
  if (els.homeTeamCardName) els.homeTeamCardName.textContent = hasTeam ? team.name : "Set up your team";
  if (els.homeTeamCardLocation) els.homeTeamCardLocation.textContent = hasTeam ? (team.location || "Home team") : "Team name, city/state, logo, and color";
  if (els.homeTeamCardInitial) els.homeTeamCardInitial.textContent = (team?.name || "T").charAt(0).toUpperCase();
  if (els.homeTeamCardLogo) {
    if (team?.logo) {
      els.homeTeamCardLogo.src = team.logo;
      els.homeTeamCardLogo.closest(".home-team-logo-card")?.classList.add("has-logo");
    } else {
      els.homeTeamCardLogo.removeAttribute("src");
      els.homeTeamCardLogo.closest(".home-team-logo-card")?.classList.remove("has-logo");
    }
  }
  if (els.homeTeamSetupBtn) els.homeTeamSetupBtn.textContent = hasTeam ? "Edit Home Team" : "Setup Your Home Team";
}

function openHomeTeamDialog() {
  const saved = savedHomeTeam();
  homeTeamDraft.name = saved?.name || state.homeName || "";
  homeTeamDraft.location = saved?.location || "";
  homeTeamDraft.logo = saved?.logo || "";
  setHomeTeamDraftColor(saved?.color || state.homeColor || "#d62828");

  if (els.homeTeamNameInput) els.homeTeamNameInput.value = homeTeamDraft.name === "Team 1" ? "" : homeTeamDraft.name;
  if (els.homeTeamLocationInput) els.homeTeamLocationInput.value = homeTeamDraft.location;
  updateHomeTeamLogoPreview();
  els.homeTeamDialog?.showModal();
}

function saveHomeTeam() {
  const name = (els.homeTeamNameInput?.value || "").trim();
  if (!name) {
    toast("Enter your team name", true);
    els.homeTeamNameInput?.focus();
    return;
  }

  const team = {
    name,
    location: (els.homeTeamLocationInput?.value || "").trim(),
    color: normalizeHex(homeTeamDraft.color),
    logo: homeTeamDraft.logo,
    updatedAtMs: Date.now()
  };

  setLocalJson(HOME_TEAM_KEY, team);
  applyHomeTeamToScoreboard(team);
  updateHomeTeamCard(team);
  updateHomeTeamSummary();
  render();
  queueRemoteBrandingUpdate();
  els.homeTeamDialog?.close();
  toast("Home team saved");
}

function handleHomeTeamLogoUpload() {
  const file = els.homeTeamLogoInput?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    homeTeamDraft.logo = String(reader.result || "");
    updateHomeTeamLogoPreview();
  };
  reader.readAsDataURL(file);
}

function loadPremiumSettings() {
  const saved = getLocalJson("scoreflowPremiumV1", null);
  if (saved && typeof saved === "object") {
    premium.isPro = Boolean(saved.isPro);
    premium.theme = saved.theme || "classic";
    premium.posterStyle = saved.posterStyle || "classic";
    premium.resultBackground = saved.resultBackground || "default";
    premium.cloudBackup = Boolean(saved.cloudBackup) && Boolean(saved.isPro);
  }
  applyPremiumSettings(false);
}

function savePremiumSettings(sync = true) {
  setLocalJson("scoreflowPremiumV1", premium);
  applyPremiumSettings(sync);
}

function hasProAccess() {
  return Boolean(premium.isPro);
}

function matchHistoryLimit() {
  return hasProAccess() ? PRO_MATCH_HISTORY_LIMIT : FREE_MATCH_HISTORY_LIMIT;
}

function normalizeTheme(themeId) {
  const theme = PREMIUM_THEMES.find((item) => item.id === themeId) || PREMIUM_THEMES[0];
  return theme.pro && !hasProAccess() ? "classic" : theme.id;
}

function normalizePosterStyle(style) {
  const next = POSTER_STYLES.includes(style) ? style : "classic";
  return next !== "classic" && !hasProAccess() ? "classic" : next;
}

function normalizeResultBackground(backgroundId) {
  const bg = RESULTS_BACKGROUNDS.find((item) => item.id === backgroundId) || RESULTS_BACKGROUNDS[0];
  return bg.pro && !hasProAccess() ? "default" : bg.id;
}

function applyPremiumSettings(sync = true) {
  premium.theme = normalizeTheme(premium.theme);
  premium.posterStyle = normalizePosterStyle(premium.posterStyle);
  premium.resultBackground = normalizeResultBackground(premium.resultBackground);
  document.body.dataset.theme = premium.theme;
  document.body.classList.toggle("pro-active", hasProAccess());
  if (!hasProAccess()) premium.cloudBackup = false;
  const cloudBackupOn = hasProAccess() && premium.cloudBackup;
  if (els.cloudBackupToggle) {
    els.cloudBackupToggle.checked = cloudBackupOn;
    els.cloudBackupToggle.setAttribute("aria-checked", cloudBackupOn ? "true" : "false");
  }
  if (els.cloudBackupToggleText) els.cloudBackupToggleText.textContent = hasProAccess() ? (cloudBackupOn ? "On" : "Off") : "Pro";
  if (els.posterStyleSelect) els.posterStyleSelect.value = premium.posterStyle;
  applySplashImageFromStorage();
  updateBranding();
  renderPremiumUI();
  if (sync) syncPremiumSettingsToCloud();
}

function renderPremiumUI() {
  const pro = hasProAccess();
  if (els.proPlanBadge) els.proPlanBadge.textContent = pro ? "Pro" : "Free";
  if (els.proSummary) els.proSummary.textContent = pro
    ? "Pro is active: premium themes, graphics, unlimited history, and cloud backup are unlocked."
    : "Unlock premium themes, graphics, unlimited history, and cloud backup.";
  if (els.upgradeProBtn) els.upgradeProBtn.textContent = pro ? "Manage Pro" : "Try Pro";
  if (els.settingsUpgradeBtn) els.settingsUpgradeBtn.textContent = pro ? "Pro Active" : "Try Pro";
  if (els.settingsPlanName) els.settingsPlanName.textContent = pro ? "ScoreFlow Pro" : "Free";
  if (els.settingsPlanDescription) els.settingsPlanDescription.textContent = pro
    ? "Premium themes, poster styles, unlimited match history, and cloud backup are active."
    : "Free includes live scoring, sharing, QR codes, and your latest 3 matches.";
  if (els.historyLimitText) els.historyLimitText.textContent = pro
    ? "Pro keeps unlimited match history in this app and syncs it to your account when cloud backup is on."
    : "Free keeps your latest 3 matches. Pro unlocks unlimited match history and account cloud backup.";
  if (els.posterStyleNote) els.posterStyleNote.textContent = pro ? "Premium poster styles are unlocked." : "Premium poster styles are part of ScoreFlow Pro.";
  if (els.themeGrid) {
    els.themeGrid.innerHTML = PREMIUM_THEMES.map((theme) => {
      const locked = theme.pro && !pro;
      const active = theme.id === premium.theme;
      return `<button value="default" type="button" class="theme-choice ${active ? "active" : ""} ${locked ? "locked" : ""}" data-theme-choice="${theme.id}">
        <span class="theme-dot theme-${theme.id}"></span>
        <span><strong>${theme.name}</strong><small>${locked ? "Pro unlock" : theme.tag}</small></span>
        <b>${active ? "✓" : locked ? "★" : ""}</b>
      </button>`;
    }).join("");
  }
  if (els.backgroundGraphicsGrid) {
    els.backgroundGraphicsGrid.innerHTML = RESULTS_BACKGROUNDS.map((bg) => {
      const locked = bg.pro && !pro;
      const active = bg.id === premium.resultBackground;
      return `<button value="default" type="button" class="graphic-choice ${active ? "active" : ""} ${locked ? "locked" : ""}" data-background-choice="${bg.id}">
        <span class="graphic-thumb results-bg-${bg.id}"></span>
        <span><strong>${bg.name}</strong><small>${locked ? "Pro graphic" : "Free graphic"}</small></span>
        <b>${active ? "✓" : locked ? "★" : ""}</b>
      </button>`;
    }).join("");
  }
}


function toggleProDemo() {
  premium.isPro = !premium.isPro;
  if (!premium.isPro) {
    premium.theme = "classic";
    premium.posterStyle = "classic";
    premium.cloudBackup = false;
    if (RESULTS_BACKGROUNDS.find((bg) => bg.id === premium.resultBackground)?.pro) premium.resultBackground = "default";
  } else {
    premium.cloudBackup = true;
  }
  savePremiumSettings(true);
  renderHomeData();
  toast(premium.isPro ? "ScoreFlow Pro preview unlocked" : "Returned to Free plan");
}

function setPremiumTheme(themeId) {
  const theme = PREMIUM_THEMES.find((item) => item.id === themeId);
  if (!theme) return;
  if (theme.pro && !hasProAccess()) {
    toast("That theme is a Pro feature", true);
    focusProFromSettings();
    return;
  }
  premium.theme = theme.id;
  savePremiumSettings(true);
  toast(`${theme.name} theme applied`);
}

function setPosterStyle(style) {
  if (style !== "classic" && !hasProAccess()) {
    premium.posterStyle = "classic";
    if (els.posterStyleSelect) els.posterStyleSelect.value = "classic";
    toast("Premium poster styles require Pro", true);
    return;
  }
  premium.posterStyle = normalizePosterStyle(style);
  savePremiumSettings(true);
  toast("Poster style updated");
}

function setResultBackground(backgroundId) {
  const bg = RESULTS_BACKGROUNDS.find((item) => item.id === backgroundId);
  if (!bg) return;
  if (bg.pro && !hasProAccess()) {
    toast("That background graphic is a Pro feature", true);
    focusProFromSettings();
    return;
  }
  premium.resultBackground = bg.id;
  savePremiumSettings(true);
  toast(`${bg.name} background selected`);
}

function openSettingsPage(page = "main") {
  renderPremiumUI();
  document.body.classList.remove("match-setup-active");
  document.body.classList.add("settings-active");
  document.body.dataset.settingsPage = page;
}

function closeSettingsPage() {
  document.body.classList.remove("settings-active");
  document.body.dataset.settingsPage = "main";
}

function focusProFromSettings() {
  document.body.dataset.settingsPage = "main";
  window.setTimeout(() => {
    const card = document.querySelector("#settingsScreen .settings-pro-card");
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
    card?.classList.remove("pro-attention");
    void card?.offsetWidth;
    card?.classList.add("pro-attention");
    window.setTimeout(() => card?.classList.remove("pro-attention"), 3400);
  }, 240);
}


async function syncPremiumSettingsToCloud() {
  if (!currentUser || !db || !premium.cloudBackup) return;
  try {
    await setDoc(doc(db, ...userDocPath("settings", "premium")), {
      ...premium,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true });
  } catch (error) {
    console.warn("Premium settings backup failed", error);
  }
}

async function backupNow() {
  if (!hasProAccess()) {
    toast("Cloud backup is a Pro feature", true);
    focusProFromSettings();
    return;
  }
  if (!currentUser || !db) {
    toast("Sign in to use cloud backup", true);
    return;
  }
  if (!premium.cloudBackup) {
    toast("Turn Cloud Backup on first", true);
    return;
  }
  premium.cloudBackup = els.cloudBackupToggle ? els.cloudBackupToggle.checked : premium.cloudBackup;
  savePremiumSettings(false);
  await syncPremiumSettingsToCloud();
  await syncLocalDataToCloud();
  toast("Cloud backup complete");
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
  if (!currentUser || !db || !premium.cloudBackup) return;
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
  state[`${slot}Logo`] = team.logo || "";
  updateBroadcastLogo(slot);
  render();
  queueRemoteBrandingUpdate();
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
    const snap = await getDocs(query(collection(db, ...userDocPath("matches")), orderBy("updatedAtMs", "desc"), limit(matchHistoryLimit())));
    const cloud = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const merged = [...cloud];
    local.forEach((match) => {
      if (!merged.some((item) => item.id === match.id)) merged.push(match);
    });
    const limited = merged.slice(0, matchHistoryLimit());
    setLocalJson("scoreflowMatchHistoryV2", limited);
    return limited;
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
    winnerSide: state.winner,
    homeLogo: els.homeLogo?.src?.startsWith("data:") ? els.homeLogo.src : (savedHomeTeam()?.logo || ""),
    awayLogo: els.awayLogo?.src?.startsWith("data:") ? els.awayLogo.src : "",
    completedSets: state.completedSets,
    matchFormat: state.matchFormat,
    matchSets: state.matchSets,
    resultBackground: premium.resultBackground || "default",
    updatedAtMs: Date.now()
  };
  const matches = localMatches();
  matches.unshift(match);
  setLocalJson("scoreflowMatchHistoryV2", matches.slice(0, matchHistoryLimit()));
  if (currentUser && db && premium.cloudBackup) {
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

function matchHistoryLogoMarkup(logo, name, side) {
  const initial = (name || (side === "home" ? "H" : "A")).charAt(0).toUpperCase();
  return `
    <span class="match-team-logo ${logo ? "has-logo" : ""}" aria-hidden="true">
      ${logo ? `<img src="${logo}" alt="">` : `<span>${initial}</span>`}
    </span>`;
}

function matchCard(match) {
  const homeName = match.homeName || "Team 1";
  const awayName = match.awayName || "Team 2";
  const homeSets = Number(match.homeSets ?? 0);
  const awaySets = Number(match.awaySets ?? 0);
  const winnerSide = match.winnerSide || (match.winner === homeName ? "home" : match.winner === awayName ? "away" : homeSets > awaySets ? "home" : "away");
  const resultClass = winnerSide === "home" ? "is-win" : "is-loss";
  return `
    <button class="match-history-card ${resultClass}" type="button" data-match-history-id="${match.id || ""}" aria-label="View ${homeName} versus ${awayName} match details">
      <span class="match-team match-team-home">
        ${matchHistoryLogoMarkup(match.homeLogo || savedHomeTeam()?.logo || "", homeName, "home")}
        <span class="match-team-name">${homeName}</span>
      </span>
      <span class="match-set-score">${homeSets}<span>-</span>${awaySets}</span>
      <span class="match-team match-team-away">
        <span class="match-team-name">${awayName}</span>
        ${matchHistoryLogoMarkup(match.awayLogo || "", awayName, "away")}
      </span>
    </button>`;
}


function resultLogoMarkup(logo, name, className = "") {
  const initial = (name || "T").charAt(0).toUpperCase();
  return `
    <span class="results-logo ${logo ? "has-logo" : ""} ${className}" aria-hidden="true">
      ${logo ? `<img src="${logo}" alt="">` : `<span>${initial}</span>`}
    </span>`;
}

function formatMatchDate(match) {
  const raw = Number(match?.updatedAtMs || match?.createdAtMs || Date.now());
  const date = new Date(raw);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function matchSetCount(match) {
  const explicit = Number(match?.matchSets || 0);
  if (explicit === 5 || explicit === 3) return explicit;
  return match?.matchFormat === "highschool" ? 5 : 3;
}

function currentMatchResultData() {
  return {
    id: "current-result",
    title: state.matchTitle || "Game Night",
    homeName: teamName("home"),
    awayName: teamName("away"),
    homeSets: state.homeSets,
    awaySets: state.awaySets,
    homeColor: state.homeColor,
    awayColor: state.awayColor,
    winner: state.winner ? teamName(state.winner) : "",
    winnerSide: state.winner || (state.homeSets > state.awaySets ? "home" : "away"),
    homeLogo: currentTeamLogo("home"),
    awayLogo: currentTeamLogo("away"),
    completedSets: state.completedSets,
    matchFormat: state.matchFormat,
    matchSets: state.matchSets,
    resultBackground: premium.resultBackground || "default",
    updatedAtMs: Date.now()
  };
}

function renderResultsCard(match) {
  if (!els.recapContent || !match) return;
  const homeName = match.homeName || "Team 1";
  const awayName = match.awayName || "Team 2";
  const homeSets = Number(match.homeSets ?? 0);
  const awaySets = Number(match.awaySets ?? 0);
  const totalRows = matchSetCount(match);
  const completed = Array.isArray(match.completedSets) ? match.completedSets : [];
  const rows = Array.from({ length: totalRows }, (_, index) => {
    const set = completed[index];
    const homeScore = set ? Number(set.homeScore ?? 0) : "–";
    const awayScore = set ? Number(set.awayScore ?? 0) : "–";
    return `
      <div class="results-set-row" style="--row-delay:${index * 95}ms">
        <strong>${homeScore}</strong>
        <span></span>
        <strong>${awayScore}</strong>
      </div>`;
  }).join("");

  const homeScoreColor = normalizeHex(match.homeColor || savedHomeTeam()?.color || state.homeColor || "#d62828");
  const awayScoreColor = normalizeHex(match.awayColor || state.awayColor || "#1565c0", "#1565c0");

  els.recapContent.innerHTML = `
    <article class="results-card results-bg-${normalizeResultBackground(premium.resultBackground || match.resultBackground || "default")}" style="--results-home-score-color:${homeScoreColor}; --results-away-score-color:${awayScoreColor};">
      <time class="results-date">${formatMatchDate(match)}</time>
      <div class="results-top-logo">
        ${resultLogoMarkup(match.homeLogo || savedHomeTeam()?.logo || "", homeName, "results-main-logo")}
      </div>
      <div class="results-title-block">
        <span>Match Result</span>
        <h3>${match.title || "Game Night"}</h3>
      </div>
      <div class="results-matchup">
        ${resultLogoMarkup(match.homeLogo || savedHomeTeam()?.logo || "", homeName)}
        <strong class="results-team-bar results-home-bar">${homeName}</strong>
        <span class="results-vs">VS</span>
        <strong class="results-team-bar results-away-bar">${awayName}</strong>
        ${resultLogoMarkup(match.awayLogo || "", awayName)}
      </div>
      <div class="results-set-table" aria-label="Set scores">
        ${rows}
      </div>
      <small class="powered-by-logo results-powered">Presented by <img src="${brandLogoSrc()}" alt="${brandLogoAlt()}" /></small>
    </article>`;
}

function openResults(match) {
  hideWinner();
  stopConfetti();
  activeResultsMatch = match || currentMatchResultData();
  activeResultsGraphic = null;
  activeResultsGraphicPromise = null;
  renderResultsCard(activeResultsMatch);
  setResultsActionState(false);
  els.recapDialog?.showModal();
}

async function openMatchResultsById(matchId) {
  if (!matchId) return;
  const matches = await getAllMatches();
  const match = matches.find((item) => item.id === matchId);
  if (match) openResults(match);
}

function handleMatchResultCardClick(event) {
  const card = event.target.closest("[data-match-history-id]");
  if (!card) return;
  openMatchResultsById(card.dataset.matchHistoryId);
}

function updateHomeTeamSummary() {
  if (!els.homeTeamSummary) return;
  const saved = savedHomeTeam();
  if (!saved?.name) {
    els.homeTeamSummary.textContent = "Set up your team once, then only enter the opponent when you start a match.";
    updateHomeTeamCard(null);
    return;
  }

  const location = saved.location ? ` · ${saved.location}` : "";
  els.homeTeamSummary.textContent = `${saved.name}${location} is ready as your default home team.`;
  updateHomeTeamCard(saved);
}

async function renderHomeData() {
  if (!els.homeScreen) return;
  updateHomeTeamSummary();
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
    const visibleMatches = matches.slice(0, 3);
    els.matchHistoryList.innerHTML = visibleMatches.length ? visibleMatches.map(matchCard).join("") : `<p class="empty-note">Completed matches will show up here.</p>`;
  }
  renderPremiumUI();
  if (document.body.classList.contains("history-active")) await renderFullMatchHistoryPage();
  setAuthStatus(currentUser ? `Signed in as ${currentUser.email || "ScoreFlow user"}` : "Guest mode — sign in to sync teams and history.");
}


function pulseProCard() {
  if (!els.proHomeCard) return;
  els.proHomeCard.scrollIntoView({ behavior: "smooth", block: "center" });
  els.proHomeCard.classList.remove("pro-attention");
  void els.proHomeCard.offsetWidth;
  els.proHomeCard.classList.add("pro-attention");
  window.setTimeout(() => els.proHomeCard?.classList.remove("pro-attention"), 3200);
}

async function renderFullMatchHistoryPage() {
  if (!els.fullMatchHistoryList) return;
  const matches = await getAllMatches();
  els.fullMatchHistoryList.innerHTML = matches.length
    ? matches.map(matchCard).join("")
    : `<section class="home-card"><p class="empty-note">Completed matches will show up here.</p></section>`;
}

async function openMatchHistoryPage() {
  if (isViewer) return;
  document.body.classList.add("screen-transitioning");
  document.body.classList.remove("home-active", "scoreboard-active", "setup-active", "match-setup-active", "fan-zone-open");
  els.fanZoneToggle?.setAttribute("aria-expanded", "false");
  document.body.classList.add("history-active");
  await renderFullMatchHistoryPage();
  els.matchHistoryScreen?.scrollTo?.({ top: 0, behavior: "instant" });
  window.setTimeout(() => document.body.classList.remove("screen-transitioning"), 260);
}

function openMatchHistoryMore() {
  if (!hasProAccess()) {
    pulseProCard();
    toast("ScoreFlow Pro unlocks unlimited match history", true);
    return;
  }
  openMatchHistoryPage();
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
  openMatchSetupPage();
}

function updateRotateScreenState() {
  document.body.classList.remove("needs-rotate");
}

function endInitialPortraitSetup() {
  initialSetupActive = false;
  setupComplete = true;
  document.body.classList.remove("setup-active");
  updateRotateScreenState();
}

function publicState(includeBranding = true) {
  const data = {
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

  if (includeBranding) {
    data.homeLogo = state.homeLogo || "";
    data.awayLogo = state.awayLogo || "";
  }

  return data;
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
    lastPointFlashId: incomingPointFlashId,
    homeLogo: typeof next.homeLogo === "string" ? next.homeLogo : state.homeLogo,
    awayLogo: typeof next.awayLogo === "string" ? next.awayLogo : state.awayLogo
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
  // Push lightweight live score changes only. Team logos are large data URLs and
  // should not be re-uploaded on every point tap.
  if (!db || !liveGameId || isViewer || applyingRemote) return;
  clearTimeout(remoteTimer);
  remoteTimer = setTimeout(pushRemoteUpdate, 120);
}

function queueRemoteBrandingUpdate() {
  // Use this when names, colors, or logos change. It sends the full public state
  // once, then regular scoring goes back to lightweight updates.
  if (!db || !liveGameId || isViewer || applyingRemote) return;
  clearTimeout(brandingRemoteTimer);
  brandingRemoteTimer = setTimeout(pushRemoteBrandingUpdate, 120);
}

async function pushRemoteUpdate() {
  if (!db || !liveGameId || isViewer || applyingRemote) return;
  try {
    await setDoc(liveDocRef(), {
      ...publicState(false),
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

async function pushRemoteBrandingUpdate() {
  if (!db || !liveGameId || isViewer || applyingRemote) return;
  try {
    await setDoc(liveDocRef(), {
      ...publicState(true),
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true });
    liveReady = true;
    setConnectionStatus("online", "Online");
  } catch (error) {
    console.error(error);
    setConnectionStatus("error", "Sync Error");
    toast("Live branding update failed", true);
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
  if (isViewer) document.body.classList.add("scoreboard-active");
  await startFanZoneListeners();
  await startPresenceTracking();

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

function updateScoreButton(button, value) {
  if (!button) return;
  const next = String(value);
  if (button.textContent !== next) {
    button.textContent = next;
    button.classList.remove("score-pop");
    void button.offsetWidth;
    button.classList.add("score-pop");
    window.setTimeout(() => button.classList.remove("score-pop"), 260);
    return;
  }
  button.textContent = next;
}



/* =========================================================
   Stage 5: Portrait Scoreboard Rendering
   ========================================================= */
function currentTeamLogo(team) {
  const stateLogo = state[`${team}Logo`] || "";
  const img = team === "home" ? els.homeLogo : els.awayLogo;
  const savedLogo = team === "home" ? (savedHomeTeam()?.logo || "") : "";
  return stateLogo || (img?.src?.startsWith("data:") ? img.src : "") || savedLogo;
}

function setLogoElement(img, wrap, logo) {
  if (!img || !wrap) return;
  if (logo) {
    img.src = logo;
    wrap.classList.add("has-logo");
  } else {
    img.removeAttribute("src");
    wrap.classList.remove("has-logo");
  }
}

function updateBroadcastLogo(team) {
  const img = team === "home" ? els.homeLogo : els.awayLogo;
  const wrap = img?.closest(".logo-picker");
  setLogoElement(img, wrap, currentTeamLogo(team));
}

function updatePortraitLogo(team) {
  const portraitImg = team === "home" ? els.portraitHomeLogo : els.portraitAwayLogo;
  const portraitWrap = team === "home" ? els.portraitHomeLogoWrap : els.portraitAwayLogoWrap;
  setLogoElement(portraitImg, portraitWrap, currentTeamLogo(team));
}

function updatePortraitScoreboard() {
  const target = pointsToWinForCurrentSet();
  if (els.portraitMatchTitle) els.portraitMatchTitle.textContent = (state.matchTitle || "Game Night").toUpperCase();
  if (els.portraitSetNumber) els.portraitSetNumber.textContent = state.setNumber;
  if (els.portraitRaceTo) els.portraitRaceTo.textContent = `First to ${target}`;
  if (els.portraitHomeName) els.portraitHomeName.textContent = teamName("home");
  if (els.portraitAwayName) els.portraitAwayName.textContent = teamName("away");
  if (els.portraitHomeSets) els.portraitHomeSets.textContent = state.homeSets;
  if (els.portraitAwaySets) els.portraitAwaySets.textContent = state.awaySets;
  if (els.portraitHomeInitial) els.portraitHomeInitial.textContent = teamName("home").charAt(0).toUpperCase();
  if (els.portraitAwayInitial) els.portraitAwayInitial.textContent = teamName("away").charAt(0).toUpperCase();
  updateScoreButton(els.portraitHomeScoreBtn, state.homeScore);
  updateScoreButton(els.portraitAwayScoreBtn, state.awayScore);
  updatePortraitLogo("home");
  updatePortraitLogo("away");
  if (els.portraitScoreboard) {
    els.portraitScoreboard.style.setProperty("--portrait-home-color", state.homeColor);
    els.portraitScoreboard.style.setProperty("--portrait-away-color", state.awayColor);
  }
  if (els.portraitLiveStatus && els.liveStatus) {
    els.portraitLiveStatus.textContent = els.liveStatus.textContent || "Offline";
    els.portraitLiveStatus.className = `portrait-live-pill ${els.liveStatus.classList.contains("online") ? "online" : els.liveStatus.classList.contains("connecting") ? "connecting" : els.liveStatus.classList.contains("error") ? "error" : "offline"}`;
  }
  if (els.portraitViewerCount && els.viewerCount) els.portraitViewerCount.textContent = els.viewerCount.textContent.replace("👁", "Viewers").trim();
}

function render() {
  const target = pointsToWinForCurrentSet();
  els.matchTitle.textContent = state.matchTitle.toUpperCase();
  requestAnimationFrame(fitHeaderTitle);
  els.titleInput.value = state.matchTitle;
  els.homeName.value = state.homeName;
  els.awayName.value = state.awayName;
  els.homeNameSetting.value = state.homeName;
  els.awayNameSetting.value = state.awayName;
  if (els.inMatchTitleInput) els.inMatchTitleInput.value = state.matchTitle;
  if (els.inMatchHomeNameInput) els.inMatchHomeNameInput.value = state.homeName;
  if (els.inMatchAwayNameInput) els.inMatchAwayNameInput.value = state.awayName;
  if (els.portraitInMatchTitleInput) els.portraitInMatchTitleInput.value = state.matchTitle;
  if (els.portraitInMatchHomeNameInput) els.portraitInMatchHomeNameInput.value = state.homeName;
  if (els.portraitInMatchAwayNameInput) els.portraitInMatchAwayNameInput.value = state.awayName;
  els.matchFormatSetting.value = state.matchFormat;
  els.matchPill.textContent = matchLabel();
  updateScoreButton(els.homeScoreBtn, state.homeScore);
  updateScoreButton(els.awayScoreBtn, state.awayScore);
  els.homeSets.textContent = state.homeSets;
  els.awaySets.textContent = state.awaySets;
  els.setNumber.textContent = state.setNumber;
  if (els.raceTo) els.raceTo.textContent = target;
  els.homeInitial.textContent = teamName("home").charAt(0).toUpperCase();
  els.awayInitial.textContent = teamName("away").charAt(0).toUpperCase();
  renderSetDots(els.homeSetDots, state.homeSets);
  renderSetDots(els.awaySetDots, state.awaySets);
  updateAlertBanner();
  updateBroadcastLogo("home");
  updateBroadcastLogo("away");
  updatePortraitScoreboard();
  updateLiveStartOverlay();
}

function updateAlertBanner() {
  const target = pointsToWinForCurrentSet();
  const homePoint = isPointOpportunity("home");
  const awayPoint = isPointOpportunity("away");
  els.alertBanner.classList.toggle("hot", homePoint || awayPoint);

  let message = `First to ${target}`;
  if (homePoint) {
    message = state.homeSets === state.setsToWin - 1 ? "Match Point" : "Set Point";
  } else if (awayPoint) {
    message = state.awaySets === state.setsToWin - 1 ? "Match Point" : "Set Point";
  }
  els.alertBanner.textContent = message;
  if (els.portraitAlertBanner) {
    els.portraitAlertBanner.textContent = message;
    els.portraitAlertBanner.classList.toggle("hot", homePoint || awayPoint);
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

function saveSettings(options = {}) {
  if (isViewer) return false;
  const nextFormat = els.matchFormatSetting.value;
  const formatChanged = nextFormat !== state.matchFormat;

  state.matchTitle = els.titleInput.value.trim() || "Game Night";
  state.homeName = els.homeNameSetting.value.trim() || "Team 1";
  state.awayName = els.awayNameSetting.value.trim() || "Team 2";

  if (formatChanged && (state.homeScore || state.awayScore || state.homeSets || state.awaySets)) {
    const ok = confirm("Changing match format will reset the current match. Continue?");
    if (!ok) return false;
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
  if (!options.silent) toast("Setup saved");
  return true;
}

function populateMatchSetupFields() {
  if (els.titleInput) els.titleInput.value = state.matchTitle;
  if (els.homeNameSetting) els.homeNameSetting.value = state.homeName;
  if (els.awayNameSetting) els.awayNameSetting.value = state.awayName;
  if (els.matchFormatSetting) els.matchFormatSetting.value = state.matchFormat;
  if (els.inMatchTitleInput) els.inMatchTitleInput.value = state.matchTitle;
  if (els.inMatchHomeNameInput) els.inMatchHomeNameInput.value = state.homeName;
  if (els.inMatchAwayNameInput) els.inMatchAwayNameInput.value = state.awayName;
  if (els.portraitInMatchTitleInput) els.portraitInMatchTitleInput.value = state.matchTitle;
  if (els.portraitInMatchHomeNameInput) els.portraitInMatchHomeNameInput.value = state.homeName;
  if (els.portraitInMatchAwayNameInput) els.portraitInMatchAwayNameInput.value = state.awayName;
  if (els.matchPill) els.matchPill.textContent = matchLabel();
  setTeamColor("home", state.homeColor, false);
  setTeamColor("away", state.awayColor, false);
}

function openMatchSetupPage() {
  if (isViewer) return;
  populateMatchSetupFields();
  document.body.classList.add("match-setup-active");
  document.body.classList.remove("settings-active", "history-active", "needs-rotate");
  els.matchSetupScreen?.scrollTo?.({ top: 0, behavior: "instant" });
}

function closeMatchSetupPage() {
  document.body.classList.remove("match-setup-active");
  if (!document.body.classList.contains("scoreboard-active")) {
    document.body.classList.add("home-active");
  }
}

async function startMatchFromSetup(startLive = false) {
  if (isViewer) return;
  const saved = saveSettings({ silent: true });
  if (!saved) return;
  resetMatchState(false);
  openScoreboardFromHome(false);
  toast(startLive ? "Live match ready" : "Match ready");
  if (startLive) {
    await createLiveGame();
    openShare();
  }
}

function populateInMatchSettingsFields() {
  if (els.inMatchTitleInput) els.inMatchTitleInput.value = state.matchTitle;
  if (els.inMatchHomeNameInput) els.inMatchHomeNameInput.value = state.homeName;
  if (els.inMatchAwayNameInput) els.inMatchAwayNameInput.value = state.awayName;
  if (els.portraitInMatchTitleInput) els.portraitInMatchTitleInput.value = state.matchTitle;
  if (els.portraitInMatchHomeNameInput) els.portraitInMatchHomeNameInput.value = state.homeName;
  if (els.portraitInMatchAwayNameInput) els.portraitInMatchAwayNameInput.value = state.awayName;
  setTeamColor("home", state.homeColor, false);
  setTeamColor("away", state.awayColor, false);
}

function openInMatchSettings() {
  if (isViewer) return;
  populateInMatchSettingsFields();
  document.body.classList.add("in-match-settings-open");
  els.inMatchSettingsDrawer?.setAttribute("aria-hidden", "false");
}

function closeInMatchSettings() {
  document.body.classList.remove("in-match-settings-open");
  els.inMatchSettingsDrawer?.setAttribute("aria-hidden", "true");
}

function saveInMatchSettings() {
  if (isViewer) return;
  state.matchTitle = els.inMatchTitleInput?.value?.trim() || "Game Night";
  state.homeName = els.inMatchHomeNameInput?.value?.trim() || "Team 1";
  state.awayName = els.inMatchAwayNameInput?.value?.trim() || "Team 2";
  state.lastAlert = "";
  render();
  queueRemoteUpdate();
  closeInMatchSettings();
  toast("Setup saved");
}



/* =========================================================
   Stage 5: Portrait In-Match Settings
   ========================================================= */
function populatePortraitInMatchSettingsFields() {
  if (els.portraitInMatchTitleInput) els.portraitInMatchTitleInput.value = state.matchTitle;
  if (els.portraitInMatchHomeNameInput) els.portraitInMatchHomeNameInput.value = state.homeName;
  if (els.portraitInMatchAwayNameInput) els.portraitInMatchAwayNameInput.value = state.awayName;
  setTeamColor("home", state.homeColor, false);
  setTeamColor("away", state.awayColor, false);
}

function openPortraitInMatchSettings() {
  if (isViewer) return;
  populatePortraitInMatchSettingsFields();
  document.body.classList.add("portrait-in-match-settings-active");
  els.portraitInMatchSettingsScreen?.scrollTo?.({ top: 0, behavior: "instant" });
}

function closePortraitInMatchSettings() {
  document.body.classList.remove("portrait-in-match-settings-active");
}

function savePortraitInMatchSettings() {
  if (isViewer) return;
  state.matchTitle = els.portraitInMatchTitleInput?.value?.trim() || "Game Night";
  state.homeName = els.portraitInMatchHomeNameInput?.value?.trim() || "Team 1";
  state.awayName = els.portraitInMatchAwayNameInput?.value?.trim() || "Team 2";
  state.lastAlert = "";
  render();
  queueRemoteUpdate();
  closePortraitInMatchSettings();
  toast("Setup saved");
}

function openSettings() {
  if (document.body.classList.contains("scoreboard-active")) {
    if (isPortraitOrientation()) openPortraitInMatchSettings();
    else openInMatchSettings();
    return;
  }
  openMatchSetupPage();
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

/* =========================================================
   Polish: Point Animation System
   - Replaces the old full-screen point text.
   - Keeps the score pop/glow tight to the score area.
   - Shows a premium "Point Team!" tag over the scoring team's logo.
   ========================================================= */
function pointAnimationTargets(team) {
  const isHome = team === "home";
  return {
    color: isHome ? state.homeColor : state.awayColor,
    name: teamName(team).toUpperCase(),
    side: isHome ? "home" : "away",
    scoreButtons: [
      isHome ? els.homeScoreBtn : els.awayScoreBtn,
      isHome ? els.portraitHomeScoreBtn : els.portraitAwayScoreBtn
    ].filter(Boolean),
    pointPanels: [
      isHome ? els.homeLogo?.closest(".broadcast-team") : els.awayLogo?.closest(".broadcast-team"),
      isHome ? els.portraitHomeLogoWrap?.closest(".portrait-team") : els.portraitAwayLogoWrap?.closest(".portrait-team")
    ].filter(Boolean)
  };
}

function ensurePointBanner(panel, side) {
  let banner = panel.querySelector(":scope > .point-team-banner");
  if (!banner) {
    banner = document.createElement("span");
    banner.className = "point-team-banner";
    banner.setAttribute("aria-hidden", "true");
    panel.appendChild(banner);
  }
  banner.classList.toggle("home-point-banner", side === "home");
  banner.classList.toggle("away-point-banner", side === "away");
  return banner;
}

function showPointPulse(team) {
  const { color, name, side, scoreButtons, pointPanels } = pointAnimationTargets(team);

  scoreButtons.forEach((button) => {
    button.style.setProperty("--point-glow-color", color);
    button.classList.remove("point-glow");
    void button.offsetWidth;
    button.classList.add("point-glow");
    window.clearTimeout(button.pointGlowTimer);
    button.pointGlowTimer = window.setTimeout(() => button.classList.remove("point-glow"), 780);
  });

  pointPanels.forEach((panel) => {
    const banner = ensurePointBanner(panel, side);
    banner.textContent = `POINT ${name}!`;
    banner.style.setProperty("--point-banner-color", color);
    banner.classList.remove("show");
    void banner.offsetWidth;
    banner.classList.add("show");
    window.clearTimeout(banner.pointBannerTimer);
    banner.pointBannerTimer = window.setTimeout(() => banner.classList.remove("show"), 1150);
  });

  if (els.pointPulse) els.pointPulse.classList.remove("show");
}

function recapText() {
  const lines = [
    `FINAL`,
    `${teamName("home")} ${state.homeSets}`,
    `${teamName("away")} ${state.awaySets}`,
    "",
    ...state.completedSets.map((set) => `Set ${set.set}: ${set.homeScore}-${set.awayScore}`),
    "",
    "Shared from ScoreFlow"
  ];
  return lines.join("\n");
}

function renderRecap() {
  renderResultsCard(currentMatchResultData());
}

function openRecap() {
  openResults(currentMatchResultData());
}


function resultBackgroundMeta(backgroundId = premium.resultBackground) {
  return RESULTS_BACKGROUNDS.find((item) => item.id === normalizeResultBackground(backgroundId)) || RESULTS_BACKGROUNDS[0];
}

function resultBackgroundUrl(backgroundId = premium.resultBackground) {
  const bg = resultBackgroundMeta(backgroundId);
  return `images/results/${bg.file || "default.jpg"}`;
}

function loadCanvasImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function canvasRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}


function canvasInitials(value, fallback = "T") {
  const clean = String(value || fallback)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!clean.length) return fallback;

  return clean
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function drawCanvasLogo(ctx, img, fallback, x, y, size, options = {}) {
  const radius = options.square ? 0 : size / 2;
  ctx.save();
  if (!options.noBadge) {
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,.32)";
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.12;
    if (options.square) {
      canvasRoundRect(ctx, x - size / 2, y - size / 2, size, size, 18);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowColor = "transparent";
  }
  if (img) {
    const inset = options.noBadge ? 0 : size * 0.1;
    const drawSize = size - inset * 2;
    ctx.drawImage(img, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
  } else {
    ctx.fillStyle = options.noBadge ? "#ffffff" : "#07101e";
    ctx.font = `900 ${Math.round(size * 0.34)}px Inter, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(canvasInitials(fallback), x, y + 2);
  }
  ctx.restore();
}

async function drawResultsGraphic(match = currentMatchResultData()) {
  const canvas = els.posterCanvas;
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const bg = resultBackgroundMeta(premium.resultBackground || match.resultBackground || "default");
  const bgImg = await loadCanvasImage(resultBackgroundUrl(bg.id));
  const homeName = match.homeName || "Team 1";
  const awayName = match.awayName || "Team 2";
  const homeColor = normalizeHex(match.homeColor || savedHomeTeam()?.color || state.homeColor || "#d62828");
  const awayColor = normalizeHex(match.awayColor || state.awayColor || "#1565c0", "#1565c0");
  const homeLogo = await loadCanvasImage(match.homeLogo || savedHomeTeam()?.logo || "");
  const awayLogo = await loadCanvasImage(match.awayLogo || "");
  const brandLogo = await loadCanvasImage(brandLogoSrc());

  ctx.clearRect(0, 0, w, h);
  if (bgImg) {
    const scale = Math.max(w / bgImg.width, h / bgImg.height);
    const iw = bgImg.width * scale;
    const ih = bgImg.height * scale;
    ctx.drawImage(bgImg, (w - iw) / 2, (h - ih) / 2, iw, ih);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#3a2570");
    gradient.addColorStop(1, "#080b12");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.fillStyle = "rgba(5,7,12,.30)";
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w / 2, 160, 0, w / 2, 160, 540);
  glow.addColorStop(0, "rgba(255,255,255,.16)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,.76)";
  ctx.font = "900 28px Inter, Arial";
  ctx.fillText(formatMatchDate(match), w - 70, 72);

  drawCanvasLogo(ctx, homeLogo, homeName, w / 2, 270, 270, { noBadge: true });

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff1a6";
  ctx.font = "950 96px Inter, Arial";
  ctx.shadowColor = "rgba(0,0,0,.34)";
  ctx.shadowBlur = 18;
  ctx.fillText("MATCH RESULT", w / 2, 520);
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "rgba(255,255,255,.84)";
  ctx.font = "900 32px Inter, Arial";
  ctx.fillText(String(match.title || "Game Night").toUpperCase(), w / 2, 575);

  const barY = 720;
  const barH = 76;
  const leftLogoX = 156;
  const rightLogoX = w - 156;
  ctx.fillStyle = "rgba(255,255,255,.94)";
  ctx.shadowColor = "rgba(0,0,0,.20)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  canvasRoundRect(ctx, 150, barY, 350, barH, 8);
  ctx.fill();
  canvasRoundRect(ctx, w - 500, barY, 350, barH, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "#07101e";
  ctx.font = "900 32px Inter, Arial";
  wrapCanvasText(ctx, homeName.toUpperCase(), 330, barY + 48, 260, 34);
  wrapCanvasText(ctx, awayName.toUpperCase(), w - 330, barY + 48, 260, 34);

  drawCanvasLogo(ctx, homeLogo, homeName, leftLogoX, barY + barH / 2, 138);
  drawCanvasLogo(ctx, awayLogo, awayName, rightLogoX, barY + barH / 2, 138);

  ctx.fillStyle = "#2258af";
  ctx.shadowColor = "rgba(0,0,0,.24)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  canvasRoundRect(ctx, w / 2 - 62, barY - 12, 124, 100, 28);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#ffffff";
  ctx.font = "950 40px Inter, Arial";
  ctx.fillText("VS", w / 2, barY + 40);

  const completed = Array.isArray(match.completedSets) ? match.completedSets : [];
  const rowCount = matchSetCount(match);
  const tableTop = 910;
  const rowGap = rowCount > 3 ? 118 : 140;
  ctx.strokeStyle = "rgba(255,255,255,.34)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w / 2, barY + 88);
  ctx.lineTo(w / 2, tableTop + rowGap * (rowCount - 1) + 54);
  ctx.stroke();

  ctx.font = "950 82px Inter, Arial";
  ctx.textBaseline = "middle";
  for (let i = 0; i < rowCount; i++) {
    const set = completed[i];
    const y = tableTop + i * rowGap;
    ctx.fillStyle = homeColor;
    ctx.textAlign = "right";
    ctx.fillText(set ? Number(set.homeScore ?? 0) : "–", w / 2 - 72, y);
    ctx.fillStyle = awayColor;
    ctx.textAlign = "left";
    ctx.fillText(set ? Number(set.awayScore ?? 0) : "–", w / 2 + 72, y);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,.76)";
  ctx.font = "800 28px Inter, Arial";
  ctx.fillText("Presented by", w / 2, h - 205);
  if (brandLogo) {
    ctx.drawImage(brandLogo, w / 2 - 132, h - 170, 264, 72);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.font = "950 48px Inter, Arial";
    ctx.fillText("ScoreFlow", w / 2, h - 132);
  }

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

function activeResultsData() {
  return activeResultsMatch || currentMatchResultData();
}

function setResultsActionState(isPreparing = false) {
  if (els.shareRecapBtn) {
    els.shareRecapBtn.classList.toggle("is-preparing", isPreparing);
    els.shareRecapBtn.setAttribute("aria-busy", String(isPreparing));
    els.shareRecapBtn.textContent = isPreparing ? "Preparing…" : "Share/Download Results";
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    if (!canvas) {
      resolve(null);
      return;
    }
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob(resolve, "image/png", 0.95);
      return;
    }
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const byteString = atob(dataUrl.split(",")[1] || "");
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
      resolve(new Blob([bytes], { type: "image/png" }));
    } catch {
      resolve(null);
    }
  });
}

async function prepareResultsGraphic(match = activeResultsData()) {
  activeResultsGraphic = null;
  setResultsActionState(true);

  try {
    const canvas = await drawResultsGraphic(match);
    if (!canvas) throw new Error("Results canvas could not be created.");

    const dataUrl = canvas.toDataURL("image/png");
    const blob = await canvasToBlob(canvas);
    if (!blob) throw new Error("Results image could not be created.");

    const file = typeof File === "function"
      ? new File([blob], "scoreflow-results.png", { type: "image/png" })
      : blob;
    activeResultsGraphic = { canvas, dataUrl, blob, file };
    return activeResultsGraphic;
  } catch (error) {
    console.error("ScoreFlow results graphic failed", error);
    toast("Results image could not be created", true);
    return null;
  } finally {
    setResultsActionState(false);
  }
}

async function getResultsGraphic(match = activeResultsData()) {
  if (activeResultsGraphic?.dataUrl || activeResultsGraphic?.file) return activeResultsGraphic;
  if (!activeResultsGraphicPromise) {
    activeResultsGraphicPromise = prepareResultsGraphic(match);
  }

  const graphic = await activeResultsGraphicPromise;
  if (!graphic) activeResultsGraphicPromise = null;
  return graphic;
}

function getReadyResultsGraphic() {
  if (activeResultsGraphic?.dataUrl || activeResultsGraphic?.file) return activeResultsGraphic;
  return null;
}

function triggerResultsDownload(graphic = getReadyResultsGraphic()) {
  if (!graphic?.dataUrl) return;
  const link = document.createElement("a");
  link.download = "scoreflow-results.png";
  link.href = graphic.dataUrl;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function openPoster(finalMode = false) {
  await sharePoster(activeResultsData());
}

async function shareRecap(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();

  const graphic = await getResultsGraphic();
  if (!graphic) {
    toast("Results image could not be created", true);
    return;
  }

  if (navigator.canShare?.({ files: [graphic.file] })) {
    try {
      await navigator.share({ files: [graphic.file], title: "ScoreFlow Results" });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.warn("Native results share failed, falling back to download", error);
    }
  }

  triggerResultsDownload(graphic);
}


async function sharePoster(match = activeResultsData()) {
  const graphic = await getResultsGraphic(match);
  if (!graphic) return;

  if (navigator.canShare?.({ files: [graphic.file] })) {
    try {
      await navigator.share({ files: [graphic.file], title: "ScoreFlow Results" });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  triggerResultsDownload(graphic);
}

async function downloadPoster(match = activeResultsData()) {
  const graphic = await getResultsGraphic(match);
  if (!graphic) return;
  triggerResultsDownload(graphic);
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
    homeLogo: state.homeLogo || entries[0].logo || "",
    awayLogo: state.awayLogo || entries[1].logo || ""
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
  state.homeLogo = saved.homeLogo || "";
  state.awayLogo = saved.awayLogo || "";
  updateBroadcastLogo("home");
  updateBroadcastLogo("away");
  render();
  queueRemoteBrandingUpdate();
  toast("Teams loaded");
}

function handleLogo(input, img, picker) {
  if (isViewer) return;
  const file = input.files?.[0];
  if (!file) return;
  const team = input === els.homeLogoInput ? "home" : "away";
  const reader = new FileReader();
  reader.onload = () => {
    const logo = String(reader.result || "");
    state[`${team}Logo`] = logo;
    setLogoElement(img, picker, logo);
    updatePortraitScoreboard();
    queueRemoteBrandingUpdate();
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
  if (!container) return;
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
  document.querySelectorAll(`#${team}Swatches .swatch, #inMatch${team === "home" ? "Home" : "Away"}Swatches .swatch`).forEach((swatch) => {
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

function addSafeListener(target, eventName, handler, options) {
  const element = typeof target === "string" ? $(target) : target;
  if (!element || typeof element.addEventListener !== "function") return;
  element.addEventListener(eventName, handler, options);
}

function wireEvents() {
  addSafeListener("homePlus", "click", () => point("home"));
  addSafeListener("awayPlus", "click", () => point("away"));
  addSafeListener("portraitHomePlus", "click", () => point("home"));
  addSafeListener("portraitAwayPlus", "click", () => point("away"));
  addSafeListener("portraitHomeScoreBtn", "click", () => point("home"));
  addSafeListener("portraitAwayScoreBtn", "click", () => point("away"));
  addSafeListener("portraitHomeMinus", "click", () => subtract("home"));
  addSafeListener("portraitAwayMinus", "click", () => subtract("away"));
  addSafeListener("portraitNewMatchBtn", "click", newMatch);
  addSafeListener("portraitShareBtn", "click", openShare);
  addSafeListener("homeScoreBtn", "click", () => point("home"));
  addSafeListener("awayScoreBtn", "click", () => point("away"));
  addSafeListener("homeMinus", "click", () => subtract("home"));
  addSafeListener("awayMinus", "click", () => subtract("away"));
  addSafeListener("undoBtn", "click", undo);
  addSafeListener("newSetBtn", "click", newSet);
  addSafeListener("newMatchBtn", "click", newMatch);
  addSafeListener("shareBtn", "click", openShare);
  els.scoreboardHomeBtn?.addEventListener("click", showHomeScreen);
  addSafeListener("settingsBtn", "click", openSettings);
  els.inMatchSettingsCloseBtn?.addEventListener("click", closeInMatchSettings);
  els.inMatchSaveSettingsBtn?.addEventListener("click", saveInMatchSettings);
  els.portraitInMatchSettingsBackBtn?.addEventListener("click", closePortraitInMatchSettings);
  els.portraitInMatchSaveSettingsBtn?.addEventListener("click", savePortraitInMatchSettings);
  addSafeListener("saveSettingsBtn", "click", () => startMatchFromSetup(false));
  els.startLiveFromSetupBtn?.addEventListener("click", () => startMatchFromSetup(true));
  els.matchSetupBackBtn?.addEventListener("click", closeMatchSetupPage);
  [els.titleInput, els.homeNameSetting, els.awayNameSetting, els.inMatchTitleInput, els.inMatchHomeNameInput, els.inMatchAwayNameInput, els.portraitInMatchTitleInput, els.portraitInMatchHomeNameInput, els.portraitInMatchAwayNameInput, els.homeName, els.awayName].forEach((input) => {
    input?.addEventListener("focus", selectExistingText);
    input?.addEventListener("click", selectExistingText);
  });
  bindDialogBackdropClose();
  addSafeListener("createLiveBtn", "click", createLiveGame);
  addSafeListener("copyLinkBtn", "click", copyViewerLink);
  els.nativeShareBtn?.addEventListener("click", shareViewerLink);
  els.showQrBtn?.addEventListener("click", toggleQrCard);
  els.posterBtn?.addEventListener("click", () => openPoster(false));
  els.shareRecapBtn?.addEventListener("click", shareRecap);
  els.resultsCloseBtn?.addEventListener("click", () => els.recapDialog?.close?.());
  els.recapDialog?.addEventListener("close", () => {
    activeResultsMatch = null;
    activeResultsGraphic = null;
    activeResultsGraphicPromise = null;
    setResultsActionState(false);
  });
  els.sharePosterBtn?.addEventListener("click", sharePoster);
  els.downloadPosterBtn?.addEventListener("click", downloadPoster);
  els.saveTeamsBtn?.addEventListener("click", saveTeamProfiles);
  els.loadTeamsBtn?.addEventListener("click", loadTeamProfiles);
  els.liveStartWatchBtn?.addEventListener("click", startViewerWatch);
  els.chatNameSaveBtn?.addEventListener("click", saveChatNameFromPrompt);
  els.chatNameInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveChatNameFromPrompt();
    }
  });
  els.openScoreboardBtn?.addEventListener("click", openMatchSetupPage);
  els.homeTeamSetupBtn?.addEventListener("click", openHomeTeamDialog);
  els.saveHomeTeamBtn?.addEventListener("click", saveHomeTeam);
  els.homeTeamLogoInput?.addEventListener("change", handleHomeTeamLogoUpload);
  els.homeTeamNameInput?.addEventListener("input", () => {
    homeTeamDraft.name = els.homeTeamNameInput.value.trim();
    updateHomeTeamLogoPreview();
  });
  els.homeTeamColorHex?.addEventListener("change", () => setHomeTeamDraftColor(els.homeTeamColorHex.value));
  bindColorDrag(els.homeTeamColorField, (event) => setColorFromFieldPoint(event.clientX, event.clientY));
  bindColorDrag(els.homeTeamHueTrack, (event) => setHueFromPoint(event.clientX));
  els.homeSettingsBtn?.addEventListener("click", () => openSettingsPage("main"));
  els.upgradeProBtn?.addEventListener("click", toggleProDemo);
  els.settingsUpgradeBtn?.addEventListener("click", toggleProDemo);
  els.themesShortcutBtn?.addEventListener("click", () => openSettingsPage("themes"));
  els.settingsBackBtn?.addEventListener("click", closeSettingsPage);
  els.settingsThemesBtn?.addEventListener("click", () => openSettingsPage("themes"));
  els.settingsGraphicsBtn?.addEventListener("click", () => openSettingsPage("graphics"));
  els.settingsThemesBackBtn?.addEventListener("click", () => openSettingsPage("main"));
  els.settingsGraphicsBackBtn?.addEventListener("click", () => openSettingsPage("main"));
  els.matchHistoryMoreBtn?.addEventListener("click", openMatchHistoryMore);
  els.matchHistoryBackBtn?.addEventListener("click", showHomeScreen);
  els.matchHistoryList?.addEventListener("click", handleMatchResultCardClick);
  els.fullMatchHistoryList?.addEventListener("click", handleMatchResultCardClick);
  els.themeGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-choice]");
    if (button) setPremiumTheme(button.dataset.themeChoice);
  });
  els.backgroundGraphicsGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-background-choice]");
    if (button) setResultBackground(button.dataset.backgroundChoice);
  });
  els.posterStyleSelect?.addEventListener("change", () => setPosterStyle(els.posterStyleSelect.value));
  els.cloudBackupToggle?.addEventListener("change", () => {
    if (!hasProAccess()) {
      els.cloudBackupToggle.checked = false;
      premium.cloudBackup = false;
      savePremiumSettings(false);
      toast("Cloud backup is a Pro feature", true);
      focusProFromSettings();
      return;
    }
    premium.cloudBackup = els.cloudBackupToggle.checked;
    savePremiumSettings(true);
    toast(premium.cloudBackup ? "Cloud backup enabled" : "Cloud backup paused");
  });
  els.backupNowBtn?.addEventListener("click", backupNow);
  els.emailSignInBtn?.addEventListener("click", () => emailSignIn(false));
  els.emailCreateBtn?.addEventListener("click", () => emailSignIn(true));
  els.googleSignInBtn?.addEventListener("click", () => providerSignIn("google"));
  els.appleSignInBtn?.addEventListener("click", () => providerSignIn("apple"));
  els.signOutBtn?.addEventListener("click", doSignOut);
  els.chatForm?.addEventListener("submit", sendChatMessage);
  els.fanZoneToggle?.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("fan-zone-open");
    els.fanZoneToggle?.setAttribute("aria-expanded", String(isOpen));
  });
  els.reactionRow?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-reaction]");
    if (button) sendReaction(button.dataset.reaction);
  });
  els.savedTeamsList?.addEventListener("click", wireHomeListClicks);
  els.favoriteTeamsList?.addEventListener("click", wireHomeListClicks);
  els.homeLogoInput?.addEventListener("change", () => handleLogo(els.homeLogoInput, els.homeLogo, els.homeLogoInput.closest(".logo-picker")));
  els.awayLogoInput?.addEventListener("change", () => handleLogo(els.awayLogoInput, els.awayLogo, els.awayLogoInput.closest(".logo-picker")));
  els.homeName?.addEventListener("change", () => updateNameFromInline("home"));
  els.awayName?.addEventListener("change", () => updateNameFromInline("away"));
  els.winnerOverlay?.addEventListener("click", closeWinner);
  els.winnerOverlay?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") closeWinner();
  });
  window.addEventListener("resize", () => {
    scheduleViewportUpdate();
    if (state.confettiRunning) startConfetti();
    updateRotateScreenState();
    fitHeaderTitle();
  });

  window.visualViewport?.addEventListener("resize", scheduleViewportUpdate);
  window.visualViewport?.addEventListener("scroll", scheduleViewportUpdate);

  window.addEventListener("orientationchange", () => {
    scheduleViewportUpdate();
    window.setTimeout(() => { scheduleViewportUpdate(); updateRotateScreenState(); fitHeaderTitle(); }, 160);
    window.setTimeout(() => { scheduleViewportUpdate(); updateRotateScreenState(); fitHeaderTitle(); }, 520);
  });

  window.addEventListener("pageshow", scheduleViewportUpdate);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) scheduleViewportUpdate();
  });
}

function applyViewerMode() {
  if (!isViewer) return;
  document.body.classList.add("viewer-mode", "scoreboard-active");
  const viewerAllowedIds = new Set([
    "liveStartWatchBtn",
    "chatInput",
    "sendChatBtn",
    "chatNameInput",
    "chatNameSaveBtn",
    "resultsCloseBtn",
    "shareRecapBtn"
  ]);
  document.querySelectorAll("button, input").forEach((el) => {
    if (viewerAllowedIds.has(el.id) || el.closest("#fanZone")) return;
    el.disabled = true;
  });
  closeMatchSetupPage();
  els.shareDialog?.close?.();
}

async function boot() {
  scheduleViewportUpdate();
  preventMobileDoubleTapZoom();

  let shouldShowViewerStart = false;
  try {
    loadPremiumSettings();
    applySplashImageFromStorage();
    applySavedHomeTeam();
    buildSwatches(els.homeSwatches, "home");
    buildSwatches(els.awaySwatches, "away");
    buildSwatches(els.inMatchHomeSwatches, "home");
    buildSwatches(els.inMatchAwaySwatches, "away");
    buildSwatches(els.portraitInMatchHomeSwatches, "home");
    buildSwatches(els.portraitInMatchAwaySwatches, "away");
    wireEvents();
    setTeamColor("home", state.homeColor, false);
    setTeamColor("away", state.awayColor, false);
    applyMatchFormat(state.matchFormat);
    render();
    await renderHomeData();

    if (initFirebase()) {
      setConnectionStatus(liveGameId ? "connecting" : "offline", liveGameId ? "Connecting" : "Offline");
      if (liveGameId) await startLiveListener();
      if (isViewer) loadViewerChatName();
    } else {
      setConnectionStatus("offline", "Offline");
    }
    applyViewerMode();
    if (!isViewer && liveGameId) document.body.classList.add("scoreboard-active");
    scheduleViewportUpdate();
    updateRotateScreenState();
    registerServiceWorker();
    shouldShowViewerStart = isViewer;
  } catch (error) {
    console.error("ScoreFlow boot failed", error);
    try {
      setConnectionStatus("offline", "Offline");
    } catch {}
  } finally {
    window.setTimeout(() => {
      scheduleViewportUpdate();
      hideSplash();
      if (shouldShowViewerStart) requestAnimationFrame(showLiveStartOverlay);
      else requestAnimationFrame(showHomeScreen);
    }, 900);
  }
}

boot();

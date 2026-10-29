import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CHAT_COOLDOWN_MS,
  CHAT_NAME_MAX,
  CHAT_TEXT_MAX,
  REACTION_COOLDOWN_MS,
  REACTION_EMOJIS,
  isFreshFanEvent,
  listenChat,
  loadViewerChatName,
  saveViewerChatName,
  sendChatMessage,
  sendReaction,
  viewerSessionId,
  type ChatMessage
} from "../live";
import { loadEarlierChat, mergeChatMessages, chatWindowHasGap, CHAT_LISTEN_LIMIT } from "../live/fanZone";
import { playText } from "../scoring/plays";
import type { HighlightCall } from "../scoring";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Field, TextInput } from "./Field";
import { FloatingReactions, spawnFloatingReaction } from "./FloatingReactions";
import styles from "./FanZone.module.css";

type FanZoneProps = {
  gameId: string;
  plays?: HighlightCall[];
  chatPaused: boolean;
  ended: boolean;
  askName?: boolean;
  role?: "viewer" | "scorer";
  onToggleChat?: () => void;
};

type Toast = ChatMessage & { leaving?: boolean; play?: boolean };

export function FanZone({
  gameId,
  plays,
  chatPaused,
  ended,
  askName = false,
  role = "viewer",
  onToggleChat
}: FanZoneProps) {
  const sessionId = useRef(viewerSessionId()).current;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState(() => loadViewerChatName(gameId, sessionId));
  const [nameDraft, setNameDraft] = useState(name);
  const [nameOpen, setNameOpen] = useState(false);
  const [hint, setHint] = useState("");
  const askedEntry = useRef(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const chatCool = useRef(0);
  const reactionCool = useRef(0);
  const seenChat = useRef(new Set<string>());
  const seenPlays = useRef<Set<string> | null>(null);
  const [tab, setTab] = useState<"chat" | "plays">("chat");
  const [unread, setUnread] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const timers = useRef(new Set<number>());
  const generation = useRef(0);
  const atBottom = useRef(true);
  const scrollAnchor = useRef<number | null>(null);

  function showToast(message: Toast) {
    setToasts((current) => [...current.slice(-3), message]);
    for (const [delay, leave] of [[2800, true], [3600, false]] as const) {
      const timer = window.setTimeout(() => {
        timers.current.delete(timer);
        setToasts((current) => leave ? current.map((m) => m.id === message.id ? { ...m, leaving: true } : m) : current.filter((m) => m.id !== message.id));
      }, delay);
      timers.current.add(timer);
    }
  }

  useEffect(() => {
    if (role === "scorer") return;
    askedEntry.current = false;
    const existing = loadViewerChatName(gameId, sessionId);
    setName(existing);
    setNameDraft(existing);
  }, [gameId, sessionId, role]);

  useEffect(() => {
    if (role === "scorer" || !askName || askedEntry.current) return;
    askedEntry.current = true;
    const existing = loadViewerChatName(gameId, sessionId);
    if (existing) {
      setName(existing);
      return;
    }
    setNameDraft("");
    setNameOpen(true);
  }, [askName, gameId, sessionId, role]);

  useEffect(() => {
    if (ended) setNameOpen(false);
  }, [ended]);

  useEffect(() => {
    const token = ++generation.current;
    seenChat.current.clear();
    seenPlays.current = null;
    setMessages([]); setToasts([]); setTab("chat"); setUnread(false); setLoadingOlder(false);
    setHasOlder(false); atBottom.current = true;
    let initial = true;
    let previousWindow: ChatMessage[] = [];
    const stop = gameId ? listenChat(gameId, (incoming) => {
      if (generation.current !== token) return;
      if (initial && incoming.length) { setHasOlder(incoming.length === CHAT_LISTEN_LIMIT); initial = false; }
      // A reconnect can skip more than a subscription window. Restart from a
      // contiguous latest page so Earlier messages can fill the entire gap.
      if (chatWindowHasGap(previousWindow, incoming)) {
        setMessages(incoming); setHasOlder(true); atBottom.current = true;
      } else setMessages((current) => mergeChatMessages(current, incoming));
      if (incoming.length) previousWindow = incoming;
    }, (message) => {
      if (generation.current !== token || seenChat.current.has(message.id)) return;
      seenChat.current.add(message.id);
      if (isFreshFanEvent(message.createdAtMs)) showToast(message);
    }) : undefined;
    return () => {
      generation.current++;
      stop?.();
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current.clear();
    };
  }, [gameId]);

  useEffect(() => {
    if (!plays) return; // Wait for the first real game snapshot, then seed without replaying history.
    if (!seenPlays.current) { seenPlays.current = new Set(plays.map((p) => p.id)); return; }
    const currentIds = new Set(plays.map((p) => p.id));
    if (!currentIds.size) setUnread(false);
    setToasts((current) => current.filter((m) => !m.play || currentIds.has(m.id)));
    for (const play of plays) {
      if (seenPlays.current.has(play.id)) continue;
      seenPlays.current.add(play.id);
      if (tab !== "plays") setUnread(true);
      if (isFreshFanEvent(play.atMs)) showToast({ id: play.id, text: playText(play), name: "Play by Play", role: "scorer", sessionId: "", uid: "", createdAtMs: play.atMs, play: true });
    }
  }, [plays]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    if (scrollAnchor.current !== null) {
      feed.scrollTop += feed.scrollHeight - scrollAnchor.current;
      scrollAnchor.current = null;
    } else if (atBottom.current) feed.scrollTop = feed.scrollHeight;
  }, [messages, plays, tab]);

  async function earlier() {
    if (loadingOlder || !messages[0]) return;
    const token = generation.current;
    setLoadingOlder(true);
    try {
      const older = await loadEarlierChat(gameId, messages[0]);
      if (generation.current !== token) return;
      scrollAnchor.current = feedRef.current?.scrollHeight ?? null;
      setMessages((current) => mergeChatMessages(current, older));
      setHasOlder(older.length === CHAT_LISTEN_LIMIT);
    } catch { if (generation.current === token) setHint("Earlier messages could not load. Try again."); }
    finally { if (generation.current === token) setLoadingOlder(false); }
  }

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    if (ended) return;
    if (!gameId) {
      setHint("Share Live to open chat");
      return;
    }
    if (chatPaused) {
      setHint("Scorer paused chat");
      return;
    }
    const text = draft.trim();
    if (!text) return;
    const chatName = role === "scorer" ? "Scorer" : name || loadViewerChatName(gameId, sessionId);
    if (role !== "scorer" && !chatName) {
      setNameDraft("");
      setNameOpen(true);
      return;
    }
    if (Date.now() < chatCool.current) {
      setHint("Give chat a second");
      return;
    }
    chatCool.current = Date.now() + CHAT_COOLDOWN_MS;
    setDraft("");
    setHint("");
    try {
      await sendChatMessage({
        gameId,
        text,
        name: chatName,
        role,
        sessionId: role === "scorer" ? "scorer" : sessionId
      });
    } catch {
      chatCool.current = 0;
      setHint("Chat failed to send");
    }
  }

  async function react(emoji: string) {
    if (ended || !gameId) return;
    spawnFloatingReaction(emoji);
    if (Date.now() < reactionCool.current) return;
    reactionCool.current = Date.now() + REACTION_COOLDOWN_MS;
    try {
      await sendReaction(gameId, emoji);
    } catch {
      reactionCool.current = 0;
    }
  }

  function saveName() {
    const next = saveViewerChatName(gameId, nameDraft, sessionId);
    if (!next) {
      setHint("Enter a chat name first");
      return;
    }
    setName(next);
    setNameOpen(false);
    setHint("");
  }

  const locked = ended || chatPaused || !gameId;
  const empty = tab === "chat" ? messages.length === 0 : !plays?.length;
  const copy = !gameId
    ? "Share Live to open chat with families"
    : chatPaused
      ? "Chat is paused by the scorer"
      : "Cheer live with chat and reactions";

  return (
    <section className={`${styles.fanZone} ${role === "scorer" ? styles.scorer : ""}`} aria-label="Live fan zone">
      <div className={styles.dock}>
        <div className={styles.head}>
          <div>
            <strong>Fan Zone</strong>
            <span>{copy}</span>
          </div>
          {onToggleChat ? (
            <button className={styles.chatToggle} type="button" onClick={onToggleChat}>
              {chatPaused ? "Chat Off" : "Chat On"}
            </button>
          ) : (
            <span className={styles.livePill}>{gameId && !ended ? "Live" : "Off"}</span>
          )}
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Match conversation" onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
          e.preventDefault();
          const next = e.key === "Home" ? "chat" : e.key === "End" ? "plays" : tab === "chat" ? "plays" : "chat";
          setTab(next); if (next === "plays") setUnread(false); atBottom.current = true;
          document.getElementById(next === "chat" ? "chat-tab" : "plays-tab")?.focus();
        }}>
          <button type="button" role="tab" id="chat-tab" tabIndex={tab === "chat" ? 0 : -1} aria-controls="fan-feed" aria-selected={tab === "chat"} onClick={() => { setTab("chat"); atBottom.current = true; }}>Chat</button>
          <button type="button" role="tab" id="plays-tab" tabIndex={tab === "plays" ? 0 : -1} aria-controls="fan-feed" aria-selected={tab === "plays"} onClick={() => { setTab("plays"); setUnread(false); atBottom.current = true; }}>Play by Play{unread ? " •" : ""}</button>
        </div>
        <div className={styles.feed} id="fan-feed" role="tabpanel" aria-labelledby={tab === "chat" ? "chat-tab" : "plays-tab"} ref={feedRef} aria-live="polite" onScroll={() => {
          const feed = feedRef.current;
          if (feed) atBottom.current = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 40;
        }}>
          {tab === "chat" && hasOlder ? <button type="button" className={styles.earlier} disabled={loadingOlder} onClick={() => void earlier()}>{loadingOlder ? "Loading…" : "Earlier messages"}</button> : null}
          {empty ? <p className={styles.empty}>{tab === "chat" ? "Be the first fan to cheer!" : "Player highlights will appear here."}</p> : null}
          {tab === "chat" ? messages.map((message) => (
            <article
              key={message.id}
              className={`${styles.message} ${message.role === "scorer" ? styles.scorer : ""} ${message.sessionId === sessionId ? styles.own : ""}`}
            >
              <strong>{message.name}</strong>
              <span>{message.text}</span>
            </article>
          )) : plays?.map((play) => <article key={play.id} className={`${styles.message} ${styles.scorer}`} data-testid="play-event">
            <strong>{playText(play)}</strong>
            {play.score ? <span>Set {play.score.set} · {play.score.home}–{play.score.away}</span> : null}
          </article>)}
        </div>
      </div>
      <div className={styles.reactions} aria-label="Send a reaction">
        {REACTION_EMOJIS.map((emoji) => (
          <button key={emoji} type="button" onClick={() => void react(emoji)} aria-label={`React with ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>
      <form className={`${styles.form} ${tab === "plays" ? styles.hiddenForm : ""}`} onSubmit={(event) => void submitChat(event)}>
        <input
          value={draft}
          maxLength={CHAT_TEXT_MAX}
          autoComplete="off"
          disabled={locked}
          placeholder={!gameId ? "Share Live to chat" : chatPaused ? "Chat is paused" : ended ? "Match has ended" : "Cheer on your team..."}
          aria-label="Chat message"
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button className={styles.send} type="submit" disabled={locked}>Send</Button>
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </form>
      <div className={styles.toasts} aria-live="polite">
        {toasts.map((message) => (
          <article
            key={message.id}
            data-testid="fan-popup"
            className={`${styles.toast} ${message.role === "scorer" ? styles.scorer : ""} ${message.leaving ? styles.toastLeaving : ""}`}
          >
            <strong>{message.play ? "Play:" : message.role === "scorer" ? "Scorer:" : `${message.name}:`}</strong>
            {" "}
            <span>{message.text}</span>
          </article>
        ))}
      </div>
      {gameId ? <FloatingReactions gameId={gameId} /> : null}
      {role === "viewer" ? (
      <Dialog
        open={nameOpen}
        eyebrow="Fan Zone"
        title="What name should show in chat?"
        copy="Pick a name for this device only. Other viewers can choose their own."
        confirmLabel="Start Chatting"
        variant="fan"
        hideCancel
        onConfirm={saveName}
        onCancel={() => setNameOpen(false)}
      >
        <Field label="Chat name">
          <TextInput
            value={nameDraft}
            maxLength={CHAT_NAME_MAX}
            autoComplete="name"
            placeholder="Your name"
            onChange={(event) => setNameDraft(event.target.value)}
          />
        </Field>
      </Dialog>
      ) : null}
    </section>
  );
}

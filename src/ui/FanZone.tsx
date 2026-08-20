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
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Field, TextInput } from "./Field";
import { FloatingReactions } from "./FloatingReactions";
import styles from "./FanZone.module.css";

type FanZoneProps = {
  gameId: string;
  chatPaused: boolean;
  ended: boolean;
};

export function FanZone({ gameId, chatPaused, ended }: FanZoneProps) {
  const sessionId = useRef(viewerSessionId()).current;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState(() => loadViewerChatName(gameId, sessionId));
  const [nameDraft, setNameDraft] = useState(name);
  const [nameOpen, setNameOpen] = useState(false);
  const [hint, setHint] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);
  const chatCool = useRef(0);
  const reactionCool = useRef(0);
  const seenChat = useRef(new Set<string>());

  useEffect(() => {
    setName(loadViewerChatName(gameId, sessionId));
  }, [gameId, sessionId]);

  useEffect(() => {
    seenChat.current.clear();
    setMessages([]);
    setToasts([]);
    return listenChat(gameId, setMessages, (message) => {
      if (seenChat.current.has(message.id)) return;
      seenChat.current.add(message.id);
      if (!isFreshFanEvent(message.createdAtMs)) return;
      setToasts((current) => [...current.slice(-3), message]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== message.id));
      }, 3600);
    });
  }, [gameId]);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [messages]);

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    if (ended) return;
    if (chatPaused) {
      setHint("Scorer paused chat");
      return;
    }
    const text = draft.trim();
    if (!text) return;
    const chatName = name || loadViewerChatName(gameId, sessionId);
    if (!chatName) {
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
        role: "viewer",
        sessionId
      });
    } catch {
      chatCool.current = 0;
      setHint("Chat failed to send");
    }
  }

  async function react(emoji: string) {
    if (ended) return;
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
    if (!next) return;
    setName(next);
    setNameOpen(false);
  }

  const locked = ended || chatPaused;
  const empty = messages.length === 0;

  return (
    <section className={`${styles.fanZone} ${open ? styles.open : ""}`} aria-label="Live fan zone">
      <button
        className={styles.toggle}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Chat
      </button>
      <div className={styles.dock}>
        <div className={styles.head}>
          <div>
            <strong>Fan Zone</strong>
            <span>{chatPaused ? "Chat is paused by the scorer" : "Cheer live with chat and reactions"}</span>
          </div>
          <span className={styles.livePill}>Live</span>
        </div>
        <div className={styles.feed} ref={feedRef} aria-live="polite">
          {empty ? <p className={styles.empty}>Be the first fan to cheer!</p> : null}
          {messages.map((message) => (
            <article
              key={message.id}
              className={`${styles.message} ${message.role === "scorer" ? styles.scorer : ""} ${message.sessionId === sessionId ? styles.own : ""}`}
            >
              <strong>{message.name}</strong>
              <span>{message.text}</span>
            </article>
          ))}
        </div>
      </div>
      <div className={styles.reactions} aria-label="Send a reaction">
        {REACTION_EMOJIS.map((emoji) => (
          <button key={emoji} type="button" onClick={() => void react(emoji)} aria-label={`React with ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>
      <form className={styles.form} onSubmit={(event) => void submitChat(event)}>
        <input
          value={draft}
          maxLength={CHAT_TEXT_MAX}
          autoComplete="off"
          disabled={locked}
          placeholder={chatPaused ? "Chat is paused" : ended ? "Match has ended" : "Cheer on your team..."}
          aria-label="Chat message"
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" disabled={locked}>Send</Button>
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </form>
      <div className={styles.toasts} aria-live="polite">
        {toasts.map((message) => (
          <article
            key={message.id}
            className={`${styles.toast} ${message.role === "scorer" ? styles.scorer : ""}`}
          >
            <strong>{message.role === "scorer" ? "Scorer:" : `${message.name}:`}</strong>
            {" "}
            <span>{message.text}</span>
          </article>
        ))}
      </div>
      <FloatingReactions gameId={gameId} />
      <Dialog
        open={nameOpen}
        title="What name should show in chat?"
        copy="Pick a name for this device only. Other viewers can choose their own."
        confirmLabel="Start Chatting"
        confirmTone="gold"
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
    </section>
  );
}

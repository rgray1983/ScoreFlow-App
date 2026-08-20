import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  isFreshFanEvent,
  listenReactions,
  type ReactionEvent
} from "../live";
import styles from "./FanZone.module.css";

type Bubble = {
  id: string;
  emoji: string;
  left: string;
  drift: string;
};

export type FloatingReactionsHandle = {
  spawn: (emoji: string) => void;
};

function makeBubble(emoji: string, id?: string): Bubble {
  return {
    id: id ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    emoji,
    left: `${18 + Math.random() * 64}%`,
    drift: `${(Math.random() - 0.5) * 90}px`
  };
}

export const FloatingReactions = forwardRef<FloatingReactionsHandle, { gameId: string }>(
  function FloatingReactions({ gameId }, ref) {
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const seen = useRef(new Set<string>());

    function addBubble(bubble: Bubble) {
      setBubbles((current) => [...current.slice(-24), bubble]);
      window.setTimeout(() => {
        setBubbles((current) => current.filter((item) => item.id !== bubble.id));
      }, 5200);
    }

    useImperativeHandle(ref, () => ({
      spawn(emoji: string) {
        if (!emoji) return;
        addBubble(makeBubble(emoji));
      }
    }));

    useEffect(() => {
      seen.current.clear();
      setBubbles([]);
      return listenReactions(gameId, (reaction: ReactionEvent) => {
        if (seen.current.has(reaction.id)) return;
        seen.current.add(reaction.id);
        if (!isFreshFanEvent(reaction.createdAtMs)) return;
        addBubble(makeBubble(reaction.emoji, reaction.id));
      });
    }, [gameId]);

    if (typeof document === "undefined") return null;

    return createPortal(
      <div className={styles.floats} aria-hidden="true">
        {bubbles.map((bubble) => (
          <span
            key={bubble.id}
            className={styles.float}
            style={{ left: bubble.left, ["--drift" as string]: bubble.drift }}
          >
            {bubble.emoji}
          </span>
        ))}
      </div>,
      document.body
    );
  }
);

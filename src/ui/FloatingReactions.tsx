import { useEffect, useRef, useState } from "react";
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

export function FloatingReactions({ gameId }: { gameId: string }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    seen.current.clear();
    setBubbles([]);
    return listenReactions(gameId, (reaction: ReactionEvent) => {
      if (seen.current.has(reaction.id)) return;
      seen.current.add(reaction.id);
      if (!isFreshFanEvent(reaction.createdAtMs)) return;
      const bubble: Bubble = {
        id: reaction.id,
        emoji: reaction.emoji,
        left: `${18 + Math.random() * 64}%`,
        drift: `${(Math.random() - 0.5) * 90}px`
      };
      setBubbles((current) => [...current.slice(-24), bubble]);
      window.setTimeout(() => {
        setBubbles((current) => current.filter((item) => item.id !== bubble.id));
      }, 5200);
    });
  }, [gameId]);

  return (
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
    </div>
  );
}

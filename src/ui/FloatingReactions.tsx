import { useEffect } from "react";
import {
  isFreshFanEvent,
  listenReactions,
  type ReactionEvent
} from "../live";

const LAYER_CLASS = "scoreflow-floating-reactions";
const BUBBLE_CLASS = "scoreflow-floating-reaction";

function reactionLayer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const existing = document.querySelector<HTMLElement>(`.${LAYER_CLASS}`);
  if (existing) return existing;
  const layer = document.createElement("div");
  layer.className = LAYER_CLASS;
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  return layer;
}

export function spawnFloatingReaction(emoji: string) {
  const layer = reactionLayer();
  if (!layer || !emoji) return;

  const bubble = document.createElement("div");
  bubble.className = BUBBLE_CLASS;
  bubble.textContent = emoji;
  bubble.style.left = `${18 + Math.random() * 64}%`;
  const drift = `${(Math.random() - 0.5) * 90}px`;
  bubble.style.setProperty("--drift", drift);
  layer.appendChild(bubble);

  const finish = () => {
    bubble.remove();
  };

  if (typeof bubble.animate === "function") {
    const animation = bubble.animate(
      [
        { transform: "translate(0px, 0px)", opacity: 1 },
        { transform: `translate(${drift}, -72vh)`, opacity: 0 }
      ],
      { duration: 5200, easing: "ease-out", fill: "forwards" }
    );
    animation.finished.then(finish).catch(finish);
  } else {
    bubble.style.animation = "scoreflowFloatUp 5.2s ease-out forwards";
  }

  window.setTimeout(finish, 5200);
}

export function FloatingReactions({ gameId }: { gameId: string }) {
  useEffect(() => {
    const seen = new Set<string>();
    return listenReactions(gameId, (reaction: ReactionEvent) => {
      if (seen.has(reaction.id)) return;
      seen.add(reaction.id);
      if (!isFreshFanEvent(reaction.createdAtMs)) return;
      spawnFloatingReaction(reaction.emoji);
    });
  }, [gameId]);

  return null;
}

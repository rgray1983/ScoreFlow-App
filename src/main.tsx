import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createMatch, point } from "./scoring";

const demo = point(createMatch(), "home");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main>
      <h1>ScoreFlow rebuild</h1>
      <p>Phase 1 scoring kernel is running. Match UI arrives in Phase 2.</p>
      <p>
        Kernel check: {demo.match.homeName} {demo.match.homeScore}–{demo.match.awayScore} {demo.match.awayName}
      </p>
      <p>
        Current gym app stays at <code>http://localhost:4173</code>
      </p>
    </main>
  </StrictMode>
);

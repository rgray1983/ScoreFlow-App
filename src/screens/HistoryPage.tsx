import { useEffect, useState } from "react";
import { InnerScreen } from "./InnerScreen";
import { MatchHistoryCard } from "../ui/MatchHistoryCard";
import { ResultsSheet } from "../ui/ResultsSheet";
import { useAccount } from "../state/account";
import { usePremium } from "../state/premium";
import { loadMatches, type HistoryMatch } from "../storage/matchHistory";
import styles from "./InnerScreen.module.css";
import historyStyles from "./HistoryPage.module.css";

export function HistoryPage() {
  const [matches, setMatches] = useState(() => loadMatches());
  const [recap, setRecap] = useState<HistoryMatch | null>(null);
  const historyRevision = useAccount((state) => state.historyRevision);
  const isPro = usePremium((state) => state.isPro);

  useEffect(() => {
    setMatches(loadMatches());
  }, [historyRevision, isPro]);

  return (
    <InnerScreen
      eyebrow="Match History"
      title="Your Matches. Your Flow."
      copy="Review your saved match results, quickly spot wins and losses, and keep your team history organized."
    >
      {matches.length ? (
        <div className={historyStyles.list}>
          {matches.map((match) => (
            <MatchHistoryCard key={match.id} match={match} onOpen={setRecap} />
          ))}
        </div>
      ) : (
        <section className={styles.card}>
          <p className={styles.note}>Completed matches will show up here.</p>
        </section>
      )}
      <ResultsSheet open={Boolean(recap)} match={recap} onClose={() => setRecap(null)} />
    </InnerScreen>
  );
}

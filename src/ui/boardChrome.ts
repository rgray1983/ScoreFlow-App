import type { MatchState, Side } from "../scoring";

export function fitFontSize(scrollWidth: number, clientWidth: number, startPx: number, minPx: number): number {
  if (clientWidth <= 0 || scrollWidth <= clientWidth) return startPx;
  const delta = Math.ceil(startPx * (1 - clientWidth / scrollWidth));
  return Math.max(minPx, startPx - Math.max(1, delta));
}

export type SetHistoryTickerItem = {
  key: string;
  setNumber: number;
  winnerName: string;
  winnerColor: string;
  winnerScore: number;
  loserScore: number;
  label: string;
  detail: string;
};

export function setHistoryTickerItems(match: MatchState): SetHistoryTickerItem[] {
  return match.completedSets
    .filter((set) => set.set > 0)
    .map((set) => {
      const winnerName = set.winner === "home" ? match.homeName : match.awayName;
      const winnerColor = set.winner === "home" ? match.homeColor : match.awayColor;
      const winnerScore = set.winner === "home" ? set.homeScore : set.awayScore;
      const loserScore = set.winner === "home" ? set.awayScore : set.homeScore;
      return {
        key: `${set.set}-${set.winner}-${winnerScore}-${loserScore}`,
        setNumber: set.set,
        winnerName,
        winnerColor,
        winnerScore,
        loserScore,
        label: `WINNER SET ${set.set}:`,
        detail: `${winnerName} - ${winnerScore}:${loserScore}`
      };
    });
}

export function setHistoryTickerCopy(items: SetHistoryTickerItem[]): string {
  return items.map((item) => `${item.label} ${item.detail}`).join("   •   ");
}

export function setWinnerColor(match: MatchState, set: { winner: Side }): string {
  return set.winner === "home" ? match.homeColor : match.awayColor;
}

export type BoardFx = {
  pointSide: Side | null;
  setWinnerSide: Side | null;
};

export function detectBoardFx(previous: MatchState, next: MatchState): BoardFx {
  if (next.completedSets.length > previous.completedSets.length) {
    const last = next.completedSets[next.completedSets.length - 1];
    return { pointSide: last.winner, setWinnerSide: last.winner };
  }
  if (next.homeScore > previous.homeScore) return { pointSide: "home", setWinnerSide: null };
  if (next.awayScore > previous.awayScore) return { pointSide: "away", setWinnerSide: null };
  return { pointSide: null, setWinnerSide: null };
}

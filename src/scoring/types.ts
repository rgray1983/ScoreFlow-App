import type { SoundEvent } from "../audio/events";
export type Side = "home" | "away";

export type MatchFormat = "club" | "highschool";

export type BoardTheme = "classic" | "old-school" | "flip-clock";
export type HighlightKind = "ace" | "kill" | "block";
export type HighlightCall = {
  id: string;
  kind: HighlightKind;
  side: Side;
  atMs: number;
  teamName?: string;
  player?: { id: string; name: string; number: string };
  score?: { set: number; home: number; away: number };
};

export type CompletedSet = {
  set: number;
  homeScore: number;
  awayScore: number;
  winner: Side;
};

export type MatchState = {
  homeScore: number;
  awayScore: number;
  homeSets: number;
  awaySets: number;
  setNumber: number;
  winBy: number;
  setsToWin: number;
  matchFormat: MatchFormat;
  matchSets: number;
  matchTitle: string;
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
  winner: Side | "";
  servingSide: Side | "";
  homeTimeouts: number;
  awayTimeouts: number;
  activeTimeout: Side | "";
  timeoutEndsAtMs: number;
  completedSets: readonly CompletedSet[];
  boardTheme: BoardTheme;
  runSide: Side | "";
  runLength: number;
  pendingSet: boolean;
  lastHighlight: HighlightCall | null;
  lastSound?: SoundEvent | null;
};

export type MatchEngine = {
  readonly match: MatchState;
  readonly history: readonly MatchState[];
};

export type FormatRules = {
  matchFormat: MatchFormat;
  matchSets: number;
  setsToWin: number;
  winBy: number;
};

export type Command =
  | { type: "point"; side: Side }
  | { type: "highlight"; call: HighlightCall }
  | { type: "continueSet" }
  | { type: "setBoardTheme"; theme: BoardTheme }
  | { type: "subtract"; side: Side }
  | { type: "undo" }
  | { type: "newMatch" }
  | { type: "applyFormat"; format: MatchFormat }
  | { type: "setNames"; home: string; away: string }
  | { type: "setColors"; home: string; away: string }
  | { type: "setTitle"; title: string }
  | { type: "setServe"; side: Side }
  | { type: "timeout"; side: Side; nowMs?: number }
  | { type: "endTimeout"; nowMs?: number };

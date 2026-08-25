export type Side = "home" | "away";

export type MatchFormat = "club" | "highschool";

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
  completedSets: readonly CompletedSet[];
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
  | { type: "subtract"; side: Side }
  | { type: "undo" }
  | { type: "newMatch" }
  | { type: "applyFormat"; format: MatchFormat }
  | { type: "setNames"; home: string; away: string }
  | { type: "setColors"; home: string; away: string }
  | { type: "setTitle"; title: string }
  | { type: "setServe"; side: Side };

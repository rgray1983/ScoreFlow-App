export {
  applyFormat,
  createMatch,
  DEFAULT_AWAY_COLOR,
  DEFAULT_HOME_COLOR,
  newMatch,
  point,
  reduce,
  setColors,
  setNames,
  setServe,
  setTitle,
  subtract,
  undo
} from "./reducer";

export {
  canUndo,
  FORMAT_RULES,
  hasWonSet,
  isMatchOver,
  isMatchPoint,
  isServing,
  isSetPoint,
  matchBanner,
  otherSide,
  pointsToWin,
  scoreOf,
  setsOf
} from "./queries";

export type {
  Command,
  CompletedSet,
  FormatRules,
  MatchEngine,
  MatchFormat,
  MatchState,
  Side
} from "./types";

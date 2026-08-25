export {
  applyFormat,
  callTimeout,
  createMatch,
  DEFAULT_AWAY_COLOR,
  DEFAULT_HOME_COLOR,
  endTimeout,
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
  formatTimeoutClock,
  hasWonSet,
  isMatchOver,
  isMatchPoint,
  isServing,
  isSetPoint,
  matchBanner,
  otherSide,
  pointsToWin,
  scoreOf,
  setsOf,
  TIMEOUT_MS,
  TIMEOUTS_PER_SET,
  timeoutRemainingMs,
  timeoutsOf
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

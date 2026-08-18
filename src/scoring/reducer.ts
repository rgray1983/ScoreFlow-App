import { FORMAT_RULES, hasWonSet, isMatchOver, scoreOf } from "./queries";
import type { Command, MatchEngine, MatchFormat, MatchState, Side } from "./types";

export const DEFAULT_HOME_COLOR = "#d62828";
export const DEFAULT_AWAY_COLOR = "#1565c0";

function formatFields(format: MatchFormat): Pick<MatchState, "matchFormat" | "matchSets" | "setsToWin" | "winBy"> {
  const rules = FORMAT_RULES[format];
  return {
    matchFormat: format,
    matchSets: rules.matchSets,
    setsToWin: rules.setsToWin,
    winBy: rules.winBy
  };
}

function cleanName(value: string, fallback: string): string {
  const next = value.trim();
  return next || fallback;
}

function cleanColor(value: string, fallback: string): string {
  const next = value.trim();
  return next || fallback;
}

export function createMatch(overrides: Partial<MatchState> = {}): MatchEngine {
  const format = overrides.matchFormat === "highschool" ? "highschool" : "club";
  const match: MatchState = {
    homeScore: 0,
    awayScore: 0,
    homeSets: 0,
    awaySets: 0,
    setNumber: 1,
    matchTitle: "Game Night",
    homeName: "Team 1",
    awayName: "Team 2",
    homeColor: DEFAULT_HOME_COLOR,
    awayColor: DEFAULT_AWAY_COLOR,
    winner: "",
    completedSets: [],
    ...overrides,
    ...formatFields(format)
  };

  return { match, history: [] };
}

function snapshot(engine: MatchEngine, nextMatch: MatchState): MatchEngine {
  return {
    match: nextMatch,
    history: [...engine.history, engine.match]
  };
}

function resetProgress(match: MatchState): MatchState {
  return {
    ...match,
    homeScore: 0,
    awayScore: 0,
    homeSets: 0,
    awaySets: 0,
    setNumber: 1,
    winner: "",
    completedSets: []
  };
}

function applyPoint(match: MatchState, side: Side): MatchState {
  if (isMatchOver(match)) return match;

  const scored: MatchState = side === "home"
    ? { ...match, homeScore: match.homeScore + 1 }
    : { ...match, awayScore: match.awayScore + 1 };

  if (!hasWonSet(scored, side)) return scored;

  const completedSets = [
    ...match.completedSets,
    {
      set: scored.setNumber,
      homeScore: scored.homeScore,
      awayScore: scored.awayScore,
      winner: side
    }
  ];

  const homeSets = scored.homeSets + (side === "home" ? 1 : 0);
  const awaySets = scored.awaySets + (side === "away" ? 1 : 0);
  const wonMatch = (side === "home" ? homeSets : awaySets) >= scored.setsToWin;

  if (wonMatch) {
    return {
      ...scored,
      homeSets,
      awaySets,
      winner: side,
      completedSets
    };
  }

  return {
    ...scored,
    homeSets,
    awaySets,
    homeScore: 0,
    awayScore: 0,
    setNumber: scored.setNumber + 1,
    winner: "",
    completedSets
  };
}

function applySubtract(match: MatchState, side: Side): MatchState {
  if (isMatchOver(match)) return match;
  const current = scoreOf(match, side);
  if (current <= 0) return match;
  return side === "home"
    ? { ...match, homeScore: current - 1 }
    : { ...match, awayScore: current - 1 };
}

export function reduce(engine: MatchEngine, command: Command): MatchEngine {
  switch (command.type) {
    case "point": {
      if (isMatchOver(engine.match)) return engine;
      return snapshot(engine, applyPoint(engine.match, command.side));
    }
    case "subtract": {
      if (isMatchOver(engine.match) || scoreOf(engine.match, command.side) <= 0) return engine;
      return snapshot(engine, applySubtract(engine.match, command.side));
    }
    case "undo": {
      if (engine.history.length === 0) return engine;
      const previous = engine.history[engine.history.length - 1];
      return {
        match: previous,
        history: engine.history.slice(0, -1)
      };
    }
    case "newMatch": {
      return {
        match: resetProgress(engine.match),
        history: []
      };
    }
    case "applyFormat": {
      const next = {
        ...resetProgress(engine.match),
        ...formatFields(command.format)
      };
      return { match: next, history: [] };
    }
    case "setNames": {
      return {
        ...engine,
        match: {
          ...engine.match,
          homeName: cleanName(command.home, "Team 1"),
          awayName: cleanName(command.away, "Team 2")
        }
      };
    }
    case "setColors": {
      return {
        ...engine,
        match: {
          ...engine.match,
          homeColor: cleanColor(command.home, DEFAULT_HOME_COLOR),
          awayColor: cleanColor(command.away, DEFAULT_AWAY_COLOR)
        }
      };
    }
    case "setTitle": {
      return {
        ...engine,
        match: {
          ...engine.match,
          matchTitle: cleanName(command.title, "Game Night")
        }
      };
    }
  }
}

export function point(engine: MatchEngine, side: Side): MatchEngine {
  return reduce(engine, { type: "point", side });
}

export function subtract(engine: MatchEngine, side: Side): MatchEngine {
  return reduce(engine, { type: "subtract", side });
}

export function undo(engine: MatchEngine): MatchEngine {
  return reduce(engine, { type: "undo" });
}

export function newMatch(engine: MatchEngine): MatchEngine {
  return reduce(engine, { type: "newMatch" });
}

export function applyFormat(engine: MatchEngine, format: MatchFormat): MatchEngine {
  return reduce(engine, { type: "applyFormat", format });
}

export function setNames(engine: MatchEngine, home: string, away: string): MatchEngine {
  return reduce(engine, { type: "setNames", home, away });
}

export function setColors(engine: MatchEngine, home: string, away: string): MatchEngine {
  return reduce(engine, { type: "setColors", home, away });
}

export function setTitle(engine: MatchEngine, title: string): MatchEngine {
  return reduce(engine, { type: "setTitle", title });
}

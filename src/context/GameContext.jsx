/**
 * GameContext.jsx
 *
 * The single source of truth for the whole game.
 *
 * Everything the player has done lives in one state object here, and every
 * component reads it through the useGame() hook instead of passing props
 * down through the 3D scene. State only ever changes through dispatch(),
 * so there is exactly one place to look when you want to know how a value
 * got its number: the reducer below.
 *
 * Progress is saved to localStorage automatically whenever the state changes,
 * so closing the tab and coming back keeps your scores. No backend involved.
 */

import { createContext, useContext, useReducer, useEffect } from "react";
import { getLevel, TOTAL_LEVELS } from "../data/levels";
import { getScenariosForLevel } from "../data/scenarios";

const STORAGE_KEY = "financial-maze-3d:save:v1";

/**
 * The screens the game can be on. `phase` decides which UI overlay renders,
 * and whether the player is allowed to move in the maze.
 */
export const PHASES = {
  START: "start",           // title screen
  PLAYING: "playing",       // walking around the maze
  SCENARIO: "scenario",     // a decision popup is open (movement frozen)
  FEEDBACK: "feedback",     // showing why that choice was good or bad
  LEVEL_COMPLETE: "level_complete",
  GAME_COMPLETE: "game_complete",
};

/** A brand new game, used on first load and on "Play again". */
function createInitialState() {
  return {
    phase: PHASES.START,
    level: 1,
    // Running totals across the whole game.
    scores: { wealth: 0, security: 0, lifestyle: 0 },
    // Per-level totals, so the level-complete screen can grade just that level.
    levelScores: { wealth: 0, security: 0, lifestyle: 0 },
    balance: getLevel(1).startingBalance,
    // Full history: one entry per decision made, used by the final report.
    decisions: [],
    // Ids of scenarios already answered - a node only pops up once.
    completedScenarios: [],
    // The scenario currently on screen, and the option the player picked.
    activeScenario: null,
    lastChoice: null,
    highestLevelUnlocked: 1,
    muted: false,
  };
}

/**
 * Reads a saved game from localStorage.
 * Wrapped in try/catch because localStorage can be unavailable (private mode)
 * or hold data from an older version of the game.
 */
function loadState() {
  const fresh = createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const saved = JSON.parse(raw);
    return {
      ...fresh,
      ...saved,
      // Never restore straight into a popup - always land on a stable screen.
      phase: PHASES.START,
      activeScenario: null,
      lastChoice: null,
    };
  } catch {
    return fresh;
  }
}

function reducer(state, action) {
  switch (action.type) {
    /** Begin (or restart) a specific level. */
    case "START_LEVEL": {
      const level = action.level;
      const def = getLevel(level);
      return {
        ...state,
        phase: PHASES.PLAYING,
        level,
        levelScores: { wealth: 0, security: 0, lifestyle: 0 },
        // Level 1 sets the balance; later levels carry forward whatever you
        // have, but top up to that level's starting figure if you fell behind.
        balance: level === 1 ? def.startingBalance : Math.max(state.balance, def.startingBalance),
        activeScenario: null,
        lastChoice: null,
        highestLevelUnlocked: Math.max(state.highestLevelUnlocked, level),
      };
    }

    /** The player walked into a glowing decision node. */
    case "OPEN_SCENARIO": {
      if (state.completedScenarios.includes(action.scenario.id)) return state;
      return {
        ...state,
        phase: PHASES.SCENARIO,
        activeScenario: action.scenario,
      };
    }

    /**
     * The player picked an option. This is where scores and balance move.
     * We record the whole choice so the final report can replay the story.
     */
    case "CHOOSE_OPTION": {
      const { scenario, option } = action;
      const add = (a, b) => ({
        wealth: a.wealth + b.wealth,
        security: a.security + b.security,
        lifestyle: a.lifestyle + b.lifestyle,
      });
      return {
        ...state,
        phase: PHASES.FEEDBACK,
        scores: add(state.scores, option.impact),
        levelScores: add(state.levelScores, option.impact),
        // Never let the balance go negative. Some options (buying a flat you
        // cannot afford, for instance) cost more cash than you actually have -
        // in real life you simply could not do it. Draining the balance to
        // zero is the honest outcome, and the feedback card explains why that
        // choice was a bad idea.
        balance: Math.max(0, state.balance + option.money),
        completedScenarios: [...state.completedScenarios, scenario.id],
        decisions: [
          ...state.decisions,
          {
            scenarioId: scenario.id,
            level: scenario.level,
            title: scenario.title,
            chosenLabel: option.label,
            verdict: option.verdict,
            impact: option.impact,
            money: option.money,
            explanation: option.explanation,
          },
        ],
        lastChoice: { scenario, option },
      };
    }

    /** Feedback card dismissed - back to walking. */
    case "CLOSE_FEEDBACK":
      return { ...state, phase: PHASES.PLAYING, activeScenario: null, lastChoice: null };

    /** Player reached the exit with every node answered. */
    case "COMPLETE_LEVEL": {
      const isLastLevel = state.level >= TOTAL_LEVELS;
      return {
        ...state,
        phase: isLastLevel ? PHASES.GAME_COMPLETE : PHASES.LEVEL_COMPLETE,
        highestLevelUnlocked: Math.max(state.highestLevelUnlocked, Math.min(state.level + 1, TOTAL_LEVELS)),
      };
    }

    case "TOGGLE_MUTE":
      return { ...state, muted: !state.muted };

    case "GO_TO_START":
      return { ...state, phase: PHASES.START };

    /** Wipe the save and start over from level 1. */
    case "RESET_GAME":
      return createInitialState();

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  // Third argument runs loadState() lazily, only on the first render.
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Autosave. Runs after every state change; cheap because the object is small.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          level: state.level,
          scores: state.scores,
          levelScores: state.levelScores,
          balance: state.balance,
          decisions: state.decisions,
          completedScenarios: state.completedScenarios,
          highestLevelUnlocked: state.highestLevelUnlocked,
          muted: state.muted,
        })
      );
    } catch {
      // localStorage full or blocked - the game still works, it just will not resume.
    }
  }, [state]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

/** The hook every component uses to read state and dispatch actions. */
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside a <GameProvider>");
  return ctx;
}

/**
 * Helper: has the player answered every decision in the current level?
 * The exit stays locked until this is true.
 */
export function areAllNodesDone(state) {
  const scenarios = getScenariosForLevel(state.level);
  return scenarios.every((s) => state.completedScenarios.includes(s.id));
}

/**
 * App.jsx
 *
 * The top level of the game. It does four things:
 *   1. renders the 3D <Canvas> with the maze scene inside it
 *   2. renders the 2D UI overlay on top of that canvas
 *   3. decides WHICH overlay to show, based on state.phase from GameContext
 *   4. wires the sound effects to the events that should trigger them
 *
 * All the actual game rules live in context/GameContext.jsx, and all the
 * content lives in src/data/. This file is only plumbing.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";

import Scene from "./three/Scene";
import HUD from "./ui/HUD";
import ScenarioPopup from "./ui/ScenarioPopup";
import FeedbackCard from "./ui/FeedbackCard";
import LevelComplete from "./ui/LevelComplete";
import FinalReport from "./ui/FinalReport";
import FinancialGlossary from "./ui/FinancialGlossary";
import StartScreen from "./ui/StartScreen";
import Joystick from "./ui/Joystick";

import { useGame, PHASES, areAllNodesDone } from "./context/GameContext";
import { useControls } from "./hooks/useControls";
import { useSound } from "./hooks/useSound";
import { getLevel, LEVELS, TOTAL_LEVELS } from "./data/levels";
import { getScenariosForLevel, getMaxScoresForLevel } from "./data/scenarios";

/** True on phones and tablets - decides whether to show the touch joystick. */
const IS_TOUCH =
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

export default function App() {
  const { state, dispatch } = useGame();
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const level = getLevel(state.level);
  const scenarios = useMemo(() => getScenariosForLevel(state.level), [state.level]);
  const allNodesDone = areAllNodesDone(state);

  // The player can only walk around during the PLAYING phase - popups freeze it.
  const canMove = state.phase === PHASES.PLAYING && !glossaryOpen;

  const { getDirection, setJoystick } = useControls(canMove);
  const { sounds, unlock } = useSound(state.muted);

  /**
   * Browsers refuse to play audio until the user interacts with the page,
   * so we wait for the first click or key press and start the audio there.
   */
  useEffect(() => {
    function handleFirstInteraction() {
      unlock();
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    }
    window.addEventListener("pointerdown", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [unlock]);

  // --- Events coming up from the 3D scene ---------------------------------

  /** The player's sphere touched a decision node. */
  const handleEnterNode = useCallback(
    (node) => {
      const scenario = scenarios[node.scenarioIndex];
      if (!scenario) return;
      if (state.completedScenarios.includes(scenario.id)) return;
      sounds.node();
      dispatch({ type: "OPEN_SCENARIO", scenario });
    },
    [scenarios, state.completedScenarios, dispatch, sounds]
  );

  /** The player reached the exit portal. */
  const handleReachExit = useCallback(() => {
    if (!allNodesDone) return; // portal is still locked
    sounds.levelComplete();
    dispatch({ type: "COMPLETE_LEVEL" });
  }, [allNodesDone, dispatch, sounds]);

  /** The player picked an option in the decision popup. */
  const handleChoose = useCallback(
    (option) => {
      if (option.verdict === "good") sounds.coin();
      else if (option.verdict === "bad") sounds.warning();
      else sounds.neutral();
      dispatch({ type: "CHOOSE_OPTION", scenario: state.activeScenario, option });
    },
    [state.activeScenario, dispatch, sounds]
  );

  const handleStartLevel = useCallback(
    (levelId) => {
      sounds.click();
      dispatch({ type: "START_LEVEL", level: levelId });
    },
    [dispatch, sounds]
  );

  // Max scores so far: everything up to and including the current level, so
  // the HUD bars fill sensibly rather than against the whole game's total.
  const maxScores = useMemo(() => {
    return LEVELS.filter((l) => l.id <= state.level).reduce(
      (total, l) => {
        const m = getMaxScoresForLevel(l.id);
        return {
          wealth: total.wealth + m.wealth,
          security: total.security + m.security,
          lifestyle: total.lifestyle + m.lifestyle,
        };
      },
      { wealth: 0, security: 0, lifestyle: 0 }
    );
  }, [state.level]);

  const answeredInLevel = scenarios.filter((s) =>
    state.completedScenarios.includes(s.id)
  ).length;

  const showGame = state.phase !== PHASES.START;

  return (
    <div className="app">
      {/* ---------------- 3D layer ---------------- */}
      <Canvas
        className="canvas"
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 30, 24], fov: 50, near: 0.1, far: 400 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        {/* Suspense is required by React Three Fiber for anything that loads
            asynchronously; without it the canvas can throw on first render. */}
        <Suspense fallback={null}>
          <color attach="background" args={["#0a0620"]} />
          <Scene
            level={level}
            scenarios={scenarios}
            completedScenarios={state.completedScenarios}
            canMove={canMove}
            allNodesDone={allNodesDone}
            getDirection={getDirection}
            onEnterNode={handleEnterNode}
            onReachExit={handleReachExit}
          />
        </Suspense>
      </Canvas>

      {/* ---------------- 2D overlay layer ---------------- */}

      {showGame && (
        <HUD
          level={level}
          scores={state.scores}
          maxScores={maxScores}
          balance={state.balance}
          answered={answeredInLevel}
          total={scenarios.length}
        />
      )}

      {state.phase === PHASES.START && (
        <StartScreen
          highestLevelUnlocked={state.highestLevelUnlocked}
          hasSave={state.decisions.length > 0}
          onStart={handleStartLevel}
          onReset={() => {
            sounds.click();
            dispatch({ type: "RESET_GAME" });
          }}
        />
      )}

      {state.phase === PHASES.SCENARIO && state.activeScenario && (
        <ScenarioPopup
          scenario={state.activeScenario}
          levelName={level.name}
          onChoose={handleChoose}
        />
      )}

      {state.phase === PHASES.FEEDBACK && state.lastChoice && (
        <FeedbackCard
          scenario={state.lastChoice.scenario}
          option={state.lastChoice.option}
          onContinue={() => {
            sounds.click();
            dispatch({ type: "CLOSE_FEEDBACK" });
          }}
        />
      )}

      {state.phase === PHASES.LEVEL_COMPLETE && (
        <LevelComplete
          level={level}
          levelScores={state.levelScores}
          balance={state.balance}
          decisions={state.decisions}
          onNext={() => handleStartLevel(Math.min(state.level + 1, TOTAL_LEVELS))}
        />
      )}

      {state.phase === PHASES.GAME_COMPLETE && (
        <FinalReport
          scores={state.scores}
          balance={state.balance}
          decisions={state.decisions}
          onRestart={() => {
            sounds.click();
            dispatch({ type: "RESET_GAME" });
          }}
        />
      )}

      {/* Always-visible corner controls */}
      <button
        type="button"
        className="mute-toggle"
        onClick={() => dispatch({ type: "TOGGLE_MUTE" })}
        aria-label={state.muted ? "Unmute sound" : "Mute sound"}
        title={state.muted ? "Unmute" : "Mute"}
      >
        {state.muted ? "🔇" : "🔊"}
      </button>

      {showGame && (
        <button
          type="button"
          className="menu-toggle"
          onClick={() => dispatch({ type: "GO_TO_START" })}
          title="Back to menu"
        >
          ☰ Menu
        </button>
      )}

      <FinancialGlossary open={glossaryOpen} onToggle={() => setGlossaryOpen((o) => !o)} />

      {/* Touch joystick, only on phones and only while actually playing */}
      {IS_TOUCH && state.phase === PHASES.PLAYING && (
        <Joystick onMove={setJoystick} />
      )}

      {/* A short nudge on how to play, shown until the first node is answered */}
      {state.phase === PHASES.PLAYING && state.completedScenarios.length === 0 && (
        <div className="tutorial-hint">
          Use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrow keys · reach a glowing gold orb to make your first decision
        </div>
      )}
    </div>
  );
}

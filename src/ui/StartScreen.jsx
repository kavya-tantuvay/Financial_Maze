/**
 * StartScreen.jsx
 *
 * The title screen. Explains the three scores and the controls, then lets the
 * player start Level 1 - or jump straight to a level they have already
 * unlocked, which is read back from localStorage on load.
 */

import { LEVELS } from "../data/levels";

export default function StartScreen({ highestLevelUnlocked, hasSave, onStart, onReset }) {
  return (
    <div className="overlay overlay--scroll">
      <div className="card card--start">
        <div className="start__logo">
          <span className="start__rupee">₹</span>
        </div>
        <h1 className="start__title">
          Financial <span>Maze</span> 3D
        </h1>
        <p className="start__tagline">
          Walk a neon maze. At every junction, make a real Indian money decision.
          Learn what those decisions actually cost you - before they cost you for real.
        </p>

        <div className="start__scores">
          <div className="start__score">
            <span>💰</span>
            <strong>Wealth</strong>
            <em>Long-term growth of your money</em>
          </div>
          <div className="start__score">
            <span>🛡️</span>
            <strong>Security</strong>
            <em>Emergency fund and insurance</em>
          </div>
          <div className="start__score">
            <span>😊</span>
            <strong>Lifestyle</strong>
            <em>A plan you can actually live with</em>
          </div>
        </div>

        <div className="start__levels">
          {LEVELS.map((level) => {
            const unlocked = level.id <= highestLevelUnlocked;
            return (
              <button
                key={level.id}
                type="button"
                className={`level-card ${unlocked ? "" : "level-card--locked"}`}
                style={{ "--level-color": level.accentColor }}
                disabled={!unlocked}
                onClick={() => onStart(level.id)}
              >
                <span className="level-card__num">Level {level.id}</span>
                <span className="level-card__name">{level.name}</span>
                <span className="level-card__sub">{level.subtitle}</span>
                {!unlocked && <span className="level-card__lock">🔒 Finish Level {level.id - 1}</span>}
              </button>
            );
          })}
        </div>

        <div className="start__controls">
          <h4>Controls</h4>
          <p>
            <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or the arrow keys to move · on a
            phone, use the joystick in the bottom-left · press <kbd>1</kbd>-<kbd>4</kbd> to answer ·
            tap <strong>?</strong> any time for the glossary.
          </p>
          <p className="start__objective">
            Answer every glowing gold node to unlock the exit portal at the end of each maze.
          </p>
        </div>

        <button type="button" className="btn btn--primary btn--large" onClick={() => onStart(highestLevelUnlocked)}>
          {hasSave && highestLevelUnlocked > 1
            ? `Continue from Level ${highestLevelUnlocked}`
            : "Start Level 1"}
        </button>

        {hasSave && (
          <button type="button" className="btn btn--ghost" onClick={onReset}>
            Reset all progress
          </button>
        )}
      </div>
    </div>
  );
}

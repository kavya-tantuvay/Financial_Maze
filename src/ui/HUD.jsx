/**
 * HUD.jsx
 *
 * The bar across the top of the screen while you are playing: which level you
 * are on, your three score bars, your cash balance, and how many decisions are
 * left before the exit unlocks.
 *
 * It sits on top of the 3D canvas and lets mouse events pass through to the
 * game (see .hud in index.css), so it never blocks the maze.
 */

import ScoreBar from "./ScoreBar";
import { formatRupees } from "../utils/format";

export default function HUD({ level, scores, maxScores, balance, answered, total }) {
  const remaining = total - answered;

  return (
    <div className="hud">
      <div className="hud__left">
        <div className="hud__level" style={{ borderColor: level.accentColor }}>
          <span className="hud__level-num" style={{ color: level.accentColor }}>
            Level {level.id}
          </span>
          <span className="hud__level-name">{level.name}</span>
          <span className="hud__level-sub">{level.subtitle}</span>
        </div>
      </div>

      <div className="hud__bars">
        <ScoreBar icon="💰" label="Wealth" value={scores.wealth} max={maxScores.wealth} color="#fbbf24" />
        <ScoreBar icon="🛡️" label="Security" value={scores.security} max={maxScores.security} color="#38bdf8" />
        <ScoreBar icon="😊" label="Lifestyle" value={scores.lifestyle} max={maxScores.lifestyle} color="#f472b6" />
      </div>

      <div className="hud__right">
        <div className="hud__balance">
          <span className="hud__balance-label">Balance</span>
          <span className="hud__balance-value">{formatRupees(balance)}</span>
        </div>
        <div className="hud__progress">
          {remaining > 0 ? (
            <>
              <strong>{remaining}</strong> decision{remaining === 1 ? "" : "s"} left
            </>
          ) : (
            <span className="hud__progress--done">✓ Exit unlocked</span>
          )}
        </div>
      </div>
    </div>
  );
}

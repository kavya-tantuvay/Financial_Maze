/**
 * LevelComplete.jsx
 *
 * The screen you see after reaching the exit of a level.
 *
 * It grades just that level, not the whole game. The grade is worked out by
 * comparing what you scored against the best score that was available in that
 * level - a number that comes from getMaxScoresForLevel() in scenarios.js, so
 * it stays correct even if you add or edit scenarios later.
 */

import { formatRupees, scoreToGrade } from "../utils/format";
import { getMaxScoresForLevel } from "../data/scenarios";

export default function LevelComplete({ level, levelScores, balance, decisions, onNext }) {
  const max = getMaxScoresForLevel(level.id);

  const totalScored = levelScores.wealth + levelScores.security + levelScores.lifestyle;
  const totalPossible = max.wealth + max.security + max.lifestyle;
  const percent = totalPossible > 0 ? (totalScored / totalPossible) * 100 : 0;
  const { grade, label, color } = scoreToGrade(percent);

  // Only the decisions made in this level.
  const levelDecisions = decisions.filter((d) => d.level === level.id);
  const goodCount = levelDecisions.filter((d) => d.verdict === "good").length;
  const badCount = levelDecisions.filter((d) => d.verdict === "bad").length;

  const rows = [
    { icon: "💰", label: "Wealth", value: levelScores.wealth, max: max.wealth, color: "#fbbf24" },
    { icon: "🛡️", label: "Security", value: levelScores.security, max: max.security, color: "#38bdf8" },
    { icon: "😊", label: "Lifestyle", value: levelScores.lifestyle, max: max.lifestyle, color: "#f472b6" },
  ];

  return (
    <div className="overlay">
      <div className="card card--complete">
        <div className="complete__banner" style={{ color: level.accentColor }}>
          Level {level.id} Complete
        </div>
        <h2 className="card__title">{level.name}</h2>

        <div className="grade" style={{ "--grade-color": color }}>
          <div className="grade__letter">{grade}</div>
          <div className="grade__label">{label}</div>
          <div className="grade__percent">{Math.round(percent)}% of the best possible score</div>
        </div>

        <div className="summary">
          {rows.map((r) => (
            <div key={r.label} className="summary__row">
              <span className="summary__name">
                {r.icon} {r.label}
              </span>
              <div className="summary__track">
                <div
                  className="summary__fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, (r.value / r.max) * 100))}%`,
                    background: r.color,
                    boxShadow: `0 0 10px ${r.color}`,
                  }}
                />
              </div>
              <span className="summary__num" style={{ color: r.color }}>
                {r.value}/{r.max}
              </span>
            </div>
          ))}
        </div>

        <div className="stats">
          <div className="stat">
            <span className="stat__value">{formatRupees(balance)}</span>
            <span className="stat__label">Balance carried forward</span>
          </div>
          <div className="stat">
            <span className="stat__value" style={{ color: "#22c55e" }}>
              {goodCount}
            </span>
            <span className="stat__label">Smart decisions</span>
          </div>
          <div className="stat">
            <span className="stat__value" style={{ color: badCount > 0 ? "#ef4444" : "#22c55e" }}>
              {badCount}
            </span>
            <span className="stat__label">Costly mistakes</span>
          </div>
        </div>

        {/* A quick recap of anything that went wrong, so the lesson sticks. */}
        {badCount > 0 && (
          <div className="mistakes">
            <h4>Worth revisiting</h4>
            <ul>
              {levelDecisions
                .filter((d) => d.verdict === "bad")
                .map((d) => (
                  <li key={d.scenarioId}>
                    <strong>{d.title}</strong>
                    <span>{d.explanation}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <button type="button" className="btn btn--primary" onClick={onNext}>
          Continue to Level {level.id + 1} →
        </button>
      </div>
    </div>
  );
}

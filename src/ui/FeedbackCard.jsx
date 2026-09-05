/**
 * FeedbackCard.jsx
 *
 * Slides in after the player picks an option. This is the teaching moment:
 * it says whether the choice was good, shows exactly how the three scores
 * moved and what it cost in rupees, and explains WHY in two or three lines.
 *
 * The explanation text itself lives in data/scenarios.js, not here.
 */

import { useEffect } from "react";
import { formatRupees, formatDelta } from "../utils/format";

// How each verdict is presented. Kept as a lookup so adding a verdict type
// later is a one-line change.
const VERDICT = {
  good: { icon: "✅", label: "Good decision", color: "#22c55e" },
  okay: { icon: "🟡", label: "Reasonable, but not ideal", color: "#fbbf24" },
  bad: { icon: "⚠️", label: "Costly mistake", color: "#ef4444" },
};

export default function FeedbackCard({ scenario, option, onContinue }) {
  const verdict = VERDICT[option.verdict] ?? VERDICT.okay;

  // Enter or Space continues, so you can play the whole game from the keyboard.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onContinue();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onContinue]);

  const deltas = [
    { icon: "💰", label: "Wealth", value: option.impact.wealth, color: "#fbbf24" },
    { icon: "🛡️", label: "Security", value: option.impact.security, color: "#38bdf8" },
    { icon: "😊", label: "Lifestyle", value: option.impact.lifestyle, color: "#f472b6" },
  ];

  return (
    <div className="overlay">
      <div className="card card--feedback" style={{ "--verdict-color": verdict.color }}>
        <div className="feedback__verdict">
          <span className="feedback__icon">{verdict.icon}</span>
          <span className="feedback__label" style={{ color: verdict.color }}>
            {verdict.label}
          </span>
        </div>

        <p className="feedback__chosen">
          You chose: <strong>{option.label}</strong>
        </p>

        <div className="feedback__deltas">
          {deltas.map((d) => (
            <div key={d.label} className="delta">
              <span className="delta__icon">{d.icon}</span>
              <span className="delta__label">{d.label}</span>
              <span
                className="delta__value"
                style={{ color: d.value > 0 ? "#22c55e" : d.value < 0 ? "#ef4444" : "#94a3b8" }}
              >
                {formatDelta(d.value)}
              </span>
            </div>
          ))}
          {option.money !== 0 && (
            <div className="delta delta--money">
              <span className="delta__icon">🏦</span>
              <span className="delta__label">Balance</span>
              <span
                className="delta__value"
                style={{ color: option.money > 0 ? "#22c55e" : "#f87171" }}
              >
                {option.money > 0 ? "+" : ""}
                {formatRupees(option.money)}
              </span>
            </div>
          )}
        </div>

        <div className="feedback__why">
          <h4>Why this matters</h4>
          <p>{option.explanation}</p>
        </div>

        <button type="button" className="btn btn--primary" onClick={onContinue}>
          Continue exploring →
        </button>
        <p className="card__hint">or press Enter</p>
      </div>
    </div>
  );
}

/**
 * ScoreBar.jsx
 *
 * One animated bar in the top HUD - Wealth, Security or Lifestyle.
 *
 * Scores can go negative (a bad decision subtracts points), so the raw value
 * is mapped onto a 0-100% fill against the best possible score for the game
 * so far. The fill width is a CSS transition, which means the browser animates
 * it on the GPU and React only has to set one number.
 */

export default function ScoreBar({ icon, label, value, max, color }) {
  // Clamp into 0-100 so a bad run cannot produce a negative-width bar.
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="score-bar">
      <div className="score-bar__head">
        <span className="score-bar__label">
          <span className="score-bar__icon">{icon}</span>
          {label}
        </span>
        <span className="score-bar__value" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="score-bar__track">
        <div
          className="score-bar__fill"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}55, ${color})`,
            boxShadow: `0 0 12px ${color}aa`,
          }}
        />
      </div>
    </div>
  );
}

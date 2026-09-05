/**
 * ScenarioPopup.jsx
 *
 * The decision card that appears when you walk into a glowing node.
 *
 * Shows the scenario, the context with real rupee amounts, and 3-4 choices.
 * You can click an option or press 1, 2, 3 or 4 on the keyboard.
 *
 * Deliberately does NOT tell you which option is correct - that only appears
 * on the FeedbackCard after you commit to an answer.
 */

import { useEffect } from "react";

// Each option button gets its own accent colour so the choices are easy to
// tell apart at a glance. Colour here carries no hint about correctness.
const OPTION_COLORS = ["#38bdf8", "#a78bfa", "#fb923c", "#34d399"];

export default function ScenarioPopup({ scenario, onChoose, levelName }) {
  // Keyboard shortcuts: 1-4 pick the matching option.
  useEffect(() => {
    function onKeyDown(e) {
      const index = Number(e.key) - 1;
      if (index >= 0 && index < scenario.options.length) {
        onChoose(scenario.options[index]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scenario, onChoose]);

  return (
    <div className="overlay">
      <div className="card card--scenario">
        <div className="card__tag">{levelName} · Financial Decision</div>

        <h2 className="card__title">{scenario.title}</h2>
        <p className="card__context">{scenario.context}</p>

        <div className="options">
          {scenario.options.map((option, i) => (
            <button
              key={option.label}
              type="button"
              className="option"
              style={{ "--option-color": OPTION_COLORS[i % OPTION_COLORS.length] }}
              onClick={() => onChoose(option)}
            >
              <span className="option__key">{i + 1}</span>
              <span className="option__label">{option.label}</span>
            </button>
          ))}
        </div>

        <p className="card__hint">Click an option, or press 1-{scenario.options.length}</p>
      </div>
    </div>
  );
}

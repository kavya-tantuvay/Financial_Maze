/**
 * FinalReport.jsx
 *
 * The end-of-game screen after Level 3: a full financial health report.
 *
 * The projection at the top is a real compound-interest calculation, not a
 * made-up number. It assumes you keep investing at the rate your decisions
 * suggest, for the years between 25 and 30, at 12% a year - roughly the long
 * term return of Indian equity. The maths lives in utils/format.js.
 */

import { formatRupees, formatShortRupees, scoreToGrade, projectCorpus } from "../utils/format";
import { getMaxScoresForLevel } from "../data/scenarios";
import { LEVELS } from "../data/levels";

export default function FinalReport({ scores, balance, decisions, onRestart }) {
  // Best possible score across all three levels combined.
  const max = LEVELS.reduce(
    (total, lvl) => {
      const m = getMaxScoresForLevel(lvl.id);
      return {
        wealth: total.wealth + m.wealth,
        security: total.security + m.security,
        lifestyle: total.lifestyle + m.lifestyle,
      };
    },
    { wealth: 0, security: 0, lifestyle: 0 }
  );

  const totalScored = scores.wealth + scores.security + scores.lifestyle;
  const totalPossible = max.wealth + max.security + max.lifestyle;
  const percent = totalPossible > 0 ? (totalScored / totalPossible) * 100 : 0;
  const { grade, label, color } = scoreToGrade(percent);

  const goodCount = decisions.filter((d) => d.verdict === "good").length;
  const badCount = decisions.filter((d) => d.verdict === "bad").length;

  /**
   * Turn the wealth score into a plausible monthly investment habit.
   * A player who maxed the wealth axis is treated as investing ₹25,000/month
   * by 30; a player who scored zero is treated as investing almost nothing.
   */
  const wealthRatio = max.wealth > 0 ? Math.max(0, scores.wealth) / max.wealth : 0;
  const monthlyInvestment = Math.round(3000 + wealthRatio * 22000);
  const corpusAt30 = projectCorpus(monthlyInvestment, 5, 12);
  const corpusAt45 = projectCorpus(monthlyInvestment, 20, 12);

  const axes = [
    {
      icon: "💰",
      label: "Wealth",
      value: scores.wealth,
      max: max.wealth,
      color: "#fbbf24",
      note: "How hard your money is working for you over decades.",
    },
    {
      icon: "🛡️",
      label: "Security",
      value: scores.security,
      max: max.security,
      color: "#38bdf8",
      note: "Emergency fund, health cover and term insurance.",
    },
    {
      icon: "😊",
      label: "Lifestyle",
      value: scores.lifestyle,
      max: max.lifestyle,
      color: "#f472b6",
      note: "Whether the plan is one you can actually live with.",
    },
  ];

  // Pick out the weakest axis and give one concrete piece of advice about it.
  const weakest = [...axes].sort((a, b) => a.value / a.max - b.value / b.max)[0];
  const ADVICE = {
    Wealth:
      "Your protection is fine, but your money is sitting idle. Start a monthly SIP in a low-cost index fund - even ₹2,000 a month, started now, matters more than ₹20,000 started in ten years.",
    Security:
      "You are investing well but you are exposed. Build 6 months of expenses in a liquid fund, buy a personal health policy, and get term insurance while it is still cheap.",
    Lifestyle:
      "You are saving hard, maybe too hard. A plan you resent is a plan you abandon. Budget a guilt-free spending share of every bonus so the discipline lasts twenty years, not two.",
  };

  return (
    <div className="overlay overlay--scroll">
      <div className="card card--report">
        <div className="complete__banner" style={{ color: "#fbbf24" }}>
          Financial Health Report
        </div>
        <h2 className="card__title">Your portfolio at 30</h2>

        <div className="projection">
          <div className="projection__main">{formatShortRupees(corpusAt30)}</div>
          <p className="projection__note">
            Projected corpus by age 30 if you keep investing about{" "}
            <strong>{formatRupees(monthlyInvestment)}/month</strong> at 12% a year - the habit your
            decisions in this game point to. Hold that same habit to 45 and it becomes{" "}
            <strong>{formatShortRupees(corpusAt45)}</strong>.
          </p>
        </div>

        <div className="grade" style={{ "--grade-color": color }}>
          <div className="grade__letter">{grade}</div>
          <div className="grade__label">{label}</div>
          <div className="grade__percent">{Math.round(percent)}% overall</div>
        </div>

        <div className="summary">
          {axes.map((a) => (
            <div key={a.label} className="summary__row summary__row--tall">
              <span className="summary__name">
                {a.icon} {a.label}
              </span>
              <div className="summary__track">
                <div
                  className="summary__fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, (a.value / a.max) * 100))}%`,
                    background: a.color,
                    boxShadow: `0 0 10px ${a.color}`,
                  }}
                />
              </div>
              <span className="summary__num" style={{ color: a.color }}>
                {a.value}/{a.max}
              </span>
            </div>
          ))}
        </div>

        <div className="stats">
          <div className="stat">
            <span className="stat__value">{formatRupees(balance)}</span>
            <span className="stat__label">Final balance</span>
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
          <div className="stat">
            <span className="stat__value">{decisions.length}</span>
            <span className="stat__label">Decisions made</span>
          </div>
        </div>

        <div className="advice">
          <h4>Your biggest gap: {weakest.label}</h4>
          <p>{ADVICE[weakest.label]}</p>
        </div>

        {badCount > 0 && (
          <div className="mistakes">
            <h4>Every mistake you made, and why it cost you</h4>
            <ul>
              {decisions
                .filter((d) => d.verdict === "bad")
                .map((d) => (
                  <li key={d.scenarioId}>
                    <strong>{d.title}</strong>
                    <span>
                      You chose: {d.chosenLabel}. {d.explanation}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <p className="disclaimer">
          This game is for education only. The numbers reflect typical Indian rates and products as
          of 2025-26 and are not personalised financial advice. Always check current rates and speak
          to a SEBI-registered adviser before committing real money.
        </p>

        <button type="button" className="btn btn--primary" onClick={onRestart}>
          Play again from Level 1
        </button>
      </div>
    </div>
  );
}

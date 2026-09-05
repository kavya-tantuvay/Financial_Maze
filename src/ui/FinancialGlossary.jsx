/**
 * FinancialGlossary.jsx
 *
 * The slide-out panel behind the "?" button in the bottom-right corner.
 *
 * Every term the game uses, explained in two lines with a rupee example.
 * It is available at all times, including while a decision popup is open, so
 * a player who does not know what "ELSS" means can look it up before choosing.
 *
 * The content itself lives in data/glossary.js.
 */

import { useState } from "react";
import { GLOSSARY } from "../data/glossary";

export default function FinancialGlossary({ open, onToggle }) {
  const [query, setQuery] = useState("");

  const search = query.trim().toLowerCase();
  const results = search
    ? GLOSSARY.filter(
        (g) =>
          g.term.toLowerCase().includes(search) ||
          g.full.toLowerCase().includes(search) ||
          g.definition.toLowerCase().includes(search)
      )
    : GLOSSARY;

  return (
    <>
      <button
        type="button"
        className="glossary-toggle"
        onClick={onToggle}
        aria-label={open ? "Close glossary" : "Open financial glossary"}
        title="Financial glossary"
      >
        {open ? "✕" : "?"}
      </button>

      <aside className={`glossary ${open ? "glossary--open" : ""}`} aria-hidden={!open}>
        <header className="glossary__head">
          <h3>Financial Glossary</h3>
          <p>Every term in this game, in plain English.</p>
          <input
            className="glossary__search"
            type="search"
            placeholder="Search: SIP, ELSS, CIBIL..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </header>

        <div className="glossary__list">
          {results.map((item) => (
            <article key={item.term} className="glossary__item">
              <h4>
                {item.term}
                <span className="glossary__full">{item.full}</span>
              </h4>
              <p>{item.definition}</p>
              <p className="glossary__example">📌 {item.example}</p>
            </article>
          ))}
          {results.length === 0 && <p className="glossary__empty">No term matches "{query}".</p>}
        </div>
      </aside>
    </>
  );
}

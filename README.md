# Financial Maze 3D

An interactive 3D browser game that teaches Indian personal finance. You navigate a glowing neon maze, and at every junction you make a real money decision — the kind an 18–25 year old in India actually faces when the first salary lands.

Every choice moves three scores and shows you **why** it was smart or expensive, using real Indian numbers: SIPs, EPF, ELSS, term insurance, home loans, the old vs new tax regime.

Built with React and React Three Fiber. No backend, no database, no login — progress is saved in your browser's `localStorage`.

---

## Screenshots

> Add your own screenshots here.

| Screen | Image |
|---|---|
| Start screen | `docs/screenshot-start.png` |
| Level 1 maze | `docs/screenshot-maze.png` |
| Decision popup | `docs/screenshot-decision.png` |
| Feedback card | `docs/screenshot-feedback.png` |
| Final report | `docs/screenshot-report.png` |

To capture them: run the game, press `Win + Shift + S`, and save into a `docs/` folder.

---

## How to run

```bash
npm install
npm start
```

Then open **http://localhost:3000** (it opens automatically).

To build for production:

```bash
npm run build     # output goes to dist/
npm run preview   # serve the production build locally
```

Requires Node 18 or newer.

---

## How to play

**Goal:** answer every glowing gold decision node in the maze, then reach the exit portal. The portal stays locked (red) until all six decisions in that level are done — you cannot skip the financial content.

**Controls**

| Action | Input |
|---|---|
| Move | `W` `A` `S` `D` or the arrow keys |
| Move (mobile) | Drag the joystick in the bottom-left |
| Answer a decision | Click an option, or press `1`–`4` |
| Dismiss feedback | Click *Continue*, or press `Enter` |
| Open the glossary | The `?` button, bottom-right |
| Mute / unmute | The speaker button, bottom-right |

**The three scores**

| Score | What it measures |
|---|---|
| 💰 **Wealth** | How hard your money works over decades — SIPs, equity, compounding |
| 🛡️ **Security** | Your safety net — emergency fund, health cover, term insurance |
| 😊 **Lifestyle** | Whether the plan is one you can actually live with |

A high Wealth score with zero Security is a fragile portfolio. Saving every rupee and scoring nothing on Lifestyle is a plan you will abandon in four months. The game rewards balance.

At the end of each level you get a grade (A+ to D) against the best score that was available in that level. After Level 3 you get a full financial health report, including a projection of your portfolio at 30 based on the investing habit your decisions imply.

---

## The three levels

| Level | Situation | Income |
|---|---|---|
| **1 — First Salary** | Fresher, first job, first paycheque | ₹25,000/month |
| **2 — Growing Income** | Two years in, one job switch later | ₹50,000/month |
| **3 — Life Decisions** | Marriage, home loan, a child, ageing parents | ₹1,00,000/month |

---

## Financial topics covered

18 scenarios, six per level. All of them live in a single readable file: **`src/data/scenarios.js`**.

**Level 1 — First Salary**
1. Where your first ₹25,000 should go — emergency fund vs EMI vs SIP vs sending it home
2. EPF and VPF — why you never refuse an employer match
3. Parking money for a short-term goal — FD vs liquid fund vs equity
4. Lending to a friend who has not repaid before
5. What to do with a ₹10,000 Diwali bonus
6. Credit cards — rewards machine or 40% debt trap

**Level 2 — Growing Income**

7. Term insurance — ₹1 crore cover at ₹12,000/year, and why age locks the premium
8. Health insurance — why ₹3 lakh of company cover is not enough
9. Renting vs buying — a ₹45,000 EMI on a ₹50,000 salary
10. Investing a lumpsum into a 20% market crash — lumpsum, STP, or wait
11. Gold vs equity — and why jewellery is not an investment
12. Side-hustle income and lifestyle inflation

**Level 3 — Life Decisions**

13. Home loan down payment — 20% vs 35% vs emptying your savings
14. Starting a child's education fund at age 1 vs age 10
15. A parent's ₹8 lakh medical emergency
16. Job loss — what a six-month emergency fund actually buys you
17. NPS vs PPF for a 30-year retirement horizon
18. Old vs new tax regime at ₹12 lakh income

**Glossary** (the `?` button): SIP, FD, PPF, EPF & VPF, ELSS, NPS, Term Insurance, Health Insurance, Emergency Fund, EMI, CIBIL Score, Liquid Fund, Index Fund, Section 80C, Lumpsum vs SIP, STP, Super Top-up, Old vs New Tax Regime.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | **React 18** (JavaScript, no TypeScript) | |
| 3D | **React Three Fiber** + **drei** + **three.js** | React-style declarative 3D |
| Build | **Vite 5** | `npm start` runs the dev server on port 3000 |
| State | **React Context + useReducer** | One reducer holds every game rule |
| Saving | **localStorage** | No backend, no database, no auth |
| Audio | **Web Audio API** | Sounds are synthesised in code — zero audio files to download |
| Font | **Poppins** via Google Fonts | |

Only `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`, `useReducer` and `useLayoutEffect` are used — no advanced patterns.

**Bundle size** (gzipped): ~176 KB three.js + ~45 KB React + ~68 KB app code. three.js is split into its own chunk so browsers cache it separately.

---

## Project structure

```
financial_maze/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                  Mounts the app
    ├── App.jsx                   Canvas + UI overlay + which screen to show
    ├── index.css                 All styling for the 2D interface
    │
    ├── data/                     ── ALL GAME CONTENT LIVES HERE ──
    │   ├── scenarios.js          18 scenarios: options, score impacts, explanations
    │   ├── levels.js             3 maze layouts (as text art) + level details
    │   └── glossary.js           18 financial terms in plain English
    │
    ├── context/
    │   └── GameContext.jsx       Context + useReducer + localStorage autosave
    │
    ├── hooks/
    │   ├── useControls.js        Keyboard + joystick input
    │   └── useSound.js           Web Audio sound effects and ambient pad
    │
    ├── three/                    ── THE 3D SCENE ──
    │   ├── Scene.jsx             Lights, fog, stars, assembles everything
    │   ├── Maze.jsx              Instanced glowing walls (Tron-style edges)
    │   ├── Floor.jsx             Dark metallic floor + glowing grid
    │   ├── Player.jsx            The player sphere, movement and collision
    │   ├── DecisionNode.jsx      Pulsing gold orbs with orbiting particles
    │   ├── ExitPortal.jsx        Locked/unlocked exit ring
    │   └── FollowCamera.jsx      Smooth follow camera
    │
    ├── ui/                       ── THE 2D OVERLAY ──
    │   ├── StartScreen.jsx       Title screen and level select
    │   ├── HUD.jsx               Top bar: level, scores, balance
    │   ├── ScoreBar.jsx          One animated score bar
    │   ├── ScenarioPopup.jsx     The decision card
    │   ├── FeedbackCard.jsx      "Why this was good/bad" card
    │   ├── LevelComplete.jsx     Level summary and grade
    │   ├── FinalReport.jsx       Financial health report after Level 3
    │   ├── FinancialGlossary.jsx Slide-out glossary panel
    │   └── Joystick.jsx          Touch control for mobile
    │
    └── utils/
        ├── format.js             ₹ formatting (Indian 12,34,567 grouping)
        └── maze.js               Text grid → 3D walls, collision, movement
```

Every file starts with a comment explaining what it does in plain English.

---

## How the maze works

Each maze is stored as **text art** in `src/data/levels.js`, one string per row:

```
#################
#S#.#...#...#6..#
#.#.#.#.#.#E#.#.#
...
```

| Character | Meaning |
|---|---|
| `#` | Wall |
| `.` | Open floor |
| `S` | Start |
| `E` | Exit portal |
| `1`–`6` | Decision node (the digit picks which scenario) |

`src/utils/maze.js` turns that text into 3D wall positions and handles collision. **You can redesign a whole level by editing those strings — no 3D code changes needed.**

---

## Customising the game

- **Change a question, option or explanation** → `src/data/scenarios.js`
- **Redesign a maze** → edit the text art in `src/data/levels.js`
- **Add a glossary term** → `src/data/glossary.js`
- **Change a level's colour** → the `accentColor` field in `src/data/levels.js`
- **Change movement speed** → `SPEED` in `src/three/Player.jsx`
- **Change camera distance** → `OFFSET` in `src/three/FollowCamera.jsx`

Score impacts are graded automatically: `getMaxScoresForLevel()` works out the best possible score from the data itself, so adding scenarios keeps the grading correct without touching any other file.

---

## Disclaimer

This is an educational game, not financial advice. The rates, products and tax rules reflect typical Indian figures for 2025–26 and will change. Always check current rates and speak to a SEBI-registered adviser before committing real money.

---

## Licence

MIT

# 💰 Financial Maze 3D

### 🧭 Make Smart Money Moves. Escape the Maze Financially Free.

---
<img width="1910" height="899" alt="Screenshot 2025-11-09 122110" src="https://github.com/user-attachments/assets/5f9c84f0-f9d3-42e5-b4f4-529adfe0b72f" />

## 🌐 Overview

**Financial Maze 3D** is a **React-based 3D simulation game** that transforms personal finance into an immersive maze adventure.  
Players navigate through a 3D environment, make **financial decisions**, and balance their **wallet, savings, debt, and risk** while progressing toward **financial freedom**.  

Every decision impacts your score and outcome — **think wisely, spend smartly, and find your exit!**


https://github.com/user-attachments/assets/4eaa6c7f-f22a-4647-9a54-dab5cf4a8f56


---


## 🎮 Gameplay Concept

> “Each turn is a financial choice — save, spend, invest, or take risks.”

Traverse through a **3D maze**, where every checkpoint affects your financial stats.  
With **10 checkpoints** spread across multiple routes, you can **exit anytime**, but your **final score** depends on your **financial balance** when you do.

---

## 🧾 What's Inside

💼 **Wallet + Savings + Debt + Risk**  
🧩 **10 Checkpoints across multiple paths**  
🚪 **Exit anytime — outcome based on finances**  
🌫️ **Enhanced Graphics:** Fog, SSAO, Bloom  
📊 **Real-time Stats Panel** to track finances  

---

## 🎯 Goal

> 🏁 Achieve **Score ≥ 40** and **Debt ≤ 20** to win!

---

## 🕹️ Controls

| Action | Key |
|---------|-----|
| Move | **Arrow Keys / WASD** |
| Toggle Flashlight | **F** 🔦 |
| Toggle Minimap | **M** 🗺️ |
| Open Large Map | **L** |
| Exit Game | **Esc** |

---

## 💼 Stats Panel (Live Dashboard)

| Stat | Description |
|------|--------------|
| 👛 **Wallet** | Current available money |
| 💵 **Savings** | Total investments/savings |
| 💳 **Debt** | Borrowed amount |
| 🎲 **Risk** | Risk exposure level |
| 📊 **Score** | Overall performance |
| 🔢 **Decisions** | Checkpoints cleared (0/10) |

---

## ✨ Visual & Technical Features

✅ **3D Maze Rendering** with **React Three Fiber (Three.js)**  
✅ **Realistic Lighting & Fog** effects  
✅ **Bloom & SSAO** for cinematic visuals  
✅ **HUD Overlay** for stats and goal tracking  
✅ **Minimap** for spatial awareness  
✅ **Interactive Finance System** — choices update score dynamically  
✅ **Responsive Design** — works across browsers and devices  

---

## ⚙️ Tech Stack

| Category | Technology |
|-----------|-------------|
| **Frontend Framework** | React.js |
| **3D Engine** | React Three Fiber / Three.js |
| **State Management** | React Hooks / Context API |
| **Styling** | Tailwind CSS / Styled Components |
| **Animation** | Framer Motion / React Spring |
| **Deployment** | Vercel |

---

## 🧠 Technical Architecture

```

```
                    ┌───────────────────────────┐
                    │        React App          │
                    │  (index.jsx / App.jsx)    │
                    └────────────┬──────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
       ┌────────▼────────┐              ┌─────────▼────────┐
       │   UI Components │              │  3D Scene Logic  │
       │ (StatsPanel.jsx,│              │ (MazeScene.jsx,  │
       │  Controls.jsx)  │              │  Player.jsx)     │
       └────────┬────────┘              └─────────┬────────┘
                │                                 │
       ┌────────▼────────┐              ┌─────────▼────────┐
       │ State Management│              │ Rendering Engine  │
       │ (React Hooks /  │              │ (React Three      │
       │ Context API)    │              │  Fiber + Three.js)│
       └────────┬────────┘              └─────────┬────────┘
                │                                 │
        ┌───────▼─────────────────────────────────▼───────┐
        │               Game Logic Layer                  │
        │ - Financial decisions & checkpoint effects      │
        │ - Collision detection & navigation              │
        │ - Lighting, Fog, and Bloom controls             │
        └────────────────────────────────────────────────┘
```

````

---

## ⚙️ 3. Setup Instructions

Clone the repository and install dependencies:

```bash
git clone https://github.com/kavya-tantuvay/Financial_Maze.git
cd Financial_Maze
npm install
npm run build
````

---

## 🚀 4. Run the App

Open **terminal window** :

#### 🌐 Terminal 1: Start the Frontend

```bash
cd client
npm run dev
```

Once open your browser and go to:
👉 **(http://localhost:5173)**

---
## 🎥 Demo Video

[https://github.com/kavya-tantuvay/FINANCIAL_MAZE/public/assets/DemoVid.mp4](https://github.com/user-attachments/assets/d788664e-a47e-4d54-8415-35fd5b8162ca)
---

🎉 **Have Fun Exploring Financial Maze 3D!**
Make smart money choices, manage your finances, and reach the EXIT when you're ready. 💰

---

## 🧑‍💻 Developers

| Name               | Role                                           |
| ------------------ | ---------------------------------------------- |
| **Kavya Tantuvay-2023BCS032**        |  |
| **Maheswari Mudadla-2023BCS037** |   |
| **Nidhi Walke-2023BCS041**       |     |

---

## 💡 Future Enhancements

* 🎵 Add **background music** and **sound effects**
* 🧩 Introduce **multiple maze levels** with increasing complexity
* 💾 Save player progress using **localStorage / Firebase**
* 🏆 Add **leaderboard** and **score persistence**
* 🤖 Include **AI-driven financial advisors (NPCs)**

---




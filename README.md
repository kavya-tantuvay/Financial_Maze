<!-- 
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project. 
-->

# 💰 Financial Maze 3D

### 🧭 Make Smart Money Moves. Escape the Maze Financially Free.

---

## 🌐 Overview

**Financial Maze 3D** is a **React-based interactive 3D simulation game** that visualizes the world of personal finance as a **dynamic maze**.  
Players make **realistic money choices**, manage their **wallet, savings, debt, and risk**, and aim to reach the **Exit** while maintaining financial stability.

Every path you choose impacts your finances — balance your money wisely to achieve **Financial Freedom**!  

---

## 🎮 Gameplay Concept

> “Each turn is a financial decision — save, spend, invest, or risk.”

Navigate through a **3D financial maze** built using modern WebGL rendering.  
There are **10 checkpoints** across multiple paths — each decision dynamically updates your **financial stats** and overall **score**.

You can **exit anytime**, but your **final financial outcome** depends on your choices.

---

## 🧾 What's Inside

💼 **Wallet + Savings + Debt + Risk**  
🧩 **10 checkpoints across multiple paths**  
🚪 **Exit anytime — outcome based on finances**  
🌫️ **Enhanced graphics with Fog, SSAO, and Bloom**  
📊 **Real-time stats panel for your financial health**

---

## 🎯 Goal

> Score ≥ **40** and Debt ≤ **20** to win!

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
| 💵 **Savings** | Total savings/investments |
| 💳 **Debt** | Amount owed |
| 🎲 **Risk** | Financial risk exposure |
| 📊 **Score** | Overall performance |
| 🔢 **Decisions** | Checkpoints cleared (0/10) |

---

## ✨ Visual & Technical Features

✅ **3D Maze Rendering** using **React Three Fiber (Three.js)**  
✅ **Dynamic Lighting & Fog Effects** for realism  
✅ **Bloom & SSAO** for cinematic depth  
✅ **HUD (Heads-Up Display)** for stats and goals  
✅ **Minimap Overlay** to assist navigation  
✅ **State-based Finance System** – choices impact score, debt, and savings  
✅ **Fully Responsive UI** – works on desktop and web browsers  

---

## ⚙️ Tech Stack

| Category | Technology |
|-----------|-------------|
| **Frontend Framework** | React.js |
| **3D Engine** | React Three Fiber / Three.js |
| **State Management** | React Hooks / Context API |
| **UI Styling** | Tailwind CSS / Styled Components |
| **Animation** | Framer Motion / React Spring |
| **Deployment** | Vercel / Netlify |

---

## 🏗️ Technical Architecture

The **Financial Maze 3D** architecture is modular, separating 3D rendering, UI logic, and state management.

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

---

## 🚀 Getting Started

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/FinancialMaze3D.git
cd FinancialMaze3D
2️⃣ Install dependencies
npm install
3️⃣ Run locally
npm run dev
4️⃣ Build for production
npm run build
---
📸 Game Screens
| Scene               | Description                               |
| ------------------- | ----------------------------------------- |
| 🏁 **Start Screen** | Welcome & Instructions                    |
| 🌀 **Maze**         | 3D environment with financial checkpoints |
| 💼 **Stats Panel**  | Real-time financial dashboard             |
| 🚪 **Exit Screen**  | Final results based on performance        |
---
🏆 Credits

Developed by[Kavya Tantuvay/2023BCS032][Maheswari Mudadla/2023BCS037][Nidhi Walke/2023BCS041]
            
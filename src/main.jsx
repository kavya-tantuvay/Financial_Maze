/**
 * main.jsx
 *
 * The entry point. Mounts <App /> into the #root div from index.html and
 * wraps it in <GameProvider> so every component can reach the game state.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GameProvider } from "./context/GameContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
);

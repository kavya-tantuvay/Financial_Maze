/**
 * Scene.jsx
 *
 * Everything that lives inside the 3D <Canvas>: lights, sky, floor, maze
 * walls, decision nodes, the exit portal, the player and the camera.
 *
 * It also holds the shared player position ref. The Player component writes
 * to it and the FollowCamera reads from it, which lets those two stay in sync
 * 60 times a second without either one re-rendering.
 */

import { useMemo, useRef } from "react";
import { Stars } from "@react-three/drei";
import Maze from "./Maze";
import Floor from "./Floor";
import Player from "./Player";
import DecisionNode from "./DecisionNode";
import ExitPortal from "./ExitPortal";
import FollowCamera from "./FollowCamera";
import { parseMaze } from "../utils/maze";

export default function Scene({
  level,
  scenarios,
  completedScenarios,
  canMove,
  allNodesDone,
  getDirection,
  onEnterNode,
  onReachExit,
}) {
  // parseMaze walks the whole grid, so we only redo it when the level changes.
  const maze = useMemo(() => parseMaze(level.grid), [level]);
  const positionRef = useRef({ x: maze.start.x, z: maze.start.z });

  return (
    <>
      {/* --- Lighting ---
          A dim ambient fill so nothing is pure black, one cool key light from
          above, and a warm rim light from the opposite side. The bright glow
          in the scene comes from emissive materials, not from these lights. */}
      <ambientLight intensity={0.35} color="#4a5aa8" />
      <directionalLight position={[18, 30, 14]} intensity={0.7} color="#8ea2ff" castShadow />
      <directionalLight position={[-16, 18, -12]} intensity={0.35} color={level.accentColor} />
      <hemisphereLight args={["#3b3b8f", "#05030f", 0.4]} />

      {/* Distant starfield behind everything, for depth */}
      <Stars radius={140} depth={60} count={2600} factor={4} saturation={0} fade speed={0.4} />

      {/* Fog hides the far edges of the floor and makes the maze feel endless.
          The colour matches the page background so the fade is invisible. */}
      <fog attach="fog" args={["#0a0620", 45, 135]} />

      <Floor maze={maze} accentColor={level.accentColor} />
      <Maze maze={maze} accentColor={level.accentColor} />

      {/* One glowing pillar per decision in this level */}
      {maze.nodes.map((node) => {
        const scenario = scenarios[node.scenarioIndex];
        if (!scenario) return null;
        return (
          <DecisionNode
            key={scenario.id}
            position={node}
            index={node.scenarioIndex}
            answered={completedScenarios.includes(scenario.id)}
          />
        );
      })}

      <ExitPortal position={maze.exit} unlocked={allNodesDone} />

      <Player
        maze={maze}
        positionRef={positionRef}
        getDirection={getDirection}
        canMove={canMove}
        onEnterNode={onEnterNode}
        onReachExit={onReachExit}
        accentColor={level.accentColor}
      />

      <FollowCamera positionRef={positionRef} active={canMove} />
    </>
  );
}

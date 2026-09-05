/**
 * Player.jsx
 *
 * The glowing sphere you control, and the code that actually moves it.
 *
 * Every frame this component:
 *   1. asks useControls for the current direction (keyboard or joystick)
 *   2. moves the sphere, sliding along walls instead of getting stuck
 *   3. writes the new position into a shared ref so the camera can follow it
 *   4. checks whether the player has stepped onto a decision node or the exit
 *
 * The position lives in a ref rather than React state on purpose. Storing it
 * in state would re-render the component 60 times a second; a ref lets the
 * animation run entirely inside useFrame, which is the React Three Fiber way.
 */

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { moveWithCollision, distance2D, worldToCell, PLAYER_RADIUS } from "../utils/maze";

const SPEED = 9;              // world units per second
const NODE_TRIGGER_RADIUS = 1.4;
const EXIT_TRIGGER_RADIUS = 1.6;

export default function Player({
  maze,
  positionRef,
  getDirection,
  canMove,
  onEnterNode,
  onReachExit,
  accentColor,
}) {
  const meshRef = useRef();
  const trailRef = useRef();
  // Remembers which node we are currently standing on, so walking through a
  // node does not fire the popup again every single frame.
  const insideNodeRef = useRef(null);

  // Drop the player at the level's start position whenever the maze changes.
  useEffect(() => {
    positionRef.current = { x: maze.start.x, z: maze.start.z };
    insideNodeRef.current = null;
    if (meshRef.current) {
      meshRef.current.position.set(maze.start.x, PLAYER_RADIUS + 0.15, maze.start.z);
    }
  }, [maze, positionRef]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // delta is capped because if the browser tab is backgrounded, delta can
    // jump to several seconds and teleport the player straight through a wall.
    const dt = Math.min(delta, 0.05);
    const pos = positionRef.current;

    if (canMove) {
      const dir = getDirection();
      if (dir.x !== 0 || dir.z !== 0) {
        const next = moveWithCollision(maze, pos.x, pos.z, dir.x * SPEED * dt, dir.z * SPEED * dt);
        pos.x = next.x;
        pos.z = next.z;
      }
    }

    // Bob gently and spin, so the sphere feels alive even when standing still.
    const t = state.clock.elapsedTime;
    meshRef.current.position.set(pos.x, PLAYER_RADIUS + 0.15 + Math.sin(t * 2.4) * 0.08, pos.z);
    meshRef.current.rotation.y = t * 0.8;
    meshRef.current.rotation.x = t * 0.35;

    // The flat glowing disc under the player scales with the bob, which
    // reads as a shadow/reflection on the floor.
    if (trailRef.current) {
      trailRef.current.position.set(pos.x, 0.04, pos.z);
      trailRef.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.09);
    }

    if (!canMove) return;

    // --- Did we walk into a decision node? ---
    // Two tests, because a radius check alone is unreliable: when the player
    // slides along a wall it can pass through the corner of a node's cell
    // while staying just outside the radius. Matching the grid cell as well
    // makes stepping onto an orb always register.
    const cell = worldToCell(maze, pos.x, pos.z);
    let touching = null;
    for (const node of maze.nodes) {
      const sameCell = node.row === cell.row && node.col === cell.col;
      const nearEnough = distance2D(pos.x, pos.z, node.x, node.z) < NODE_TRIGGER_RADIUS;
      if (sameCell || nearEnough) {
        touching = node;
        break;
      }
    }
    if (touching && insideNodeRef.current !== touching.scenarioIndex) {
      insideNodeRef.current = touching.scenarioIndex;
      onEnterNode(touching);
    } else if (!touching) {
      insideNodeRef.current = null;
    }

    // --- Did we reach the exit? ---
    const exitCell = worldToCell(maze, maze.exit.x, maze.exit.z);
    const onExitCell = exitCell.row === cell.row && exitCell.col === cell.col;
    if (onExitCell || distance2D(pos.x, pos.z, maze.exit.x, maze.exit.z) < EXIT_TRIGGER_RADIUS) {
      onReachExit();
    }
  });

  return (
    <group>
      {/* Glow disc on the floor beneath the player */}
      <mesh ref={trailRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 32]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.28} depthWrite={false} toneMapped={false} />
      </mesh>

      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[PLAYER_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={accentColor}
          emissiveIntensity={1.8}
          metalness={0.55}
          roughness={0.15}
          toneMapped={false}
        />

        {/* Wireframe shell just outside the sphere - this is what gives the
            player the "energy ball" look rather than a plain white marble. */}
        <mesh>
          <sphereGeometry args={[PLAYER_RADIUS * 1.28, 16, 16]} />
          <meshBasicMaterial color={accentColor} wireframe transparent opacity={0.35} toneMapped={false} />
        </mesh>

        {/* Rim light travelling with the player, lighting up nearby walls. */}
        <pointLight color={accentColor} intensity={14} distance={14} decay={2} />
      </mesh>
    </group>
  );
}

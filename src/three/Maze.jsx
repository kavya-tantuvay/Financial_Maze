/**
 * Maze.jsx
 *
 * Draws all the walls of the maze.
 *
 * A maze can contain 200+ wall blocks. Rendering each one as its own <mesh>
 * would mean 200 separate draw calls every frame, which is slow. Instead we
 * use React Three Fiber's <instancedMesh>: ONE geometry and ONE material sent
 * to the GPU, drawn many times at different positions. That is the standard
 * way to render repeated objects in Three.js.
 *
 * The Tron look is built from three stacked layers per wall:
 *   1. body   - a dark, slightly reflective block
 *   2. cap    - a bright glowing plate covering the top of the block
 *   3. inlay  - a slightly smaller DARK plate sitting on top of the cap
 *
 * Layer 3 is the trick. It hides the middle of the glowing plate and leaves
 * only a thin bright border showing around the edge. Because neighbouring
 * walls sit flush against each other, those borders join up into continuous
 * neon lines running along the top of every corridor - which is what reads as
 * a glowing outline rather than a solid glowing floor.
 */

import { useLayoutEffect, useRef } from "react";
import { Object3D, Color } from "three";
import { CELL } from "../utils/maze";

const WALL_HEIGHT = 2.6;
const CAP_HEIGHT = 0.14;
// How wide the glowing border is. Smaller = thinner, sharper neon line.
const EDGE_WIDTH = 0.22;

export default function Maze({ maze, accentColor }) {
  const bodyRef = useRef();
  const capRef = useRef();
  const inlayRef = useRef();

  // useLayoutEffect (not useEffect) so the matrices are written before the
  // first paint - otherwise you briefly see every wall stacked at the origin.
  useLayoutEffect(() => {
    const dummy = new Object3D();

    maze.walls.forEach((wall, i) => {
      // 1. Wall body
      dummy.position.set(wall.x, WALL_HEIGHT / 2, wall.z);
      dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);

      // 2. Glowing cap plate on top of the body
      dummy.position.set(wall.x, WALL_HEIGHT + CAP_HEIGHT / 2, wall.z);
      dummy.updateMatrix();
      capRef.current.setMatrixAt(i, dummy.matrix);

      // 3. Dark inlay covering the middle of the cap, leaving only the border.
      //    Raised a hair above the cap so it always wins the depth test.
      dummy.position.set(wall.x, WALL_HEIGHT + CAP_HEIGHT + 0.005, wall.z);
      dummy.updateMatrix();
      inlayRef.current.setMatrixAt(i, dummy.matrix);
    });

    bodyRef.current.instanceMatrix.needsUpdate = true;
    capRef.current.instanceMatrix.needsUpdate = true;
    inlayRef.current.instanceMatrix.needsUpdate = true;
  }, [maze]);

  const count = maze.walls.length;
  const accent = new Color(accentColor);

  return (
    <group>
      {/* 1. Solid dark wall bodies */}
      <instancedMesh ref={bodyRef} args={[null, null, count]} castShadow receiveShadow>
        <boxGeometry args={[CELL, WALL_HEIGHT, CELL]} />
        <meshStandardMaterial
          color="#0d0c26"
          metalness={0.8}
          roughness={0.42}
          emissive={accent}
          // Very low emissive: just enough for the wall faces to pick up the
          // level's colour without competing with the neon edges above.
          emissiveIntensity={0.1}
        />
      </instancedMesh>

      {/* 2. Bright plate - only its outer rim will stay visible */}
      <instancedMesh ref={capRef} args={[null, null, count]}>
        <boxGeometry args={[CELL, CAP_HEIGHT, CELL]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </instancedMesh>

      {/* 3. Dark inlay that masks the middle of the plate */}
      <instancedMesh ref={inlayRef} args={[null, null, count]}>
        <boxGeometry args={[CELL - EDGE_WIDTH * 2, 0.02, CELL - EDGE_WIDTH * 2]} />
        <meshStandardMaterial color="#0d0c26" metalness={0.8} roughness={0.42} />
      </instancedMesh>
    </group>
  );
}

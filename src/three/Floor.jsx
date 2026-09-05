/**
 * Floor.jsx
 *
 * The dark metallic ground under the maze, plus the faint glowing grid lines
 * drawn on top of it.
 *
 * The grid comes from drei's <Grid> helper rather than a texture, so it stays
 * perfectly sharp at any zoom level and costs nothing to download.
 */

import { Grid } from "@react-three/drei";

export default function Floor({ maze, accentColor }) {
  // Make the plane comfortably larger than the maze so you never see its edge.
  const size = Math.max(maze.rows, maze.cols) * 6;

  return (
    <group>
      {/* Solid base plane, rotated flat. A plane is created standing up, so
          it always needs this -90 degree rotation on X to become a floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#05050f" metalness={0.9} roughness={0.45} />
      </mesh>

      {/* Glowing grid lines, fading out with distance so the maze feels
          like it sits in an endless dark space. */}
      <Grid
        position={[0, 0.01, 0]}
        args={[size, size]}
        cellSize={4}
        cellThickness={0.6}
        cellColor={accentColor}
        sectionSize={16}
        sectionThickness={1.2}
        sectionColor={accentColor}
        fadeDistance={70}
        fadeStrength={1.6}
        infiniteGrid
        followCamera={false}
      />
    </group>
  );
}

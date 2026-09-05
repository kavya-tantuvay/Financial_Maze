/**
 * ExitPortal.jsx
 *
 * The gateway at the end of each maze.
 *
 * It stays locked (red, slowly spinning) until every decision node in the
 * level has been answered, then turns green and opens. This is what stops
 * players sprinting straight to the exit and skipping the financial content.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const LOCKED_COLOR = "#ef4444";
const OPEN_COLOR = "#22c55e";

export default function ExitPortal({ position, unlocked }) {
  const ringRef = useRef();
  const innerRef = useRef();
  const color = unlocked ? OPEN_COLOR : LOCKED_COLOR;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Spins fast and bright when open, slow and dim when still locked.
    if (ringRef.current) ringRef.current.rotation.z = unlocked ? t * 1.4 : t * 0.35;
    if (innerRef.current) {
      innerRef.current.rotation.z = unlocked ? -t * 0.9 : -t * 0.2;
      innerRef.current.material.opacity = unlocked
        ? 0.35 + Math.sin(t * 3) * 0.15
        : 0.1;
    }
  });

  return (
    <group position={[position.x, 0, position.z]}>
      {/* Floor marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.7, 1.5, 40]} />
        <meshBasicMaterial color={color} transparent opacity={unlocked ? 0.8 : 0.3} toneMapped={false} />
      </mesh>

      {/* The portal ring, standing upright and rotating */}
      <mesh ref={ringRef} position={[0, 2, 0]}>
        <torusGeometry args={[1.3, 0.14, 12, 40]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={unlocked ? 2.6 : 0.8}
          toneMapped={false}
        />
      </mesh>

      {/* Shimmering disc filling the ring */}
      <mesh ref={innerRef} position={[0, 2, 0]}>
        <circleGeometry args={[1.25, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>

      <pointLight color={color} intensity={unlocked ? 16 : 4} distance={14} decay={2} position={[0, 2, 0]} />
    </group>
  );
}

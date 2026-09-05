/**
 * DecisionNode.jsx
 *
 * One glowing golden pillar standing at a junction of the maze. Walking into
 * it opens a financial decision.
 *
 * Three things are animated here inside useFrame (React Three Fiber's
 * per-frame hook):
 *   - the orb bobs up and down and pulses brighter
 *   - a ring of small particles orbits around it
 *   - once answered, the whole node dims to green and stops pulsing
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, Color } from "three";

const PARTICLE_COUNT = 14;
const ACTIVE_COLOR = "#fbbf24";   // gold - not yet answered
const DONE_COLOR = "#22c55e";     // green - already answered

export default function DecisionNode({ position, answered, index }) {
  const orbRef = useRef();
  const glowRef = useRef();
  const beamRef = useRef();
  const particlesRef = useRef();

  // Offsetting each node's animation by its index stops every node in the
  // maze pulsing in perfect unison, which looks mechanical.
  const phase = useMemo(() => index * 0.9, [index]);
  const color = answered ? DONE_COLOR : ACTIVE_COLOR;
  const dummy = useMemo(() => new Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase;

    if (orbRef.current) {
      orbRef.current.position.y = 1.7 + Math.sin(t * 1.6) * 0.22;
      orbRef.current.rotation.y = t * 0.5;
    }

    // Answered nodes sit at a steady dim glow; unanswered ones pulse to
    // pull the player's eye towards them.
    if (glowRef.current) {
      const pulse = answered ? 0.35 : 1.1 + Math.sin(t * 2.2) * 0.55;
      glowRef.current.material.opacity = answered ? 0.12 : 0.18 + Math.sin(t * 2.2) * 0.08;
      glowRef.current.scale.setScalar(pulse);
    }

    if (beamRef.current) {
      beamRef.current.material.opacity = answered ? 0.06 : 0.16 + Math.sin(t * 2.2) * 0.07;
    }

    // Orbiting particle ring.
    if (particlesRef.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + t * 0.6;
        const radius = 1.05 + Math.sin(t * 1.3 + i) * 0.12;
        dummy.position.set(
          Math.cos(angle) * radius,
          1.7 + Math.sin(t * 1.8 + i * 0.7) * 0.45,
          Math.sin(angle) * radius
        );
        const s = answered ? 0.035 : 0.06;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        particlesRef.current.setMatrixAt(i, dummy.matrix);
      }
      particlesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={[position.x, 0, position.z]}>
      {/* Base disc on the floor marking the node's footprint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.85, 1.25, 40]} />
        <meshBasicMaterial color={color} transparent opacity={answered ? 0.25 : 0.75} toneMapped={false} />
      </mesh>

      {/* Pillar of light rising from the floor - makes nodes visible from
          across the maze, over the top of the walls. */}
      <mesh ref={beamRef} position={[0, 4, 0]}>
        <cylinderGeometry args={[0.32, 0.55, 8, 16, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* The orb itself */}
      <mesh ref={orbRef} position={[0, 1.7, 0]} castShadow>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={answered ? 0.6 : 2.2}
          metalness={0.3}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>

      {/* Soft halo around the orb */}
      <mesh ref={glowRef} position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.85, 20, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Orbiting particles */}
      <instancedMesh ref={particlesRef} args={[null, null, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={answered ? 0.3 : 0.9} toneMapped={false} />
      </instancedMesh>

      {/* A real light source, so the node actually illuminates the walls
          around it rather than just looking bright itself. */}
      <pointLight
        color={color}
        intensity={answered ? 3 : 12}
        distance={12}
        decay={2}
        position={[0, 2, 0]}
      />
    </group>
  );
}

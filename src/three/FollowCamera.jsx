/**
 * FollowCamera.jsx
 *
 * Keeps the camera floating behind and above the player.
 *
 * Rather than snapping the camera to the player's exact position (which looks
 * jerky), each frame we move the camera a fraction of the way towards where it
 * should be. That fraction is frame-rate independent, so the motion feels the
 * same on a 60Hz laptop and a 144Hz monitor.
 *
 * useThree() gives us the camera that <Canvas> created for us - this is the
 * standard React Three Fiber way to reach into the scene.
 */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

// How far behind and above the player the camera sits.
const OFFSET = new Vector3(0, 30, 24);
// Higher = the camera catches up faster.
const SMOOTHING = 3.2;

export default function FollowCamera({ positionRef, active }) {
  const { camera } = useThree();
  const lookTarget = useRef(new Vector3());
  const desired = useRef(new Vector3());

  useFrame((state, delta) => {
    const pos = positionRef.current;
    const dt = Math.min(delta, 0.05);

    // Where the camera would ideally be right now.
    desired.current.set(pos.x + OFFSET.x, OFFSET.y, pos.z + OFFSET.z);

    if (active) {
      // 1 - e^(-k*dt) is exponential smoothing. It gives the same easing
      // regardless of frame rate, unlike a plain lerp with a fixed factor.
      const alpha = 1 - Math.exp(-SMOOTHING * dt);
      camera.position.lerp(desired.current, alpha);
      lookTarget.current.lerp(new Vector3(pos.x, 1, pos.z), alpha);
    } else {
      // While a popup is open the camera drifts slowly around the player,
      // which keeps the background alive without distracting from the text.
      const t = state.clock.elapsedTime * 0.12;
      const radius = 26;
      camera.position.lerp(
        desired.current.set(pos.x + Math.sin(t) * radius, 26, pos.z + Math.cos(t) * radius),
        1 - Math.exp(-1.2 * dt)
      );
      lookTarget.current.lerp(new Vector3(pos.x, 1, pos.z), 1 - Math.exp(-2 * dt));
    }

    camera.lookAt(lookTarget.current);
  });

  return null;
}

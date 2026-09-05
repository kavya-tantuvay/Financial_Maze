/**
 * useControls.js
 *
 * Collects movement input from the keyboard and from the on-screen joystick,
 * and hands it to the Player component as a simple { x, z } direction.
 *
 * The important detail: the direction is stored in a ref, not in state.
 * The 3D scene reads it 60 times a second inside useFrame, and putting it in
 * useState would re-render the whole React tree on every key press.
 */

import { useEffect, useRef, useCallback } from "react";

const KEY_MAP = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

export function useControls(enabled) {
  // Which keys are currently held down.
  const keys = useRef({ up: false, down: false, left: false, right: false });
  // Joystick contribution, already normalised to -1..1 on each axis.
  const joystick = useRef({ x: 0, z: 0 });

  useEffect(() => {
    function onKeyDown(e) {
      const dir = KEY_MAP[e.code];
      if (!dir) return;
      // Stop arrow keys from scrolling the page behind the canvas.
      e.preventDefault();
      keys.current[dir] = true;
    }
    function onKeyUp(e) {
      const dir = KEY_MAP[e.code];
      if (!dir) return;
      keys.current[dir] = false;
    }
    // If the tab loses focus mid-move, the keyup never fires - clear everything.
    function onBlur() {
      keys.current = { up: false, down: false, left: false, right: false };
    }

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  /** Called by the Joystick component as the thumb is dragged. */
  const setJoystick = useCallback((x, z) => {
    joystick.current = { x, z };
  }, []);

  /**
   * Current movement direction, combining keyboard and joystick.
   * Returns a vector no longer than 1 so diagonal movement is not faster.
   */
  const getDirection = useCallback(() => {
    if (!enabled) return { x: 0, z: 0 };

    let x = joystick.current.x;
    let z = joystick.current.z;

    if (keys.current.left) x -= 1;
    if (keys.current.right) x += 1;
    if (keys.current.up) z -= 1;
    if (keys.current.down) z += 1;

    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    return { x, z };
  }, [enabled]);

  return { getDirection, setJoystick };
}

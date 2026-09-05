/**
 * Joystick.jsx
 *
 * Touch control for phones and tablets. Only rendered on touch devices.
 *
 * Drag the thumb inside the ring; how far you drag it from the centre becomes
 * the movement direction, normalised to -1..1 on each axis. Releasing snaps it
 * back to the middle and stops the player.
 *
 * Uses pointer events (not touch events) so it works with a mouse too, which
 * makes it easy to test on a laptop.
 */

import { useRef, useState, useCallback } from "react";

const RADIUS = 52; // how far the thumb can travel from centre, in pixels

export default function Joystick({ onMove }) {
  const baseRef = useRef(null);
  const [thumb, setThumb] = useState({ x: 0, y: 0 });
  const activeId = useRef(null);

  /** Converts a screen position into a clamped offset and reports direction. */
  const update = useCallback(
    (clientX, clientY) => {
      const rect = baseRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = clientX - cx;
      let dy = clientY - cy;

      // Clamp the thumb inside the ring.
      const dist = Math.hypot(dx, dy);
      if (dist > RADIUS) {
        dx = (dx / dist) * RADIUS;
        dy = (dy / dist) * RADIUS;
      }

      setThumb({ x: dx, y: dy });
      // Screen Y (down is positive) maps directly onto world Z here, because
      // the camera looks down the +Z axis towards the player.
      onMove(dx / RADIUS, dy / RADIUS);
    },
    [onMove]
  );

  const stop = useCallback(() => {
    activeId.current = null;
    setThumb({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  return (
    <div
      ref={baseRef}
      className="joystick"
      onPointerDown={(e) => {
        activeId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activeId.current !== e.pointerId) return;
        update(e.clientX, e.clientY);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      aria-label="Movement joystick"
    >
      <div className="joystick__ring" />
      <div
        className="joystick__thumb"
        style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }}
      />
    </div>
  );
}

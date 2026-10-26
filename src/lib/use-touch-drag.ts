"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
// Pointer capture keeps the gesture alive while the page scrolls toward the room.
export function useTouchDrag(
  onDrop: (instanceId: string, slotId: string) => void,
) {
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const frame = useRef<number>(0);
  const [ghost, setGhost] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  function stop() {
    cancelAnimationFrame(frame.current);
    drag.current = null;
    setGhost(null);
  }
  function scroll() {
    const point = drag.current;
    if (!point) return;
    if (point.moved) {
      const speed = point.y < 100 ? -12 : point.y > innerHeight - 100 ? 12 : 0;
      if (speed) window.scrollBy(0, speed);
    }
    frame.current = requestAnimationFrame(scroll);
  }
  return {
    ghost,
    handlers: (id: string) => ({
      onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
        if (e.pointerType !== "touch") return;
        drag.current = { id, x: e.clientX, y: e.clientY, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
        frame.current = requestAnimationFrame(scroll);
      },
      onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
        const point = drag.current;
        if (!point || e.pointerType !== "touch") return;
        const moved =
          point.moved ||
          Math.hypot(e.clientX - point.x, e.clientY - point.y) > 8;
        drag.current = { ...point, x: e.clientX, y: e.clientY, moved };
        if (moved) setGhost({ id, x: e.clientX, y: e.clientY });
      },
      onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
        if (e.pointerType !== "touch") return;
        const point = drag.current;
        const target = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest("[data-slot]");
        stop();
        if (point?.moved && target)
          onDrop(id, target.getAttribute("data-slot")!);
      },
      onPointerCancel: stop,
    }),
  };
}

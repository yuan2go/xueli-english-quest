import { useEffect, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";
type Gesture = {
  id: number;
  source: string;
  x: number;
  y: number;
  moved: boolean;
  owner: HTMLElement;
};
/** A gesture never outlives its surface. DOM hit testing respects overlays and clipping. */
export function usePointerDrop(
  drop: (source: string, target: string | null) => void,
  disabled = false,
  scope?: RefObject<HTMLElement | null>,
) {
  const active = useRef<Gesture | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const coordinates = useRef({ x: 0, y: 0 });
  const handler = useRef(drop);
  handler.current = drop;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const suppressed = useRef(false);
  const [ghost, setGhost] = useState<{
    x: number;
    y: number;
    label: string;
    target: string | null;
  } | null>(null);
  function release() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const a = active.current;
    active.current = null;
    if (a?.owner.hasPointerCapture(a.id)) a.owner.releasePointerCapture(a.id);
    setGhost(null);
    return a;
  }
  function cancel() {
    if (active.current) suppressed.current = true;
    release();
  }
  useEffect(() => {
    if (disabled) cancel();
  }, [disabled]);
  useEffect(() => {
    function hit(x: number, y: number) {
      const el = document
        .elementFromPoint(x, y)
        ?.closest<HTMLElement>("[data-drop]");
      if (
        !el ||
        el.closest("[inert]") ||
        el.matches(":disabled") ||
        (scope?.current && !scope.current.contains(el))
      )
        return null;
      // Check the surface rect too: pointer capture can deliver coordinates outside it.
      const rect = (scope?.current ?? el).getBoundingClientRect();
      return x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
        ? (el.dataset.drop ?? null)
        : null;
    }
    const move = (e: globalThis.PointerEvent) => {
      const a = active.current;
      if (!a || a.id !== e.pointerId || disabledRef.current) return;
      if (Math.hypot(e.clientX - a.x, e.clientY - a.y) > 8) a.moved = true;
      if (a.moved) {
        coordinates.current = { x: e.clientX, y: e.clientY };
        if (frame.current !== null) return;
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          if (active.current !== a) return;
          const { x, y } = coordinates.current;
          const target = hit(x, y);
          if (ghostRef.current)
            ghostRef.current.style.translate = `${x}px ${y}px`;
          setGhost((old) =>
            old?.label === a.source && old.target === target
              ? old
              : { x, y, label: a.source, target },
          );
        });
      }
    };
    const up = (e: globalThis.PointerEvent) => {
      if (active.current?.id !== e.pointerId) return;
      const a = release()!;
      if (a.moved && !disabledRef.current) {
        suppressed.current = true;
        handler.current(a.source, hit(e.clientX, e.clientY));
      }
    };
    const cancelPointer = (e: globalThis.PointerEvent) => {
      if (active.current?.id === e.pointerId) cancel();
    };
    const otherPointer = (e: globalThis.PointerEvent) => {
      if (active.current && active.current.id !== e.pointerId) cancel();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
      if (e.key === "Enter" || e.key === " ") suppressed.current = false;
    };
    window.addEventListener("pointerdown", otherPointer, true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancelPointer);
    window.addEventListener("lostpointercapture", cancelPointer);
    window.addEventListener("resize", cancel);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      release();
      window.removeEventListener("pointerdown", otherPointer, true);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancelPointer);
      window.removeEventListener("lostpointercapture", cancelPointer);
      window.removeEventListener("resize", cancel);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", cancel);
    };
  }, []);
  return {
    ghost,
    ghostRef,
    cancel,
    start(e: PointerEvent<HTMLElement>, source: string) {
      if (
        disabledRef.current ||
        active.current ||
        !e.isPrimary ||
        e.button !== 0
      )
        return;
      suppressed.current = false;
      active.current = {
        id: e.pointerId,
        source,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        owner: e.currentTarget,
      };
      // Synthetic accessibility events need not own a hardware pointer.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* Window listeners still cancel safely. */
      }
    },
    click(action: () => void) {
      if (disabledRef.current) return;
      if (suppressed.current) {
        suppressed.current = false;
        return;
      }
      action();
    },
  };
}

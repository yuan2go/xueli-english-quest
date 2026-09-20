import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

/** Clamp the action paper to the visible world, including after rotation or a tool resize. */
export function SceneActions({
  anchor,
  world,
  children,
}: {
  anchor: HTMLElement | null;
  world: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  useLayoutEffect(() => {
    const container = world.current;
    const menu = ref.current;
    if (!anchor || !container || !menu) return;
    const place = () => {
      const a = anchor.getBoundingClientRect(),
        w = container.getBoundingClientRect();
      const m = menu.getBoundingClientRect();
      const x = a.left - w.left,
        y = a.top - w.top;
      const obstacles = [
        ...container.querySelectorAll<HTMLElement>(
          "[data-entity], .missing-object, .quest-ink",
        ),
      ].map((el) => el.getBoundingClientRect());
      const candidates = [
        [x + a.width + 12, y],
        [x - m.width - 12, y],
        [x, y + a.height + 12],
        [x, y - m.height - 12],
        [8, 8],
        [w.width - m.width - 8, 8],
        [8, w.height - m.height - 8],
        [w.width - m.width - 8, w.height - m.height - 8],
      ].map(([left, top]) => ({
        left: Math.max(8, Math.min(w.width - m.width - 8, left)),
        top: Math.max(8, Math.min(w.height - m.height - 8, top)),
      }));
      const score = (p: typeof position) => {
        const l = p.left + w.left,
          t = p.top + w.top;
        const overlap = obstacles.reduce(
          (sum, r) =>
            sum +
            Math.max(0, Math.min(l + m.width, r.right) - Math.max(l, r.left)) *
              Math.max(
                0,
                Math.min(t + m.height, r.bottom) - Math.max(t, r.top),
              ),
          0,
        );
        return overlap + Math.hypot(p.left - x, p.top - y) * 0.01;
      };
      candidates.sort((p, q) => score(p) - score(q));
      setPosition(candidates[0]);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(container);
    observer.observe(menu);
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchor, world]);
  return (
    <aside
      ref={ref}
      className="scene-actions"
      style={position}
      aria-label="物品行动"
    >
      {children}
    </aside>
  );
}

import { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Cue } from "../../game/shell.ts";

type Snapshot = { encounter: string | undefined; boxes: Map<string, DOMRect> };

/** FLIP actual entities after a commit. Cancelling reveals the committed world immediately. */
export function useSceneMotion(
  shell: RefObject<HTMLElement | null>,
  cue: Cue | null,
  disabled: boolean,
) {
  const before = useRef<Snapshot | null>(null);
  const running = useRef(new Map<HTMLElement, Animation>());
  function cancel() {
    running.current.forEach((animation, el) => {
      animation.cancel();
      delete el.dataset.moving;
    });
    running.current.clear();
  }
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => { if (reduced.matches) cancel(); };
    window.addEventListener("resize", cancel);
    reduced.addEventListener("change", preference);
    return () => {
      cancel();
      window.removeEventListener("resize", cancel);
      reduced.removeEventListener("change", preference);
    };
  }, []);
  useLayoutEffect(() => {
    const start = before.current;
    before.current = null;
    cancel();
    if (!cue || disabled || !start ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      start.encounter !== shell.current?.dataset.encounter) return;
    // Read every final box before writing any animation styles.
    const candidates = [...(shell.current?.querySelectorAll<HTMLElement>("[data-motion-id]") ?? [])]
      .map((el) => ({ el, from: start.boxes.get(el.dataset.motionId!), to: el.getBoundingClientRect(),
        transform: getComputedStyle(el).transform }))
      .filter(({ from, to }) => from && to.width && to.height &&
        (Math.abs(from.x - to.x) + Math.abs(from.y - to.y) +
          Math.abs(from.width - to.width) + Math.abs(from.height - to.height) > 2));
    const moving = new Set(candidates.map(({ el }) => el));
    for (const { el, from: old, to, transform } of candidates) {
      // A moving support/actor carries its descendants in the same compositor layer.
      if (moving.has(el.parentElement?.closest<HTMLElement>("[data-motion-id]")!)) continue;
      const from = old!;
      const dx = from.x + from.width / 2 - to.x - to.width / 2;
      const dy = from.y + from.height / 2 - to.y - to.height / 2;
      const sx = from.width / to.width, sy = from.height / to.height;
      const base = transform === "none" ? "" : transform;
      const crossing = cue.kind === "cross";
      const actor = crossing && el.dataset.motionId === "cat-companion";
      const pad = crossing && el.dataset.motionId === "route-sheet";
      el.dataset.moving = "true";
      const animation = el.animate([
        { transform: `translate(${dx}px, ${dy}px) ${base} scale(${sx}, ${sy})` },
        { transform: `translate(0, 0) ${base} scale(1, 1)` },
      ], {
        duration: actor ? 850 : pad ? 220 : 460,
        delay: actor ? 220 : 0,
        fill: "backwards",
        easing: "cubic-bezier(.22,.7,.2,1)",
      });
      running.current.set(el, animation);
      animation.onfinish = () => {
        if (running.current.get(el) !== animation) return;
        running.current.delete(el);
        delete el.dataset.moving;
      };
    }
    return cancel;
  }, [cue, disabled]);
  return function capture() {
    const root = shell.current;
    if (!root || disabled || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    before.current = {
      encounter: root.dataset.encounter,
      boxes: new Map([...root.querySelectorAll<HTMLElement>("[data-motion-id]")]
        .map((el) => [el.dataset.motionId!, el.getBoundingClientRect()])),
    };
    // Capture the current interpolated position before cancelling an interrupted move.
    cancel();
  };
}

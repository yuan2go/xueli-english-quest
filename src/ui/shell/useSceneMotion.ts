import { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Cue } from "../../game/shell.ts";
type Box = { rect: DOMRect; parent?: string };
type Snapshot = { encounter?: string; boxes: Map<string, Box> };

/** Committed identities are animated in place. The registry never writes application state. */
export function useSceneMotion(
  shell: RefObject<HTMLElement | null>,
  cue: Cue | null,
  disabled: boolean,
) {
  const before = useRef<Snapshot | null>(null);
  const running = useRef(new Map<HTMLElement, Animation[]>());
  function cancel() {
    running.current.forEach((animations, el) => {
      animations.forEach((a) => {
        a.onfinish = null;
        a.cancel();
      });
      delete el.dataset.moving;
      delete el.dataset.motion;
    });
    running.current.clear();
  }
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => {
      if (reduced.matches) cancel();
    };
    const hidden = () => {
      if (document.hidden) cancel();
    };
    window.addEventListener("resize", cancel);
    window.addEventListener("pagehide", cancel);
    document.addEventListener("visibilitychange", hidden);
    reduced.addEventListener("change", preference);
    return () => {
      cancel();
      window.removeEventListener("resize", cancel);
      window.removeEventListener("pagehide", cancel);
      document.removeEventListener("visibilitychange", hidden);
      reduced.removeEventListener("change", preference);
    };
  }, []);
  useLayoutEffect(() => {
    const start = before.current;
    before.current = null;
    cancel();
    if (
      !cue ||
      disabled ||
      !start ||
      document.hidden ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const sameScene = start.encounter === shell.current?.dataset.encounter;
    // All final geometry reads precede every animation write.
    const nodes = [
      ...(shell.current?.querySelectorAll<HTMLElement>("[data-motion-id]") ??
        []),
    ].map((el) => ({
      el,
      id: el.dataset.motionId!,
      from: start.boxes.get(el.dataset.motionId!),
      to: el.getBoundingClientRect(),
      base: getComputedStyle(el).transform,
      parent:
        el.parentElement?.closest<HTMLElement>("[data-motion-id]")?.dataset
          .motionId,
    }));
    const moving = new Set(
      nodes
        .filter(
          ({ from, to }) =>
            from &&
            Math.abs(from.rect.x - to.x) +
              Math.abs(from.rect.y - to.y) +
              Math.abs(from.rect.width - to.width) >
              2,
        )
        .map((n) => n.id),
    );
    const pad = nodes.find((n) => n.id === "route-sheet")?.to;
    const attach = (
      el: HTMLElement,
      animations: Animation[],
      action: string,
    ) => {
      el.dataset.moving = "true";
      el.dataset.motion = action;
      running.current.set(el, animations);
      const last = animations[0];
      last.onfinish = () => {
        if (running.current.get(el) !== animations) return;
        animations.forEach((a) => a.cancel());
        running.current.delete(el);
        delete el.dataset.moving;
        delete el.dataset.motion;
      };
    };
    for (const { el, id, from, to, base: transform, parent } of nodes) {
      if (!to.width || !to.height) continue;
      const role = cue.roles?.find((r) => r.id === id);
      // Existing attachments inherit their parent's movement; a newly worn hat has its own origin.
      if (parent && moving.has(parent) && from?.parent === parent) continue;
      const base = transform === "none" ? "" : transform;
      const old = sameScene ? from?.rect : undefined;
      if (old && moving.has(id)) {
        // New containment uses the new parent's animated local coordinates. Otherwise its
        // FLIP would add the same viewport displacement (and scale) a second time.
        const ancestor =
          parent && moving.has(parent)
            ? nodes.find((node) => node.id === parent)
            : undefined;
        const parentOld = sameScene ? ancestor?.from?.rect : undefined;
        const sx =
          parentOld && ancestor ? parentOld.width / ancestor.to.width : 1;
        const sy =
          parentOld && ancestor ? parentOld.height / ancestor.to.height : 1;
        const px =
          parentOld && ancestor
            ? parentOld.x +
              parentOld.width / 2 -
              ancestor.to.x -
              ancestor.to.width / 2
            : 0;
        const py =
          parentOld && ancestor
            ? parentOld.y +
              parentOld.height / 2 -
              ancestor.to.y -
              ancestor.to.height / 2
            : 0;
        const centerX = to.x + to.width / 2,
          centerY = to.y + to.height / 2;
        const dx =
          (old.x +
            old.width / 2 -
            centerX -
            px -
            (sx - 1) *
              (centerX -
                (ancestor ? ancestor.to.x + ancestor.to.width / 2 : centerX))) /
          sx;
        const dy =
          (old.y +
            old.height / 2 -
            centerY -
            py -
            (sy - 1) *
              (centerY -
                (ancestor
                  ? ancestor.to.y + ancestor.to.height / 2
                  : centerY))) /
          sy;
        const initial = `translate(${dx}px,${dy}px) ${base} scale(${old.width / to.width / sx},${old.height / to.height / sy})`;
        const end = `translate(0,0) ${base} scale(1,1)`;
        const actor = role?.action === "walk";
        const crossing = cue.kind === "cross" && actor && pad;
        const frames: Keyframe[] = crossing
          ? [
              { transform: initial, offset: 0 },
              { transform: initial, offset: 0.18 },
              {
                transform: `translate(${pad.x + pad.width * 0.53 - to.x - to.width / 2}px,${pad.y + pad.height * 0.52 - to.y - to.height * 0.88}px) ${base}`,
                offset: 0.57,
              },
              { transform: end, offset: 1 },
            ]
          : [
              { transform: initial, offset: 0 },
              { transform: initial, offset: 0.12 },
              { transform: end, offset: 1 },
            ];
        const duration = crossing
          ? 1250
          : cue.kind === "cross" && id === "route-sheet"
            ? 220
            : actor
              ? 750
              : 460;
        attach(
          el,
          [
            el.animate(frames, {
              duration,
              easing: actor ? "linear" : "cubic-bezier(.2,.7,.25,1)",
              fill: "backwards",
            }),
          ],
          actor ? "walk" : (role?.action ?? "layout"),
        );
      } else if (role || !sameScene) {
        const art = el.querySelector<HTMLElement>(
          ".object-art, .character-sprite",
        );
        if (!art) continue;
        const action = role?.action ?? "appear";
        const frames: Keyframe[] =
          action === "transform"
            ? [
                { transform: "perspective(500px) rotateY(0deg)" },
                {
                  transform: "perspective(500px) rotateY(82deg)",
                  offset: 0.35,
                },
                { transform: "perspective(500px) rotateY(0deg)" },
              ]
            : action === "open" || action === "close"
              ? [
                  {
                    transform: "perspective(400px) rotateX(12deg)",
                    transformOrigin: "50% 75%",
                  },
                  { transform: "perspective(400px) rotateX(0deg)" },
                ]
              : action === "wear"
                ? [
                    { transform: "translateY(-8px) rotate(-8deg)" },
                    { transform: "translateY(0) rotate(0)" },
                  ]
                : [
                    { opacity: 0, transform: "translateY(8px)" },
                    { opacity: 1, transform: "translateY(0)" },
                  ];
        attach(
          el,
          [
            art.animate(frames, {
              duration: action === "transform" ? 650 : 350,
              easing: "ease-out",
            }),
          ],
          action,
        );
      }
    }
    return cancel;
  }, [cue, disabled]);
  return function capture() {
    const root = shell.current;
    if (
      !root ||
      disabled ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    before.current = {
      encounter: root.dataset.encounter,
      boxes: new Map(
        [...root.querySelectorAll<HTMLElement>("[data-motion-id]")].map(
          (el) => [
            el.dataset.motionId!,
            {
              rect: el.getBoundingClientRect(),
              parent:
                el.parentElement?.closest<HTMLElement>("[data-motion-id]")
                  ?.dataset.motionId,
            },
          ],
        ),
      ),
    };
    // Interrupt from the current displayed coordinates, never the previous command's destination.
    cancel();
  };
}

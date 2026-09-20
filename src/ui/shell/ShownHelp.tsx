import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { AdventureResult, Intent } from "../../game/adventure.ts";

/** Content exposure is observed, including clipping and modal occlusion, never inferred from a click. */
export function ShownHelp({
  task,
  kind,
  send,
  children,
}: {
  task: string;
  kind: "attention" | "meaning" | "partial" | "text" | "feedback";
  send: (intent: Intent, silent?: boolean) => AdventureResult;
  children: ReactNode;
}) {
  const element = useRef<HTMLDivElement>(null);
  const current = useRef(send);
  current.current = send;
  useEffect(() => {
    let ratio = 0,
      partial = false,
      shown = false;
    function record() {
      const dialog = [...document.querySelectorAll("dialog[open]")].at(-1);
      if (
        !element.current ||
        document.hidden ||
        ratio <= 0 ||
        (dialog && !dialog.contains(element.current))
      )
        return;
      const phase = ratio >= 0.95 ? "shown" : "partial";
      if (shown || (phase === "partial" && partial)) return;
      current.current({ action: "help", task, value: kind, phase }, true);
      if (phase === "shown") shown = true;
      else partial = true;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        ratio = entry.intersectionRatio;
        record();
      },
      { threshold: [0, 0.01, 0.95, 1] },
    );
    const modals = new MutationObserver(record);
    modals.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    document.addEventListener("visibilitychange", record);
    if (element.current) observer.observe(element.current);
    return () => {
      observer.disconnect();
      modals.disconnect();
      document.removeEventListener("visibilitychange", record);
    };
  }, [task, kind]);
  return <div ref={element}>{children}</div>;
}

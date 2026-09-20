import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { AdventureResult, Intent } from "../../game/adventure.ts";

/** Record visible content, including clipped/scrolling help, rather than the request button. */
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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || document.hidden) return;
        current.current(
          { action: "help", task, value: kind, phase: "shown" },
          true,
        );
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, [task, kind]);
  return <div ref={element}>{children}</div>;
}

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      before?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const focusable = [
          ...(ref.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input, a[href]",
          ) ?? []),
        ].filter((el) => el.offsetParent !== null);
        const first = focusable[0],
          last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button className="secondary" onClick={close}>
        返回
      </button>
    </dialog>
  );
}

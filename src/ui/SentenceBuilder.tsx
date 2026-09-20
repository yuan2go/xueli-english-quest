import { useRef, useState } from "react";
import type { SentenceTask } from "../content/sentences.ts";
import { usePointerDrop } from "./pointer.ts";
export function SentenceBuilder({
  task,
  submit,
  disabled = false,
}: {
  task: Pick<SentenceTask, "id" | "tokens">;
  submit: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const move = (token: string, destination: string | null) => {
    if (!destination) return;
    setIds((old) => {
      const next = old.filter((id) => id !== token);
      if (destination === "words") return next;
      const index =
        destination === "sentence" ? next.length : next.indexOf(destination);
      if (index < 0) return old;
      next.splice(index, 0, token);
      return next;
    });
    setSelected(null);
  };
  const pointer = usePointerDrop(move, disabled, surface);
  const shift = (offset: number) => {
    if (!selected) return;
    setIds((old) => {
      const i = old.indexOf(selected),
        j = i + offset;
      if (i < 0 || j < 0 || j >= old.length) return old;
      const next = [...old];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  return (
    <div ref={surface} className="sentence-builder" aria-label="选词组句">
      <div
        className={`sentence-line ${pointer.ghost?.target === "sentence" ? "drop-hover" : ""}`}
        data-drop="sentence"
        aria-label="我的句子"
      >
        {ids.length === 0 ? (
          <span>拖到这里，或点词块，把意思说出来…</span>
        ) : (
          ids.map((id, i) => (
            <button
              key={id}
              data-drop={id}
              disabled={disabled}
              lang="en"
              className={pointer.ghost?.target === id ? "drop-hover" : ""}
              aria-label={`句子第${i + 1}块 ${task.tokens.find((t) => t.id === id)!.text}`}
              aria-pressed={selected === id}
              onPointerDown={(e) => pointer.start(e, id)}
              onClick={() =>
                pointer.click(() => setSelected(selected === id ? null : id))
              }
            >
              {task.tokens.find((t) => t.id === id)!.text}
            </button>
          ))
        )}
        <span
          className="sentence-tail"
          data-drop="sentence"
          aria-label="句尾放词"
        />
      </div>
      <div className="sentence-edit">
        <button
          disabled={disabled || !selected || ids.indexOf(selected) === 0}
          onClick={() => shift(-1)}
          aria-label="词块左移"
        >
          ←
        </button>
        <button
          disabled={
            disabled || !selected || ids.indexOf(selected) === ids.length - 1
          }
          onClick={() => shift(1)}
          aria-label="词块右移"
        >
          →
        </button>
        <button
          disabled={disabled || !selected}
          onClick={() => selected && move(selected, "words")}
        >
          撤回词块
        </button>
        <button
          disabled={disabled || !ids.length}
          onClick={() => {
            setIds([]);
            setSelected(null);
          }}
        >
          重新组句
        </button>
      </div>
      <div className="word-blocks" data-drop="words" aria-label="可用词块">
        {task.tokens.map((t) => (
          <button
            key={t.id}
            lang="en"
            data-token={t.id}
            disabled={disabled || ids.includes(t.id)}
            onPointerDown={(e) => pointer.start(e, t.id)}
            onClick={() => pointer.click(() => move(t.id, "sentence"))}
          >
            {t.text}
          </button>
        ))}
      </div>
      <button
        className="primary"
        disabled={disabled || !ids.length}
        onClick={() => submit(ids)}
      >
        说出这句话
      </button>
      {pointer.ghost && (
        <div
          className="drag-ghost"
          ref={pointer.ghostRef}
          aria-hidden="true"
          style={{
            left: 0,
            top: 0,
            translate: `${pointer.ghost.x}px ${pointer.ghost.y}px`,
          }}
        >
          {task.tokens.find((t) => t.id === pointer.ghost?.label)?.text}
        </div>
      )}
    </div>
  );
}

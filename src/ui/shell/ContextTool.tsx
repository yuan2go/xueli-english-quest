import { useEffect, useRef, useState } from "react";
import { resolveTool } from "../../game/shell.ts";
import type { Tool } from "../../game/shell.ts";
import { board } from "../../game/adventure.ts";
import type {
  Adventure,
  AdventureResult,
  Intent,
} from "../../game/adventure.ts";
import { StoryAudio } from "../../platform/audio.ts";
import { Letters } from "../Letters.tsx";
import { SentenceBuilder } from "../SentenceBuilder.tsx";
import { Art } from "../Art.tsx";
const modes = {
  teaching: "引导学习",
  assisted: "辅助练习",
  independent: "独立应用",
  exploration: "自由探索",
  revisit: "复习回访",
};
export function ContextTool({
  session,
  tool,
  send,
  close,
  paused,
  audio,
  onSuccess,
}: {
  session: Adventure;
  tool: Tool;
  send: (intent: Intent, silent?: boolean) => AdventureResult;
  close: () => void;
  paused: boolean;
  audio: StoryAudio;
  onSuccess: (focus?: string) => void;
}) {
  const model = resolveTool(session, tool);
  const [audioNote, setAudioNote] =
    useState("开发语音未审核；可以使用文字辅助。");
  const [message, setMessage] = useState("");
  const [blocked, setBlocked] = useState(false);
  const current = useRef({ session, tool, model, send, paused });
  current.current = { session, tool, model, send, paused };
  const requestOwner = useRef(0);
  const title = useRef<HTMLHeadingElement>(null);
  function play(replay = false) {
    const c = current.current;
    if (!c.model.id || !c.model.prompt || c.paused) return;
    audio.unlock();
    if (replay) c.send({ action: "replay", task: c.model.id }, true);
    const owner = ++requestOwner.current,
      sessionId = c.session.id,
      mode = c.session.mode;
    audio.play(c.model.prompt, setAudioNote, {
      stepId: c.model.id,
      purpose: "task",
      eventId: "",
      observe: (o) => {
        const now = current.current;
        if (
          owner !== requestOwner.current ||
          now.paused ||
          now.session.id !== sessionId ||
          now.session.mode !== mode
        )
          return;
        now.send(
          {
            action: "audio",
            task: c.model.id,
            request: o.requestId,
            value: o.status,
            assetId: o.assetId,
            audioSource: o.source,
            audioVersion: o.version,
          },
          true,
        );
      },
    });
  }
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!paused) play();
    return () => {
      ++requestOwner.current;
      audio.stop();
    };
  }, [paused, audio]);
  function submit(intent: Intent) {
    const r = send(intent);
    setMessage(r.message);
    setBlocked(r.kind === "blocked");
    if (["done", "valid"].includes(r.kind)) onSuccess(r.focus);
  }
  return (
    <section
      className="context-tool"
      aria-label={model.title}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        }
      }}
    >
      <div className="tool-heading">
        <h2 ref={title} tabIndex={-1}>
          {model.title}
          {model.reveal && model.letter && (
            <small className="letter-example" lang="en">
              {model.prompt}
            </small>
          )}
        </h2>
        {model.id && (
          <>
            <button onClick={() => play(true)}>重听</button>
            <button
              onClick={() =>
                send({ action: "help", task: model.id, value: "text" }, true)
              }
            >
              文字辅助
            </button>
          </>
        )}
        <button onClick={close}>收起工具</button>
      </div>
      {model.reveal && model.prompt && !model.letter && (
        <p className="answer" lang="en">
          {model.prompt}
        </p>
      )}
      {model.letter && (
        <Letters
          key={`${model.letter.id}-${model.morph?.word ?? ""}`}
          step={model.letter}
          disabled={paused}
          submit={(word) =>
            submit(
              tool.kind === "craft"
                ? { action: "craft", word }
                : {
                    action: model.morph ? "transform" : "word",
                    task: model.id,
                    word,
                    ...(model.morph ? { source: model.morph.id } : {}),
                  },
            )
          }
        />
      )}
      {model.sentence && (
        <SentenceBuilder
          task={model.sentence}
          disabled={paused}
          submit={(ids) => submit({ action: "sentence", task: model.id, ids })}
        />
      )}
      {tool.kind === "find" && (
        <p className="listening-invitation">
          声音说的是哪件？直接点场景里的物品。
        </p>
      )}
      {blocked &&
        model.sentence?.targetId === "bag-main" &&
        model.sentence.target.relation === "in" &&
        !board(session).bagOpen && (
          <button
            className="recovery-action"
            onClick={() => {
              const r = send({ action: "bag" });
              if (["valid", "done"].includes(r.kind)) {
                setBlocked(false);
                setMessage("袋口打开了，词块还在。再说一次，让物品行动吧。");
              }
            }}
          >
            打开背包
          </button>
        )}
      {message && (
        <p className="tool-result" role="status">
          {message}
        </p>
      )}
      {model.id && (
        <details className="tool-support">
          <summary>观察与帮助 · {modes[model.mode]}</summary>
          <p className="tool-context">{model.context}</p>
          {model.morph && model.teaching && (
            <div className="meaning-pair">
              <Art word={model.morph.word} />
              <span>
                {model.morph.word} → {model.target}
              </span>
              <Art word={model.target!} />
            </div>
          )}
          <button
            onClick={() =>
              send({ action: "help", task: model.id, value: "hint" }, true)
            }
          >
            提示
          </button>
          <button
            onClick={() =>
              send({ action: "help", task: model.id, value: "demo" }, true)
            }
          >
            看示范
          </button>
          {model.help?.demo && (
            <p>
              {model.sentence
                ? "按上面句子的顺序逐块选择；两个 the 都要用。词块可以拖动排序，最后亲手说出句子。"
                : "点字母填空，点格子取回；换词尾时先取回旧字母，再放入新的，最后亲手施法。"}
            </p>
          )}
          <p className="audio-note">{audioNote}</p>
        </details>
      )}
    </section>
  );
}

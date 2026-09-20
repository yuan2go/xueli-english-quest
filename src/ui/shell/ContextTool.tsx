import { useEffect, useRef, useState } from "react";
import { resolveTool } from "../../game/shell.ts";
import type { Tool } from "../../game/shell.ts";
import { board } from "../../game/adventure.ts";
import type {
  Adventure,
  AdventureResult,
  Intent,
} from "../../game/adventure.ts";
import { demoCompleted } from "../../game/learning.ts";
import { StoryAudio } from "../../platform/audio.ts";
import { Letters } from "../Letters.tsx";
import { SentenceBuilder } from "../SentenceBuilder.tsx";
import { TeachingDemo } from "./TeachingDemo.tsx";
import { ShownHelp } from "./ShownHelp.tsx";
import { NAMES } from "../Art.tsx";
const modes = {
  teaching: "引导学习",
  assisted: "辅助练习",
  independent: "独立练习",
  exploration: "自由探索",
  revisit: "复习回访",
};
const exercises = {
  "listen-rebuild": "听后重组",
  "scene-compose": "看情境说一句",
  "example-reproduce": "示例后亲手完成",
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
  const [text, setText] = useState(false);
  const [helpLevel, setHelpLevel] = useState(-1);
  const [demo, setDemo] = useState(
    () =>
      model.sentence?.exercise === "example-reproduce" &&
      !(model.help && demoCompleted(model.help)),
  );
  const current = useRef({ session, model, send, paused });
  current.current = { session, model, send, paused };
  const requestOwner = useRef(0);
  const title = useRef<HTMLHeadingElement>(null);
  const exercise = model.sentence?.exercise;
  const autoAudio = !model.sentence || exercise === "listen-rebuild";
  const reveal = text || model.reveal;
  function play(replay = false) {
    const c = current.current;
    if (!c.model.id || !c.model.prompt || c.paused) return;
    audio.unlock();
    if (replay) c.send({ action: "replay", task: c.model.id }, true);
    audio.stop();
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
    if (!paused && autoAudio && !demo) play();
    return () => {
      // Deliver cancellation while this request still owns its task. A click is not a hearing record.
      audio.stop();
      ++requestOwner.current;
    };
  }, [paused, audio, demo]);
  useEffect(() => {
    if (paused) setDemo(false);
  }, [paused]);
  function submit(intent: Intent) {
    const r = send(intent);
    setMessage(r.message);
    setBlocked(r.kind === "blocked");
    if (["done", "valid"].includes(r.kind)) onSuccess(r.focus);
  }
  const helpKind = (["attention", "meaning", "partial"] as const)[
    Math.min(helpLevel, 2)
  ];
  const blockedEntity =
    model.morph ??
    (model.sentence
      ? board(session).world.entities[model.sentence.targetId]
      : undefined);
  const obstruction = blockedEntity
    ? Object.values(board(session).world.entities).filter(
        (e) =>
          "targetId" in e.location && e.location.targetId === blockedEntity.id,
      )
    : [];
  const recoveryMorph =
    model.sentence &&
    blockedEntity &&
    blockedEntity.word !== model.sentence.target.target
      ? resolveTool(session, { kind: "morph", id: blockedEntity.id })
      : undefined;
  const hint =
    helpLevel === 0
      ? "先看看圈出的物品和它要去的地方。"
      : helpLevel === 1
        ? model.sentence
          ? model.sentence.target.kind === "command"
            ? "请朋友行动，用行动句。想一想：里面，还是上面？"
            : "只说眼前的位置。描述不会搬东西。"
          : model.context
        : model.sentence
          ? model.sentence.target.kind === "command"
            ? "先用 Put，说物品，再说位置。"
            : "先说 The 和物品，再用 is 接位置。"
          : `前面先找 ${model.prompt[0]}，再听听后面的声音。`;
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
        </h2>
        {model.id && (
          <button onClick={() => play(true)}>
            {autoAudio ? "重听" : "听完整示例"}
          </button>
        )}
        <button onClick={close}>收起工具</button>
      </div>
      <p className="tool-context">{model.context}</p>
      {model.sentence && (
        <p
          className="task-referents"
          data-source-ref={model.sentence.sourceId}
          data-target-ref={model.sentence.targetId}
        >
          {exercises[model.sentence.exercise]} ·{" "}
          {NAMES[model.sentence.target.source]} →{" "}
          {model.sentence.targetId === "route-sheet"
            ? "路线纸垫"
            : model.sentence.targetId === "picnic-mat"
              ? "野餐垫"
              : "旅行背包"}
        </p>
      )}
      {reveal && model.id && model.prompt && (
        <ShownHelp task={model.id} kind="text" send={send}>
          <p className={model.letter ? "letter-example" : "answer"} lang="en">
            {model.prompt}
          </p>
        </ShownHelp>
      )}
      {model.letter && (
        <Letters
          key={`${model.letter.id}-${model.morph?.word ?? ""}`}
          step={model.letter}
          disabled={paused || demo}
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
          disabled={paused || demo}
          submit={(ids) => submit({ action: "sentence", task: model.id, ids })}
        />
      )}
      {tool.kind === "find" && (
        <p className="listening-invitation">
          声音说的是哪件？直接点场景里的物品。
        </p>
      )}
      {blocked && blockedEntity && (
        <div className="recovery-actions">
          {obstruction.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                const r = send({
                  action: "place",
                  source: e.id,
                  target: { kind: "stage" },
                });
                setMessage(r.message + " 输入还在，准备好后再试。");
              }}
            >
              先移开{NAMES[e.word]}
            </button>
          ))}
          {model.morph && model.morph.location.kind !== "stage" && (
            <button
              onClick={() => {
                send({
                  action: "place",
                  source: model.morph!.id,
                  target: { kind: "stage" },
                });
              }}
            >
              先取出纸张
            </button>
          )}
          {recoveryMorph?.letter && (
            <details>
              <summary>先给路线纸换用途（保留句子）</summary>
              <Letters
                step={recoveryMorph.letter}
                disabled={paused}
                submit={(word) => {
                  const r = send({
                    action: "transform",
                    source: blockedEntity.id,
                    task: recoveryMorph.id,
                    word,
                  });
                  setMessage(r.message + " 词块还在，再试这句话。");
                }}
              />
            </details>
          )}
        </div>
      )}
      {blocked && model.sentence && (
        <div className="recovery-actions">
          {model.sentence.targetId === "bag-main" &&
            !board(session).bagOpen && (
              <button
                className="recovery-action"
                onClick={() => {
                  const r = send({ action: "bag" });
                  if (["valid", "done"].includes(r.kind)) {
                    setBlocked(false);
                    setMessage("袋口打开了，词块还在。再说一次吧。");
                  }
                }}
              >
                打开背包
              </button>
            )}
          {board(session).world.entities[model.sentence.sourceId]?.location
            .kind !== "stage" && (
            <button
              onClick={() => {
                const r = send({
                  action: "place",
                  source: model.sentence!.sourceId,
                  target: { kind: "stage" },
                });
                setMessage(r.message + " 词块还在。");
              }}
            >
              先把物品取出 / 摘下
            </button>
          )}
        </div>
      )}
      {message &&
        (model.id && /Put|\bis\b/.test(message) ? (
          <ShownHelp task={model.id} kind="feedback" send={send}>
            <p className="tool-result" role="status">
              {message}
            </p>
          </ShownHelp>
        ) : (
          <p className="tool-result" role="status">
            {message}
          </p>
        ))}
      {model.id && (
        <details className="tool-support">
          <summary>需要一点帮助 · {modes[model.mode]}</summary>
          <div className="help-actions">
            <button onClick={() => setHelpLevel((v) => Math.min(2, v + 1))}>
              {helpLevel < 0
                ? "注意情境"
                : helpLevel === 0
                  ? "意义线索"
                  : "局部提示"}
            </button>
            <button onClick={() => setText(true)}>文字辅助</button>
            <button
              onClick={() => {
                audio.stop();
                setDemo(true);
              }}
            >
              看示范
            </button>
          </div>
          {helpLevel >= 0 && (
            <ShownHelp
              key={helpLevel}
              task={model.id}
              kind={helpKind}
              send={send}
            >
              <p className="help-message">{hint}</p>
            </ShownHelp>
          )}
          <p className="audio-note">{audioNote}</p>
          {exercise === "scene-compose" && (
            <p className="micro">听完整示例会记为答案帮助。</p>
          )}
        </details>
      )}
      {demo && model.id && !paused && (
        <TeachingDemo
          session={session}
          tool={tool}
          taskId={model.id}
          send={send}
          close={() => setDemo(false)}
        />
      )}
    </section>
  );
}

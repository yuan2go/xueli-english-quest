import { validateQuestContent } from "./content/quest-validation.ts";
import { useEffect, useRef, useState } from "react";
import { initialQuest, issue, current } from "./game/quest.ts";
import type { Quest, Intent, Verdict } from "./game/quest.ts";
import { puzzle, QUEST_AUDIO } from "./content/quest.ts";
import {
  loadQuest,
  saveQuest,
  backupRaw,
  exportQuest,
  QUEST_KEY,
} from "./platform/quest-save.ts";
import { StoryAudio } from "./platform/audio.ts";
import { localId } from "./platform/id.ts";
import { useAssets } from "./platform/useAssets.ts";
import { AssetContext, AssetNotice, CharacterArt } from "./ui/Art.tsx";
import { GameShell } from "./ui/shell/GameShell.tsx";
import { WordBook } from "./ui/WordBook.tsx";
import { Modal } from "./ui/Modal.tsx";
import "./quest.css";
function load() {
  validateQuestContent();
  try {
    return loadQuest(localStorage);
  } catch {
    return { warning: "存储不可用，本次可以在内存中游玩。", blocked: true };
  }
}
export default function App() {
  const [loaded] = useState(load),
    [session, setSession] = useState<Quest>(
      () => loaded.session ?? initialQuest(localId()),
    );
  const latest = useRef(session);
  latest.current = session;
  const [surface, setSurface] = useState<"home" | "game" | "book">("home"),
    [receipt, setReceipt] = useState<Verdict>();
  const [warning, setWarning] = useState(loaded.warning),
    [memory, setMemory] = useState(false),
    [blocked, setBlocked] = useState(loaded.blocked);
  const [settings, setSettings] = useState(false),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const [voice, setVoice] = useState("开发语音 · 未经听审"),
    [muted, setMuted] = useState(false);
  const audio = useRef(new StoryAudio()),
    assets = useAssets(current(session).level);
  function send(i: Intent) {
    const result = issue(latest.current, i, localId());
    latest.current = result.session;
    setSession(result.session);
    setReceipt(result.verdict);
    if (result.session !== session && !memory && !blocked) {
      try {
        const problem = saveQuest(result.session, localStorage);
        if (problem) setWarning(problem);
      } catch {
        setWarning("保存失败，请导出本局记录。");
      }
    }
  }
  function speak(text: string) {
    audio.current.unlock();
    const entry = QUEST_AUDIO.find((a) => a.text === text);
    audio.current.play(
      text,
      setVoice,
      entry
        ? {
            stepId: current(latest.current).level,
            purpose: "task",
            eventId: localId(),
            observe: (o) =>
              send({
                kind: "audio",
                value: o.status,
                assetId: o.assetId,
                source: o.source,
                version: o.version,
              }),
          }
        : undefined,
    );
  }
  function stop() {
    audio.current.stop();
  }
  function start(inMemory = false) {
    if (!inMemory && blocked) {
      try {
        backupRaw(localStorage, QUEST_KEY);
      } catch {
        setWarning("备份未完成，原档未动。请导出或选择仅本次游玩。");
        return;
      }
    }
    setMemory(inMemory);
    setBlocked(false);
    setSurface("game");
    audio.current.unlock();
  }
  function enter(mode: "story" | "workshop" | "revisit") {
    stop();
    send({ kind: "enter", mode });
    setSurface("game");
  }
  function exportAll() {
    let text: string;
    try {
      text = exportQuest(latest.current, localStorage);
    } catch {
      text = exportQuest(latest.current);
    }
    const url = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "xueli-records.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  useEffect(() => {
    const cancel = () => audio.current.stop();
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      cancel();
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", cancel);
    };
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return (
    <AssetContext value={assets}>
      <div className={`quest-app ${reduced ? "reduced-motion" : ""}`}>
        <header className="app-header">
          <button
            className="brand"
            onClick={() => {
              stop();
              setSurface("home");
            }}
          >
            雪梨英语奇旅 <span>纸上小径</span>
          </button>
          <nav aria-label="主要入口">
            <button onClick={() => enter("story")}>去冒险</button>
            <button onClick={() => enter("workshop")}>魔法工坊</button>
            <button
              onClick={() => {
                stop();
                send({ kind: "support", value: "text" });
                setSurface("book");
              }}
            >
              词语册
            </button>
            <button
              aria-label="暂停与设置"
              onClick={() => {
                stop();
                setSettings(true);
              }}
            >
              ☰
            </button>
          </nav>
        </header>
        <AssetNotice />
        {warning && (
          <div className="notice" role="alert">
            {warning}
            <button onClick={exportAll}>导出记录</button>
          </div>
        )}
        {surface === "home" ? (
          <main className="title-page">
            <div className="title-copy">
              <span className="eyebrow">一场从「如果」开始的冒险</span>
              <h1>
                把词语，
                <br />
                变成好办法。
              </h1>
              <p>
                围栏那边有一只篮子。
                <br />
                带上你的主意，和小猫把它带回来。
              </p>
              <button className="primary start" onClick={() => start()}>
                {blocked
                  ? "保留旧档，开始新冒险"
                  : loaded.session
                    ? "继续冒险"
                    : "开始冒险"}{" "}
                →
              </button>
              {blocked && (
                <button onClick={() => start(true)}>
                  仅本次游玩，不写原档
                </button>
              )}
              <small>可以试错，可以撤销，也可以换个办法。</small>
            </div>
            <div className="cover-stage">
              <div className="cover-ring" />
              <CharacterArt />
              <span className="cover-note">
                small / big
                <br />
                一个词，一种可能
              </span>
            </div>
          </main>
        ) : surface === "book" ? (
          <WordBook session={session} speak={speak} />
        ) : (
          <GameShell
            key={session.active}
            session={session}
            send={send}
            receipt={receipt}
            reduced={reduced}
            speak={speak}
            cancelAudio={stop}
          />
        )}
        <footer className="app-footer">
          <span>{voice}</span>
          <button
            onClick={() => {
              stop();
              setMuted(!muted);
              audio.current.muted = !muted;
            }}
          >
            {muted ? "开启声音" : "静音"}
          </button>
          {surface === "game" && (
            <span>
              {puzzle(current(session).level).id === "workshop"
                ? "工坊中的物品留在工坊里"
                : "你的每一个办法，都留下自己的足迹。"}
            </span>
          )}
        </footer>
        {settings && (
          <Modal title="歇一小会儿" close={() => setSettings(false)}>
            <label className="setting">
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
              />
              减少动画
            </label>
            <p>进度保存在本机。可以导出原档和本次记录。</p>
            <button onClick={exportAll}>导出全部记录</button>
            <button
              onClick={() => {
                send({ kind: "restart" });
                setSettings(false);
              }}
            >
              重开本关（保留尝试记录）
            </button>
            <details>
              <summary>成人记录</summary>
              <p>
                本次行为 {session.events.length} 条。开发 TTS
                不构成经审核的独立听力证据。教研、真实儿童与设备验收待完成。
              </p>
            </details>
          </Modal>
        )}
      </div>
    </AssetContext>
  );
}

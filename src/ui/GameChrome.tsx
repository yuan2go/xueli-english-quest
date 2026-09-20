import type { ReactNode } from "react";
import { CharacterArt, Visual } from "./Art.tsx";

type IconName =
  | "pause"
  | "sound"
  | "muted"
  | "book"
  | "help"
  | "play"
  | "close"
  | "leaf";
export function GameIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    pause: (
      <>
        <path d="M8 5v14M16 5v14" strokeWidth="4" />
      </>
    ),
    sound: (
      <>
        <path d="m11 5-5 4H3v6h3l5 4zM15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14" />
      </>
    ),
    muted: (
      <>
        <path d="m11 5-5 4H3v6h3l5 4zM16 9l5 6m0-6-5 6" />
      </>
    ),
    book: (
      <>
        <path d="M12 5v16M12 5C8 2 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-6-2-10 1Z" />
        <path d="m5 8 4 1m6 0 4-1" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01" />
      </>
    ),
    play: <path d="m9 5 10 7-10 7Z" fill="currentColor" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    leaf: (
      <>
        <path d="M19 3c1 10-2 16-9 15C1 17 5 7 19 3Z" />
        <path d="m5 21 10-12" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function TitleScreen({
  continuing,
  start,
  settings,
}: {
  continuing: boolean;
  start: () => void;
  settings: () => void;
}) {
  return (
    <section className="title-screen" aria-label="冒险标题画面">
      <Visual
        id="scene-act-1"
        label="林间小屋与通往远方的小径"
        className="title-landscape"
      />
      <div className="title-vignette" />
      <p className="title-brand">
        <GameIcon name="leaf" />
        雪梨英语奇旅
      </p>
      <button
        className="round-control title-settings"
        onClick={settings}
        aria-label="设置"
      >
        <GameIcon name="pause" />
      </button>
      <div className="title-companion">
        <CharacterArt />
      </div>
      <div className="title-lettering">
        <span className="title-overline">
          一张会变魔法的地图 · 一场林间奇遇
        </span>
        <h1>
          <span>小猫的</span>野餐冒险
        </h1>
        <p>和小猫一起，用英语让故事发生。</p>
        <button className="start-adventure" onClick={start}>
          <GameIcon name="play" />
          {continuing ? "继续冒险" : "开始冒险"}
          <span aria-hidden="true">→</span>
        </button>
        <span className="title-invitation">点一点，拖一拖，发现自己的办法</span>
      </div>
      <p className="title-footnote">绘本试玩版 · 图像与开发语音待审核</p>
    </section>
  );
}

export function GameHud({
  act,
  title,
  activity,
  muted,
  mute,
  pause,
}: {
  act: number;
  title: string;
  activity?: string;
  muted: boolean;
  mute: () => void;
  pause: () => void;
}) {
  return (
    <header className="game-hud">
      <div className="chapter-plaque">
        <GameIcon name="leaf" />
        <div>
          <span className="chapter-caption">
            {activity
              ? "林间小插曲"
              : `野餐冒险 · 第${["一", "二", "三"][act - 1]}幕`}
          </span>
          <h1>{title}</h1>
        </div>
        {!activity && (
          <div
            className="journey-marks"
            aria-label={`故事第 ${act} 幕，共 3 幕`}
          >
            {[1, 2, 3].map((n) => (
              <i key={n} data-reached={n <= act} />
            ))}
          </div>
        )}
      </div>
      <div className="hud-controls">
        <button
          className="round-control"
          onClick={mute}
          aria-label={muted ? "声音：已关闭" : "声音：已开启"}
          aria-pressed={muted}
        >
          <GameIcon name={muted ? "muted" : "sound"} />
        </button>
        <button className="round-control" onClick={pause} aria-label="暂停">
          <GameIcon name="pause" />
        </button>
      </div>
    </header>
  );
}

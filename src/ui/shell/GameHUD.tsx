export function GameHUD({
  title,
  problem,
  muted,
  explore,
  pause,
  help,
  mute,
}: {
  title: string;
  problem: string;
  muted: boolean;
  explore: () => void;
  pause: () => void;
  help: () => void;
  mute: () => void;
}) {
  return (
    <header className="game-hud">
      <div>
        <h1>{title}</h1>
        <p>{problem}</p>
      </div>
      <nav aria-label="游戏控制">
        <button onClick={explore}>探索小路</button>
        <button aria-label={muted ? "开启声音" : "关闭声音"} onClick={mute}>
          {muted ? "声 ×" : "声 ♪"}
        </button>
        <button onClick={help}>帮助</button>
        <button onClick={pause}>暂停</button>
      </nav>
    </header>
  );
}

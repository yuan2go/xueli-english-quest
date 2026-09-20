import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { WordId } from "../domain/world.ts";
import { assetPathById } from "../content/assets.ts";
import { IMAGES } from "../content/manifest.ts";
export const NAMES: Record<WordId, string> = {
  cat: "小猫", bag: "背包", map: "地图", mat: "垫子", hat: "宽檐帽", cap: "鸭舌帽",
};
export const AssetContext = createContext({
  failed: [] as string[], epoch: 0, retrying: false,
  report: (_id: string) => {}, retry: () => {},
});
/** Both preflight and late image failures use the same explicit recovery path. */
export function Visual({ id, label, className = "", fail = false }: {
  id: string; label: string; className?: string; fail?: boolean;
}) {
  const assets = useContext(AssetContext);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [assets.epoch, id]);
  const entry = IMAGES.find((a) => a.id === id)!;
  if (broken || fail || assets.failed.includes(id)) return (
    <span className={`art-fallback ${className}`} role="img" aria-label={`${label}，图像暂不可用`}>
      <span>{label}</span><small>图像暂不可用 · 可重试</small>
    </span>
  );
  return <img key={`${id}-${assets.epoch}`} className={className} data-asset={id}
    src={assetPathById(id)} width={entry.width} height={entry.height} alt="" draggable={false} decoding="async"
    onError={() => { setBroken(true); assets.report(id); }} />;
}
export function Art({ word, fail = false, paper = false }: { word: WordId; fail?: boolean; paper?: boolean }) {
  const image = <Visual id={word} label={NAMES[word]} fail={fail} />;
  return paper ? <span className="paper-puppet">{image}<small>纸偶</small></span> : image;
}
export function CharacterArt({ pose = "idle" }: { pose?: "idle" | "thinking" | "action" | "happy" }) {
  const id = pose === "idle" ? "cat" : `cat-${pose}`;
  const [visible, setVisible] = useState("cat");
  const [previous, setPrevious] = useState<string | null>(null);
  const shown = useRef("cat");
  useEffect(() => {
    if (shown.current === id) return;
    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.src = assetPathById(id);
    // Hold the decoded pose until its replacement is ready, including on a cold cache.
    void image.decode().catch(() => {}).then(() => {
      if (cancelled) return;
      setPrevious(shown.current);
      shown.current = id;
      setVisible(id);
    });
    return () => { cancelled = true; };
  }, [id]);
  useEffect(() => {
    if (!previous) return;
    const timer = setTimeout(() => setPrevious(null), 220);
    return () => clearTimeout(timer);
  }, [previous, visible]);
  return <span className="character-sprite" data-pose={pose}>
    <Visual id={visible} label="狸花猫伙伴" className="character-art" />
    {previous && <span key={visible} className="character-previous" aria-hidden="true">
      <Visual id={previous} label="狸花猫伙伴" />
    </span>}
  </span>;
}
export function AssetNotice() {
  const assets = useContext(AssetContext);
  if (!assets.failed.length) return null;
  return <div className="notice resource-notice" role="alert">
    部分插画加载失败，已提供文字替代。进度保留，可以继续。
    <button className="quiet" disabled={assets.retrying} onClick={assets.retry}>
      {assets.retrying ? "正在重试…" : "重试资源"}
    </button>
  </div>;
}

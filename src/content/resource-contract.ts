export type Review = "PENDING" | "APPROVED" | "TEMPORARY_PENDING_ART_REVIEW";
export interface ImageAsset {
  id: string;
  path: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  alpha: boolean;
  type: "image/svg+xml" | "image/png" | "image/webp";
  purpose: string;
  version: string;
  review: Review;
  source: string;
}
export interface AudioAsset {
  id: string;
  text: string;
  path: string | null;
  bytes: number | null;
  sha256: string | null;
  review: Review;
  locale: string;
  version: string;
  source: string;
  type: "audio/mpeg" | "audio/wav" | "audio/ogg";
  durationMs: number | null;
}
const safePath = (p: string) =>
  /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(p) && !p.includes("..");
export function validateResources(
  images: ImageAsset[],
  audio: AudioAsset[],
  policy: "development" | "release" = "development",
) {
  const ids = new Set<string>();
  for (const a of [...images, ...audio]) {
    if (
      !a.id ||
      ids.has(a.id) ||
      !a.version ||
      !a.source ||
      !["PENDING", "APPROVED", "TEMPORARY_PENDING_ART_REVIEW"].includes(
        a.review,
      )
    )
      throw new Error("资源身份或来源无效");
    ids.add(a.id);
    if (
      a.path !== null &&
      (!safePath(a.path) ||
        !Number.isSafeInteger(a.bytes) ||
        a.bytes! <= 0 ||
        !/^[a-f0-9]{64}$/.test(a.sha256 ?? ""))
    )
      throw new Error(`资源路径/大小/哈希无效 ${a.id}`);
    if (policy === "release" && (!a.path || a.review !== "APPROVED"))
      throw new Error(`发布资源缺失或未审核 ${a.id}`);
  }
  for (const a of images) {
    const ext = {
      "image/svg+xml": ".svg",
      "image/png": ".png",
      "image/webp": ".webp",
    }[a.type];
    if (
      !ext ||
      !a.path.endsWith(ext) ||
      !Number.isInteger(a.width) ||
      !Number.isInteger(a.height) ||
      a.width < 1 ||
      a.height < 1 ||
      typeof a.alpha !== "boolean"
    )
      throw new Error(`图片元数据无效 ${a.id}`);
  }
  for (const a of audio) {
    const ext = {
      "audio/mpeg": ".mp3",
      "audio/wav": ".wav",
      "audio/ogg": ".ogg",
    }[a.type];
    if (
      !ext ||
      !a.text ||
      !a.locale ||
      (a.path &&
        (!a.path.endsWith(ext) || !a.durationMs || !Number.isFinite(a.durationMs) || a.durationMs <= 0)) ||
      (!a.path &&
        (a.bytes !== null || a.sha256 !== null || a.durationMs !== null))
    )
      throw new Error(`录音元数据无效 ${a.id}`);
  }
}
export function matchesFormat(
  data: Uint8Array,
  type: ImageAsset["type"] | AudioAsset["type"],
): boolean {
  const text = new TextDecoder().decode(data.slice(0, 512));
  switch (type) {
    case "image/svg+xml":
      return (
        /<svg[\s>]/.test(text) &&
        !/<script|<foreignObject/i.test(new TextDecoder().decode(data))
      );
    case "image/png":
      return [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => data[i] === b);
    case "image/webp":
      return text.startsWith("RIFF") && text.slice(8, 12) === "WEBP";
    case "audio/mpeg":
      return (
        text.startsWith("ID3") || (data[0] === 255 && (data[1] & 224) === 224)
      );
    case "audio/wav":
      return text.startsWith("RIFF") && text.slice(8, 12) === "WAVE";
    case "audio/ogg":
      return text.startsWith("OggS");
  }
}

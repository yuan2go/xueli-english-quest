export type AudioStatus =
  "loading" | "playing" | "completed" | "failed" | "cancelled" | "muted";
export type AudioSource = "recording" | "development-speech" | "unavailable";
export interface AudioObservation {
  requestId: string;
  assetId: string;
  version: string;
  stepId: string;
  purpose: "task" | "success";
  eventId: string;
  status: AudioStatus;
  source: AudioSource;
}
export const audioStatuses: string[] = [
  "loading",
  "playing",
  "completed",
  "failed",
  "cancelled",
  "muted",
];

import { AUDIO } from "../content/manifest.ts";
/** Browser speech is explicitly a development substitute, never reviewed phonics. */
export class StoryAudio {
  volume = 0.8;
  muted = false;
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private unlocked = false;
  private element?: HTMLAudioElement;
  unlock() {
    this.unlocked = true;
  }
  stop() {
    this.generation++;
    clearTimeout(this.timer);
    this.element?.pause();
    this.element = undefined;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  play(text: string, report: (message: string) => void) {
    this.stop();
    if (this.muted || this.volume === 0) {
      report("当前已静音，可调高音量或使用文字辅助。");
      return;
    }
    const asset = AUDIO.find((a) => a.text === text);
    if (!asset) {
      report("任务语音未登记，请使用文字辅助。");
      return;
    }
    if (asset.path) {
      const token = this.generation;
      const element = new Audio(`${import.meta.env.BASE_URL}${asset.path}`);
      this.element = element;
      element.volume = this.volume;
      const failed = () => {
        if (token === this.generation)
          report("语音播放失败，请重试或使用文字辅助。");
      };
      element.onerror = failed;
      element.onended = () => {
        if (token === this.generation) report("播放完成，可以重听。");
      };
      void element
        .play()
        .then(() => {
          if (token === this.generation)
            report(
              asset.review === "PENDING"
                ? "正在播放待审核语音"
                : "正在播放任务",
            );
        })
        .catch(failed);
      return;
    }
    if (!this.unlocked || !("speechSynthesis" in window)) {
      report("语音无法播放，请重试或使用文字辅助。");
      return;
    }
    const token = this.generation;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 0.8;
    speech.volume = this.volume;
    const settle = (message: string) => {
      if (token === this.generation) {
        clearTimeout(this.timer);
        report(message);
      }
    };
    speech.onstart = () => settle("正在播放开发语音（未审核）");
    speech.onend = () => settle("可以重听；开发语音未经教学审核。");
    speech.onerror = () => settle("语音播放失败，请重试或使用文字辅助。");
    this.timer = setTimeout(() => {
      if (token === this.generation) {
        this.stop();
        report("语音响应超时，请重试或使用文字辅助。");
      }
    }, 8000);
    try {
      window.speechSynthesis.speak(speech);
    } catch {
      settle("语音播放失败，请重试或使用文字辅助。");
    }
  }
}

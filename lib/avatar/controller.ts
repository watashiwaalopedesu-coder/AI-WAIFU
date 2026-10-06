import type { Activity, Character, Emotion } from "@/types/companion";
export type AvatarState = {
  activity: Activity;
  emotion: Emotion;
  mouth: number;
  blink: boolean;
};
export interface AvatarController {
  update(state: Partial<AvatarState>): void;
  snapshot(): AvatarState;
  frame(character: Character): number;
}
export class SpriteAvatarController implements AvatarController {
  private state: AvatarState = {
    activity: "idle",
    emotion: "neutral",
    mouth: 0,
    blink: false,
  };
  update(state: Partial<AvatarState>) {
    this.state = { ...this.state, ...state };
  }
  snapshot() {
    return { ...this.state };
  }
  frame(c: Character) {
    if (this.state.blink && this.state.activity !== "speaking") return 4;
    if (
      this.state.activity === "speaking" &&
      this.state.mouth > c.lipSync.threshold
    )
      return 1;
    return c.expressionMap[this.state.emotion];
  }
}
export interface EmotionProvider {
  infer(text: string): Emotion;
}
export const emotionProvider: EmotionProvider = {
  infer(text) {
    if (/sorry|sad|hurt|difficult|lonely/i.test(text)) return "sad";
    if (/wow|surpris|amazing|incredible/i.test(text)) return "surprised";
    if (/shy|blush|embarrass|nervous/i.test(text)) return "shy";
    if (/happy|love|glad|wonderful|great|thank|excited/i.test(text))
      return "happy";
    if (/error|careful|warning|problem/i.test(text)) return "serious";
    return "neutral";
  },
};

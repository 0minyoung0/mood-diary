import type { Mood, MoodConfigMap } from "../types";

export const MOOD_CONFIG: MoodConfigMap = {
  happy: { emoji: "😊", label: "기쁨", color: "#FFD93D" },
  sad: { emoji: "😢", label: "슬픔", color: "#6BCB77" },
  angry: { emoji: "😠", label: "화남", color: "#FF6B6B" },
  anxious: { emoji: "😰", label: "불안", color: "#9B59B6" },
  neutral: { emoji: "😐", label: "평온", color: "#A0A0A0" },
} as const;

export const MOOD_LIST: Mood[] = [
  "happy",
  "sad",
  "angry",
  "anxious",
  "neutral",
];

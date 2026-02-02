export type Mood = "happy" | "sad" | "angry" | "anxious" | "neutral";

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood: Mood;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface MoodConfig {
  emoji: string;
  label: string;
  color: string;
}

export type MoodConfigMap = Record<Mood, MoodConfig>;

export interface MoodStats {
  [key: string]: number;
  happy: number;
  sad: number;
  angry: number;
  anxious: number;
  neutral: number;
  total: number;
}

export type AIStatus = "idle" | "loading" | "ready" | "error" | "unsupported";

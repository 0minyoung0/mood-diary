import Dexie, { type Table } from "dexie";
import type { DiaryEntry } from "../types";

export class MoodDiaryDB extends Dexie {
  entries!: Table<DiaryEntry>;

  constructor() {
    super("mood-diary-db");
    this.version(1).stores({
      entries: "id, date, mood, createdAt",
    });
  }
}

export const db = new MoodDiaryDB();

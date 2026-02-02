import { v4 as uuidv4 } from "uuid";
import { db } from "../db/database";
import type { DiaryEntry, Mood, MoodStats } from "../types";

export const diaryService = {
  async create(
    entry: Omit<DiaryEntry, "id" | "createdAt" | "updatedAt">,
  ): Promise<DiaryEntry> {
    const now = new Date().toISOString();
    const newEntry: DiaryEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await db.entries.add(newEntry);
    return newEntry;
  },

  async getById(id: string): Promise<DiaryEntry | undefined> {
    return db.entries.get(id);
  },

  async getByDate(date: string): Promise<DiaryEntry | undefined> {
    return db.entries.where("date").equals(date).first();
  },

  async update(
    id: string,
    updates: Partial<Omit<DiaryEntry, "id" | "createdAt">>,
  ): Promise<void> {
    await db.entries.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.entries.delete(id);
  },

  async getAll(): Promise<DiaryEntry[]> {
    return db.entries.orderBy("createdAt").reverse().toArray();
  },

  async getByMonth(year: number, month: number): Promise<DiaryEntry[]> {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

    return db.entries
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async search(keyword: string): Promise<DiaryEntry[]> {
    const allEntries = await db.entries.toArray();
    return allEntries.filter((entry) =>
      entry.content.toLowerCase().includes(keyword.toLowerCase()),
    );
  },

  async getMoodStats(year: number, month: number): Promise<MoodStats> {
    const entries = await this.getByMonth(year, month);

    const stats: MoodStats = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      neutral: 0,
      total: entries.length,
    };

    entries.forEach((entry) => {
      stats[entry.mood as Mood]++;
    });

    return stats;
  },
};

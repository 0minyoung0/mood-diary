import { describe, it, expect, beforeEach } from "vitest";
import { diaryService } from "./diaryService";
import { db } from "../db/database";

describe("diaryService", () => {
  beforeEach(async () => {
    await db.entries.clear();
  });

  describe("create", () => {
    it("새 일기를 생성한다", async () => {
      const entry = await diaryService.create({
        date: "2024-01-15",
        content: "오늘은 좋은 하루였다.",
        mood: "happy",
      });

      expect(entry.id).toBeDefined();
      expect(entry.date).toBe("2024-01-15");
      expect(entry.content).toBe("오늘은 좋은 하루였다.");
      expect(entry.mood).toBe("happy");
      expect(entry.createdAt).toBeDefined();
      expect(entry.updatedAt).toBeDefined();
    });
  });

  describe("getById", () => {
    it("ID로 일기를 조회한다", async () => {
      const created = await diaryService.create({
        date: "2024-01-15",
        content: "테스트 일기",
        mood: "neutral",
      });

      const found = await diaryService.getById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it("존재하지 않는 ID는 undefined를 반환한다", async () => {
      const found = await diaryService.getById("non-existent-id");

      expect(found).toBeUndefined();
    });
  });

  describe("getByDate", () => {
    it("날짜로 일기를 조회한다", async () => {
      await diaryService.create({
        date: "2024-01-15",
        content: "테스트 일기",
        mood: "happy",
      });

      const found = await diaryService.getByDate("2024-01-15");

      expect(found).toBeDefined();
      expect(found?.date).toBe("2024-01-15");
    });
  });

  describe("update", () => {
    it("일기 내용과 감정을 수정한다", async () => {
      const created = await diaryService.create({
        date: "2024-01-15",
        content: "원본 내용",
        mood: "neutral",
      });

      await diaryService.update(created.id, {
        content: "수정된 내용",
        mood: "happy",
      });

      const updated = await diaryService.getById(created.id);

      expect(updated?.content).toBe("수정된 내용");
      expect(updated?.mood).toBe("happy");
      expect(updated?.updatedAt).toBeDefined();
    });
  });

  describe("delete", () => {
    it("일기를 삭제한다", async () => {
      const created = await diaryService.create({
        date: "2024-01-15",
        content: "삭제될 일기",
        mood: "sad",
      });

      await diaryService.delete(created.id);

      const found = await diaryService.getById(created.id);
      expect(found).toBeUndefined();
    });
  });

  describe("getAll", () => {
    it("모든 일기를 조회한다", async () => {
      await diaryService.create({
        date: "2024-01-14",
        content: "첫 번째 일기",
        mood: "happy",
      });
      await diaryService.create({
        date: "2024-01-15",
        content: "두 번째 일기",
        mood: "sad",
      });

      const entries = await diaryService.getAll();

      expect(entries).toHaveLength(2);
    });
  });

  describe("getMoodStats", () => {
    it("월별 감정 통계를 계산한다", async () => {
      await diaryService.create({
        date: "2024-01-10",
        content: "기쁜 날",
        mood: "happy",
      });
      await diaryService.create({
        date: "2024-01-15",
        content: "또 기쁜 날",
        mood: "happy",
      });
      await diaryService.create({
        date: "2024-01-20",
        content: "슬픈 날",
        mood: "sad",
      });

      const stats = await diaryService.getMoodStats(2024, 1);

      expect(stats.total).toBe(3);
      expect(stats.happy).toBe(2);
      expect(stats.sad).toBe(1);
      expect(stats.angry).toBe(0);
      expect(stats.anxious).toBe(0);
      expect(stats.neutral).toBe(0);
    });
  });

  describe("search", () => {
    it("키워드로 일기를 검색한다", async () => {
      await diaryService.create({
        date: "2024-01-10",
        content: "오늘 맛있는 피자를 먹었다",
        mood: "happy",
      });
      await diaryService.create({
        date: "2024-01-11",
        content: "오늘은 운동을 했다",
        mood: "neutral",
      });

      const results = await diaryService.search("피자");

      expect(results).toHaveLength(1);
      expect(results[0].content).toContain("피자");
    });

    it("TC-009-2: 검색 결과가 없으면 빈 배열을 반환한다", async () => {
      await diaryService.create({
        date: "2024-01-10",
        content: "오늘 맛있는 피자를 먹었다",
        mood: "happy",
      });

      const results = await diaryService.search("존재하지않는키워드");

      expect(results).toHaveLength(0);
    });

    it("대소문자 구분 없이 검색한다", async () => {
      await diaryService.create({
        date: "2024-01-10",
        content: "Today was a HAPPY day",
        mood: "happy",
      });

      const results = await diaryService.search("happy");

      expect(results).toHaveLength(1);
    });
  });

  // 엣지 케이스 테스트 (TC-EDGE)
  describe("Edge Cases", () => {
    describe("TC-EDGE-001: 특수 문자 입력", () => {
      it("HTML 태그가 포함된 내용을 저장할 수 있다", async () => {
        const entry = await diaryService.create({
          date: "2024-01-15",
          content: "<script>alert('xss')</script>",
          mood: "neutral",
        });

        const found = await diaryService.getById(entry.id);
        expect(found?.content).toBe("<script>alert('xss')</script>");
      });

      it("SQL 인젝션 시도 문자열을 저장할 수 있다", async () => {
        const entry = await diaryService.create({
          date: "2024-01-15",
          content: "'; DROP TABLE entries; --",
          mood: "neutral",
        });

        const found = await diaryService.getById(entry.id);
        expect(found?.content).toBe("'; DROP TABLE entries; --");
      });

      it("특수 문자가 포함된 내용을 저장할 수 있다", async () => {
        const entry = await diaryService.create({
          date: "2024-01-15",
          content: "!@#$%^&*()_+-=[]{}|;':\",./<>?",
          mood: "neutral",
        });

        const found = await diaryService.getById(entry.id);
        expect(found?.content).toBe("!@#$%^&*()_+-=[]{}|;':\",./<>?");
      });
    });

    describe("TC-EDGE-002: 이모지 입력", () => {
      it("이모지가 포함된 내용을 저장할 수 있다", async () => {
        const entry = await diaryService.create({
          date: "2024-01-15",
          content: "오늘 기분 최고! 🎉🎊😊🥳",
          mood: "happy",
        });

        const found = await diaryService.getById(entry.id);
        expect(found?.content).toBe("오늘 기분 최고! 🎉🎊😊🥳");
      });

      it("다양한 이모지를 검색할 수 있다", async () => {
        await diaryService.create({
          date: "2024-01-15",
          content: "파티 🎉 했다",
          mood: "happy",
        });

        const results = await diaryService.search("🎉");
        expect(results).toHaveLength(1);
      });
    });

    describe("TC-EDGE-004: 동일 날짜 중복 작성", () => {
      it("같은 날짜에 여러 일기를 저장할 수 있다", async () => {
        await diaryService.create({
          date: "2024-01-15",
          content: "첫 번째 일기",
          mood: "happy",
        });

        await diaryService.create({
          date: "2024-01-15",
          content: "두 번째 일기",
          mood: "sad",
        });

        const entries = await diaryService.getAll();
        const sameDay = entries.filter((e) => e.date === "2024-01-15");

        expect(sameDay).toHaveLength(2);
      });

      it("getByDate는 하나의 결과만 반환한다", async () => {
        await diaryService.create({
          date: "2024-01-15",
          content: "첫 번째 일기",
          mood: "happy",
        });

        await diaryService.create({
          date: "2024-01-15",
          content: "두 번째 일기",
          mood: "sad",
        });

        const found = await diaryService.getByDate("2024-01-15");

        // 하나의 결과만 반환됨 (배열이 아님)
        expect(found).toBeDefined();
        expect(found?.date).toBe("2024-01-15");
      });
    });

    describe("빈 데이터 처리", () => {
      it("일기가 없을 때 getAll은 빈 배열을 반환한다", async () => {
        const entries = await diaryService.getAll();
        expect(entries).toHaveLength(0);
      });

      it("일기가 없을 때 getMoodStats는 모두 0을 반환한다", async () => {
        const stats = await diaryService.getMoodStats(2024, 1);

        expect(stats.total).toBe(0);
        expect(stats.happy).toBe(0);
        expect(stats.sad).toBe(0);
        expect(stats.angry).toBe(0);
        expect(stats.anxious).toBe(0);
        expect(stats.neutral).toBe(0);
      });

      it("해당 월에 일기가 없을 때 getByMonth는 빈 배열을 반환한다", async () => {
        await diaryService.create({
          date: "2024-01-15",
          content: "1월 일기",
          mood: "happy",
        });

        const entries = await diaryService.getByMonth(2024, 2);
        expect(entries).toHaveLength(0);
      });
    });

    describe("긴 내용 처리", () => {
      it("5000자 내용을 저장할 수 있다", async () => {
        const longContent = "a".repeat(5000);
        const entry = await diaryService.create({
          date: "2024-01-15",
          content: longContent,
          mood: "neutral",
        });

        const found = await diaryService.getById(entry.id);
        expect(found?.content).toHaveLength(5000);
      });
    });

    describe("날짜 경계 처리", () => {
      it("월 경계의 날짜를 올바르게 처리한다", async () => {
        await diaryService.create({
          date: "2024-01-31",
          content: "1월 마지막 날",
          mood: "happy",
        });

        await diaryService.create({
          date: "2024-02-01",
          content: "2월 첫째 날",
          mood: "sad",
        });

        const janEntries = await diaryService.getByMonth(2024, 1);
        const febEntries = await diaryService.getByMonth(2024, 2);

        expect(janEntries).toHaveLength(1);
        expect(janEntries[0].date).toBe("2024-01-31");
        expect(febEntries).toHaveLength(1);
        expect(febEntries[0].date).toBe("2024-02-01");
      });
    });
  });
});

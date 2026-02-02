import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock 엔진 객체
const mockCreate = vi.fn();
const mockReload = vi.fn();
const mockUnload = vi.fn();

// WebLLM 모킹
vi.mock("@mlc-ai/web-llm", () => {
  return {
    MLCEngine: class MockMLCEngine {
      constructor(config?: { initProgressCallback?: (report: { progress: number; text: string }) => void }) {
        if (config?.initProgressCallback) {
          // 초기화 콜백 저장
          (MockMLCEngine as unknown as { _callback: typeof config.initProgressCallback })._callback = config.initProgressCallback;
        }
      }
      reload = mockReload;
      unload = mockUnload;
      chat = {
        completions: {
          create: mockCreate,
        },
      };

      static _callback?: (report: { progress: number; text: string }) => void;
      static triggerProgress(progress: number, text: string) {
        if (MockMLCEngine._callback) {
          MockMLCEngine._callback({ progress, text });
        }
      }
    },
  };
});

describe("aiService", () => {
  let aiService: typeof import("./aiService").aiService;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    mockReload.mockResolvedValue(undefined);

    // 모듈 재로드
    const module = await import("./aiService");
    aiService = module.aiService;
  });

  describe("initialize (TC-001)", () => {
    it("TC-001-1: 모델을 초기화한다", async () => {
      const onProgress = vi.fn();

      await aiService.initialize(onProgress);

      expect(mockReload).toHaveBeenCalledWith("Llama-3.2-1B-Instruct-q4f32_1-MLC");
    });

    it("TC-001-2: 이미 초기화된 경우 재초기화하지 않는다", async () => {
      const onProgress = vi.fn();

      await aiService.initialize(onProgress);
      await aiService.initialize(onProgress);

      // reload는 한 번만 호출되어야 함
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  describe("isReady", () => {
    it("초기화 전에는 false를 반환한다", () => {
      expect(aiService.isReady()).toBe(false);
    });

    it("초기화 후에는 true를 반환한다", async () => {
      await aiService.initialize(vi.fn());

      expect(aiService.isReady()).toBe(true);
    });
  });

  describe("classifyMood (TC-003)", () => {
    const setupMockResponse = (content: string) => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content } }],
      });
    };

    it("TC-003-1: 기쁨 감정을 분류한다", async () => {
      setupMockResponse('{"mood": "happy"}');
      await aiService.initialize(vi.fn());

      const result = await aiService.classifyMood("승진 소식을 들었다! 너무 기쁘고 행복하다");

      expect(result).toBe("happy");
    });

    it("TC-003-2: 슬픔 감정을 분류한다", async () => {
      setupMockResponse('{"mood": "sad"}');
      await aiService.initialize(vi.fn());

      const result = await aiService.classifyMood("오랜 친구와 이별했다. 마음이 너무 아프다");

      expect(result).toBe("sad");
    });

    it("TC-003-3: 화남 감정을 분류한다", async () => {
      setupMockResponse('{"mood": "angry"}');
      await aiService.initialize(vi.fn());

      const result = await aiService.classifyMood("상사가 부당한 요구를 했다. 정말 화가 난다");

      expect(result).toBe("angry");
    });

    it("TC-003-4: 불안 감정을 분류한다", async () => {
      setupMockResponse('{"mood": "anxious"}');
      await aiService.initialize(vi.fn());

      const result = await aiService.classifyMood("내일 면접이 있다. 떨리고 걱정된다");

      expect(result).toBe("anxious");
    });

    it("TC-003-5: 평온 감정을 분류한다", async () => {
      setupMockResponse('{"mood": "neutral"}');
      await aiService.initialize(vi.fn());

      const result = await aiService.classifyMood("평범한 하루였다. 출근하고 퇴근했다");

      expect(result).toBe("neutral");
    });

    it("TC-003-7: 파싱 실패 시 neutral을 반환한다", async () => {
      setupMockResponse("잘못된 응답 형식");
      await aiService.initialize(vi.fn());

      const result = await aiService.classifyMood("테스트 일기");

      expect(result).toBe("neutral");
    });

    it("TC-003-7: 유효하지 않은 감정값이면 neutral을 반환한다", async () => {
      setupMockResponse('{"mood": "invalid_mood"}');
      await aiService.initialize(vi.fn());

      const result = await aiService.classifyMood("테스트 일기");

      expect(result).toBe("neutral");
    });

    it("TC-003-7: API 오류 시 neutral을 반환한다", async () => {
      mockCreate.mockRejectedValue(new Error("API Error"));
      await aiService.initialize(vi.fn());

      const result = await aiService.classifyMood("테스트 일기");

      expect(result).toBe("neutral");
    });

    it("TC-003-7: 빈 응답이면 neutral을 반환한다", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "" } }],
      });
      await aiService.initialize(vi.fn());

      const result = await aiService.classifyMood("테스트 일기");

      expect(result).toBe("neutral");
    });

    it("모델이 초기화되지 않은 상태에서 호출하면 에러를 던진다", async () => {
      await expect(aiService.classifyMood("테스트")).rejects.toThrow(
        "AI 모델이 초기화되지 않았습니다."
      );
    });

    it("올바른 프롬프트 형식으로 API를 호출한다", async () => {
      setupMockResponse('{"mood": "happy"}');
      await aiService.initialize(vi.fn());

      await aiService.classifyMood("테스트 일기 내용");

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
            expect.objectContaining({ role: "user", content: "테스트 일기 내용" }),
          ]),
          temperature: 0.1,
          max_tokens: 50,
        })
      );
    });
  });

  describe("dispose", () => {
    it("엔진을 정리한다", async () => {
      await aiService.initialize(vi.fn());

      aiService.dispose();

      expect(mockUnload).toHaveBeenCalled();
    });

    it("dispose 후 isReady가 false가 된다", async () => {
      await aiService.initialize(vi.fn());
      expect(aiService.isReady()).toBe(true);

      aiService.dispose();

      expect(aiService.isReady()).toBe(false);
    });

    it("초기화되지 않은 상태에서 dispose 호출해도 에러 없음", () => {
      expect(() => aiService.dispose()).not.toThrow();
    });
  });
});

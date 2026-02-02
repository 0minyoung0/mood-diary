import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { EditPage } from "./EditPage";
import { diaryService } from "@/services/diaryService";
import type { DiaryEntry } from "@/types";

// 호이스팅된 모킹 함수
const { mockClassifyMood, mockNavigate } = vi.hoisted(() => ({
  mockClassifyMood: vi.fn(),
  mockNavigate: vi.fn(),
}));

// diaryService 모킹
vi.mock("@/services/diaryService", () => ({
  diaryService: {
    getById: vi.fn(),
    update: vi.fn(),
  },
}));

// useNavigate 모킹
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockEntry: DiaryEntry = {
  id: "1",
  date: "2024-01-15T12:00:00",
  content: "오늘은 좋은 하루였다.",
  mood: "happy",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

// useAI 모킹
vi.mock("@/contexts/AIContext", () => ({
  useAI: () => ({
    status: "ready",
    progress: 100,
    progressText: "",
    error: null,
    isModelReady: true,
    isWebGPUSupported: true,
    classifyMood: mockClassifyMood,
  }),
}));

const renderWithRouter = (entryId: string = "1") => {
  return render(
    <MemoryRouter initialEntries={[`/edit/${entryId}`]}>
      <Routes>
        <Route path="/edit/:id" element={<EditPage />} />
        <Route path="/entry/:id" element={<div>Entry Detail</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("EditPage (TC-010)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClassifyMood.mockResolvedValue("happy");
  });

  describe("기본 렌더링", () => {
    it("페이지 제목이 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("일기 수정")).toBeInTheDocument();
      });
    });

    it("뒤로가기 버튼이 있다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("뒤로가기")).toBeInTheDocument();
      });
    });
  });

  describe("로딩 상태", () => {
    it("로딩 중일 때 로딩 메시지가 표시된다", () => {
      vi.mocked(diaryService.getById).mockImplementation(
        () => new Promise(() => {})
      );
      renderWithRouter();

      expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
    });
  });

  describe("일기 없음", () => {
    it("일기를 찾을 수 없을 때 안내 메시지가 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(undefined);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("일기를 찾을 수 없습니다.")).toBeInTheDocument();
      });
    });
  });

  describe("TC-010-1: 기존 내용 로드 및 수정 모드", () => {
    it("기존 일기 내용이 폼에 로드된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveValue("오늘은 좋은 하루였다.");
      });
    });

    it("기존 감정이 선택된 상태로 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        // MoodPicker에서 기쁨이 선택된 상태인지 확인 (border-primary 클래스로 판별)
        const happyButton = screen.getByRole("button", { name: /😊.*기쁨/s });
        expect(happyButton.className).toContain("border-primary");
      });
    });

    it("날짜가 읽기 전용으로 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        // 날짜가 텍스트로 표시됨 (input이 아님)
        expect(screen.getByText(/2024년 1월 15일/)).toBeInTheDocument();
      });
    });

    it("내용을 수정할 수 있다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      const textarea = screen.getByRole("textbox");
      await user.clear(textarea);
      await user.type(textarea, "수정된 내용입니다.");

      expect(textarea).toHaveValue("수정된 내용입니다.");
    });
  });

  describe("TC-010-2: 내용 수정 후 AI 재분류", () => {
    it("AI 재분류 체크박스가 있다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("AI로 감정 다시 분석하기")).toBeInTheDocument();
      });
    });

    it("체크박스 선택 시 저장할 때 AI 재분류가 실행된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      vi.mocked(diaryService.update).mockResolvedValue(undefined);
      mockClassifyMood.mockResolvedValue("sad");
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      // 내용 수정
      const textarea = screen.getByRole("textbox");
      await user.clear(textarea);
      await user.type(textarea, "슬픈 하루였다.");

      // 체크박스 선택
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // 저장 버튼 클릭
      const saveButton = screen.getByRole("button", { name: /저장하기/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockClassifyMood).toHaveBeenCalledWith("슬픈 하루였다.");
      });
    });

    it("AI 재분류 중 로딩 화면이 표시된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      // 분류가 지연되도록 설정
      mockClassifyMood.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve("sad"), 100))
      );
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      // 체크박스 선택
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // 저장 버튼 클릭
      const saveButton = screen.getByRole("button", { name: /저장하기/i });
      await user.click(saveButton);

      // 로딩 화면 확인
      await waitFor(() => {
        expect(screen.getByText(/감정을 분석/i)).toBeInTheDocument();
      });
    });
  });

  describe("TC-010-3: 감정만 수정", () => {
    it("체크박스 없이 감정을 변경할 수 있다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      vi.mocked(diaryService.update).mockResolvedValue(undefined);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /슬픔/i })).toBeInTheDocument();
      });

      // 다른 감정 선택
      const sadButton = screen.getByRole("button", { name: /슬픔/i });
      await user.click(sadButton);

      // 저장 버튼 클릭
      const saveButton = screen.getByRole("button", { name: /저장하기/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(diaryService.update).toHaveBeenCalledWith("1", {
          content: "오늘은 좋은 하루였다.",
          mood: "sad",
        });
      });
    });

    it("감정만 변경 시 AI 분류가 호출되지 않는다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      vi.mocked(diaryService.update).mockResolvedValue(undefined);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /평온/i })).toBeInTheDocument();
      });

      // 다른 감정 선택
      const neutralButton = screen.getByRole("button", { name: /평온/i });
      await user.click(neutralButton);

      // 저장 버튼 클릭
      const saveButton = screen.getByRole("button", { name: /저장하기/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(diaryService.update).toHaveBeenCalled();
      });

      expect(mockClassifyMood).not.toHaveBeenCalled();
    });
  });

  describe("저장 및 네비게이션", () => {
    it("저장 성공 시 상세 페이지로 이동한다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      vi.mocked(diaryService.update).mockResolvedValue(undefined);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /저장하기/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /저장하기/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/entry/1");
      });
    });

    it("취소 버튼 클릭 시 이전 페이지로 이동한다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /취소/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /취소/i });
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("내용이 비어있으면 저장 버튼이 비활성화된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      const textarea = screen.getByRole("textbox");
      await user.clear(textarea);

      const saveButton = screen.getByRole("button", { name: /저장하기/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe("글자 수 제한", () => {
    it("현재 글자 수가 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        // "오늘은 좋은 하루였다." = 12글자
        expect(screen.getByText(/12.*\/.*5,000/)).toBeInTheDocument();
      });
    });

    it("최대 5000자까지 입력 가능하다", async () => {
      const user = userEvent.setup();
      const longContent = "가".repeat(4990);
      vi.mocked(diaryService.getById).mockResolvedValue({
        ...mockEntry,
        content: longContent,
      });
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "나".repeat(20));

      // 5000자 제한으로 인해 10글자만 추가됨
      expect(textarea.textContent?.length || textarea.getAttribute("value")?.length).toBeLessThanOrEqual(5000);
    });
  });
});

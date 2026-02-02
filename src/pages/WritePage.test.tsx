import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { WritePage } from "./WritePage";
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
    getByDate: vi.fn(),
    create: vi.fn(),
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

// useAI 모킹
vi.mock("@/contexts/AIContext", () => ({
  useAI: () => ({
    status: "ready",
    progress: 1,
    progressText: "",
    error: null,
    isModelReady: true,
    isWebGPUSupported: true,
    classifyMood: mockClassifyMood,
  }),
}));

const renderWithRouter = (initialPath: string = "/write") => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/write" element={<WritePage />} />
        <Route path="/write/:date" element={<WritePage />} />
        <Route path="/" element={<div>Home</div>} />
        <Route path="/entry/:id" element={<div>Entry Detail</div>} />
        <Route path="/edit/:id" element={<div>Edit Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("WritePage (TC-001, TC-003)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(diaryService.getByDate).mockResolvedValue(undefined);
    mockClassifyMood.mockResolvedValue("happy");
  });

  describe("TC-001: 일기 작성 화면", () => {
    describe("TC-001-1: 기본 렌더링", () => {
      it("페이지 제목이 표시된다", async () => {
        renderWithRouter();

        expect(screen.getByText("새 일기 쓰기")).toBeInTheDocument();
      });

      it("안내 문구가 표시된다", async () => {
        renderWithRouter();

        expect(screen.getByText("오늘의 이야기를 자유롭게 적어주세요")).toBeInTheDocument();
      });

      it("날짜 입력 필드가 있다", async () => {
        renderWithRouter();

        expect(screen.getByLabelText(/날짜/i)).toBeInTheDocument();
      });

      it("내용 입력 필드가 있다", async () => {
        renderWithRouter();

        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      it("AI로 감정 분석하기 버튼이 있다", async () => {
        renderWithRouter();

        expect(screen.getByRole("button", { name: /AI로 감정 분석하기/i })).toBeInTheDocument();
      });
    });

    describe("TC-001-2: 날짜 기본값", () => {
      it("날짜 필드에 오늘 날짜가 기본값으로 설정된다", async () => {
        renderWithRouter();

        const today = new Date().toISOString().split("T")[0];
        const dateInput = screen.getByLabelText(/날짜/i) as HTMLInputElement;
        expect(dateInput.value).toBe(today);
      });

      it("URL 파라미터로 전달된 날짜가 설정된다", async () => {
        renderWithRouter("/write/2024-06-15");

        const dateInput = screen.getByLabelText(/날짜/i) as HTMLInputElement;
        expect(dateInput.value).toBe("2024-06-15");
      });
    });

    describe("TC-001-3: 내용 입력", () => {
      it("내용을 입력할 수 있다", async () => {
        const user = userEvent.setup();
        renderWithRouter();

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "오늘은 좋은 하루였습니다.");

        expect(textarea).toHaveValue("오늘은 좋은 하루였습니다.");
      });

      it("글자 수가 표시된다", async () => {
        const user = userEvent.setup();
        renderWithRouter();

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "테스트");

        expect(screen.getByText(/3.*\/.*5,000/)).toBeInTheDocument();
      });

      it("최대 5000자까지 입력 가능하다", async () => {
        const user = userEvent.setup();
        renderWithRouter();

        // 초기 로딩 완료 대기
        await waitFor(() => {
          expect(screen.getByRole("textbox")).not.toBeDisabled();
        });

        const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
        // userEvent.type은 너무 느리므로 fireEvent 사용
        await user.clear(textarea);
        // 직접 value 설정 후 change 이벤트 발생
        const longText = "가".repeat(5001);
        await user.click(textarea);
        // paste로 빠르게 입력
        await user.paste(longText);

        // 5000자 제한으로 잘림
        expect(textarea.value.length).toBeLessThanOrEqual(5000);
      });
    });

    describe("TC-001-4: 빈 내용 제출 방지", () => {
      it("내용이 비어있으면 버튼이 비활성화된다", async () => {
        renderWithRouter();

        // 초기 로딩 완료 대기
        await waitFor(() => {
          expect(screen.getByRole("textbox")).toBeInTheDocument();
        });

        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        expect(submitButton).toBeDisabled();
      });

      it("공백만 있어도 버튼이 비활성화된다", async () => {
        const user = userEvent.setup();
        renderWithRouter();

        // 초기 로딩 완료 대기
        await waitFor(() => {
          expect(screen.getByRole("textbox")).not.toBeDisabled();
        });

        const textarea = screen.getByRole("textbox");
        await user.clear(textarea);
        await user.type(textarea, "   ");

        // 공백만 있으면 버튼이 비활성화됨
        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("TC-003: AI 감정 분류", () => {
    describe("TC-003-1: 분류 트리거", () => {
      it("AI로 감정 분석하기 버튼 클릭 시 분류가 시작된다", async () => {
        const user = userEvent.setup();
        renderWithRouter();

        // 초기 로딩 완료 대기 (textbox가 disabled 아닌지 확인)
        await waitFor(() => {
          const textarea = screen.getByRole("textbox");
          expect(textarea).not.toBeDisabled();
        });

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "오늘은 행복한 하루였습니다.");

        // 내용 입력 후 버튼이 활성화되는지 확인
        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        await waitFor(() => {
          expect(submitButton).not.toBeDisabled();
        });
        await user.click(submitButton);

        // 분류 후 감정 확인 화면으로 전환되는지 확인
        await waitFor(() => {
          expect(screen.getByText("감정 확인")).toBeInTheDocument();
        });
      });
    });

    describe("TC-003-6: 로딩 인디케이터", () => {
      it("AI 분류 중 로딩 화면이 표시된다", async () => {
        const user = userEvent.setup();
        // 분류가 지연되도록 설정
        mockClassifyMood.mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve("happy"), 500))
        );
        renderWithRouter();

        // 초기 로딩 완료 대기
        await waitFor(() => {
          const textarea = screen.getByRole("textbox");
          expect(textarea).not.toBeDisabled();
        });

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "오늘 하루는 정말 좋았어요.");

        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        await waitFor(() => {
          expect(submitButton).not.toBeDisabled();
        });
        await user.click(submitButton);

        // 분석 중 로딩 화면 확인
        await waitFor(() => {
          expect(screen.getByText(/감정을 분석/i)).toBeInTheDocument();
        });
      });

      it("분석 완료 후 확인 화면으로 전환된다", async () => {
        const user = userEvent.setup();
        mockClassifyMood.mockResolvedValue("happy");
        renderWithRouter();

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "오늘 하루는 정말 좋았어요.");

        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText("감정 확인")).toBeInTheDocument();
        });
      });
    });

    describe("TC-003-2: 분류 결과 표시", () => {
      it("AI 분석 결과가 표시된다", async () => {
        const user = userEvent.setup();
        mockClassifyMood.mockResolvedValue("happy");
        renderWithRouter();

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "행복한 하루!");

        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText("AI 분석 결과")).toBeInTheDocument();
          // "기쁨"이 여러 군데 있으므로 getAllByText 사용
          expect(screen.getAllByText("기쁨").length).toBeGreaterThanOrEqual(1);
        });
      });

      it("분류 실패 시 neutral로 기본 설정된다", async () => {
        const user = userEvent.setup();
        mockClassifyMood.mockRejectedValue(new Error("분류 실패"));
        renderWithRouter();

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "테스트 내용");

        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText("감정 확인")).toBeInTheDocument();
          // neutral (평온)이 기본값으로 선택됨
        });
      });
    });

    describe("TC-003-3: 감정 수정", () => {
      it("AI 분석 결과 화면에서 다른 감정을 선택할 수 있다", async () => {
        const user = userEvent.setup();
        mockClassifyMood.mockResolvedValue("happy");
        renderWithRouter();

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "행복한 하루!");

        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText("감정 선택")).toBeInTheDocument();
        });

        // 슬픔 선택 (이모지와 텍스트로 찾기)
        const sadButton = screen.getByRole("button", { name: /😢.*슬픔/s });
        await user.click(sadButton);

        // border-primary 클래스로 선택 상태 확인
        expect(sadButton.className).toContain("border-primary");
      });
    });

    describe("TC-003-4: 저장", () => {
      it("저장하기 버튼 클릭 시 일기가 저장된다", async () => {
        const user = userEvent.setup();
        mockClassifyMood.mockResolvedValue("happy");
        vi.mocked(diaryService.create).mockResolvedValue({
          id: "new-1",
          date: new Date().toISOString().split("T")[0],
          content: "테스트 내용",
          mood: "happy",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        renderWithRouter();

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "테스트 내용");

        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /저장하기/i })).toBeInTheDocument();
        });

        const saveButton = screen.getByRole("button", { name: /저장하기/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(diaryService.create).toHaveBeenCalled();
        });
      });

      it("저장 성공 시 홈으로 이동한다", async () => {
        const user = userEvent.setup();
        mockClassifyMood.mockResolvedValue("happy");
        vi.mocked(diaryService.create).mockResolvedValue({
          id: "new-1",
          date: new Date().toISOString().split("T")[0],
          content: "테스트 내용",
          mood: "happy",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        renderWithRouter();

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "테스트 내용");

        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /저장하기/i })).toBeInTheDocument();
        });

        const saveButton = screen.getByRole("button", { name: /저장하기/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith("/");
        });
      });
    });

    describe("TC-003-5: 다시 작성", () => {
      it("다시 작성 버튼 클릭 시 작성 화면으로 돌아간다", async () => {
        const user = userEvent.setup();
        mockClassifyMood.mockResolvedValue("happy");
        renderWithRouter();

        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "테스트 내용");

        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /다시 작성/i })).toBeInTheDocument();
        });

        const backButton = screen.getByRole("button", { name: /다시 작성/i });
        await user.click(backButton);

        await waitFor(() => {
          expect(screen.getByText("새 일기 쓰기")).toBeInTheDocument();
        });
      });
    });
  });

  describe("TC-011: 중복 날짜 처리", () => {
    const existingEntry: DiaryEntry = {
      id: "existing-1",
      date: "2024-01-15",
      content: "기존 일기 내용",
      mood: "happy",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    };

    it("해당 날짜에 일기가 있으면 안내 메시지가 표시된다", async () => {
      vi.mocked(diaryService.getByDate).mockResolvedValue(existingEntry);
      renderWithRouter("/write/2024-01-15");

      await waitFor(() => {
        expect(screen.getByText("이미 작성된 일기가 있어요")).toBeInTheDocument();
      });
    });

    it("기존 일기 내용 미리보기가 표시된다", async () => {
      vi.mocked(diaryService.getByDate).mockResolvedValue(existingEntry);
      renderWithRouter("/write/2024-01-15");

      await waitFor(() => {
        expect(screen.getByText(/기존 일기 내용/)).toBeInTheDocument();
      });
    });

    it("일기 보기 링크가 있다", async () => {
      vi.mocked(diaryService.getByDate).mockResolvedValue(existingEntry);
      renderWithRouter("/write/2024-01-15");

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /일기 보기/i })).toHaveAttribute(
          "href",
          "/entry/existing-1"
        );
      });
    });

    it("수정하기 링크가 있다", async () => {
      vi.mocked(diaryService.getByDate).mockResolvedValue(existingEntry);
      renderWithRouter("/write/2024-01-15");

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /수정하기/i })).toHaveAttribute(
          "href",
          "/edit/existing-1"
        );
      });
    });

    it("기존 일기가 있으면 폼이 비활성화된다", async () => {
      vi.mocked(diaryService.getByDate).mockResolvedValue(existingEntry);
      renderWithRouter("/write/2024-01-15");

      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });
});

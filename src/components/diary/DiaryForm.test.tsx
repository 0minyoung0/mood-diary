import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiaryForm } from "./DiaryForm";

// useAI 모킹
vi.mock("@/contexts/AIContext", () => ({
  useAI: () => ({
    status: "ready",
    progress: 100,
    progressText: "",
    error: null,
    isModelReady: true,
    isWebGPUSupported: true,
    classifyMood: vi.fn(),
  }),
}));

describe("DiaryForm (TC-002)", () => {
  const mockOnSubmit = vi.fn();
  const mockOnDateChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("기본 렌더링", () => {
    it("날짜 입력 필드가 표시된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText("날짜")).toBeInTheDocument();
    });

    it("내용 입력 필드가 표시된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText("오늘 하루는 어땠나요?")).toBeInTheDocument();
    });

    it("제출 버튼이 표시된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole("button", { name: /AI로 감정 분석하기/i })).toBeInTheDocument();
    });

    it("글자 수 카운터가 표시된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText("0 / 5,000")).toBeInTheDocument();
    });
  });

  describe("TC-002-2: 날짜 선택", () => {
    it("기본 날짜는 오늘이다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      const today = new Date().toISOString().split("T")[0];
      const dateInput = screen.getByLabelText("날짜") as HTMLInputElement;

      expect(dateInput.value).toBe(today);
    });

    it("initialDate가 주어지면 해당 날짜로 설정된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} initialDate="2024-01-15" />);

      const dateInput = screen.getByLabelText("날짜") as HTMLInputElement;
      expect(dateInput.value).toBe("2024-01-15");
    });

    it("날짜 변경 시 onDateChange가 호출된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} onDateChange={mockOnDateChange} />);

      const dateInput = screen.getByLabelText("날짜");
      fireEvent.change(dateInput, { target: { value: "2024-01-15" } });

      expect(mockOnDateChange).toHaveBeenCalledWith("2024-01-15");
    });

    it("미래 날짜는 선택할 수 없다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      const today = new Date().toISOString().split("T")[0];
      const dateInput = screen.getByLabelText("날짜") as HTMLInputElement;

      expect(dateInput.max).toBe(today);
    });
  });

  describe("TC-002-3: 빈 내용 저장 시도", () => {
    it("내용이 비어있으면 제출 버튼이 비활성화된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
      expect(submitButton).toBeDisabled();
    });

    it("공백만 입력하면 제출 버튼이 비활성화된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText("오늘 하루는 어땠나요?");
      fireEvent.change(textarea, { target: { value: "   " } });

      const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
      expect(submitButton).toBeDisabled();
    });

    it("내용 입력 시 제출 버튼이 활성화된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText("오늘 하루는 어땠나요?");
      fireEvent.change(textarea, { target: { value: "오늘은 좋은 하루였다" } });

      const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("TC-002-4: 최대 글자 수 제한", () => {
    it("5000자 이상 입력 시 5000자로 잘린다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText("오늘 하루는 어땠나요?") as HTMLTextAreaElement;
      const longText = "a".repeat(5001);

      fireEvent.change(textarea, { target: { value: longText } });

      expect(textarea.value.length).toBe(5000);
    });

    it("글자 수가 실시간으로 표시된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText("오늘 하루는 어땠나요?");
      fireEvent.change(textarea, { target: { value: "안녕하세요" } });

      expect(screen.getByText("5 / 5,000")).toBeInTheDocument();
    });

    it("100자 입력 시 올바른 카운트가 표시된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByLabelText("오늘 하루는 어땠나요?");
      fireEvent.change(textarea, { target: { value: "a".repeat(100) } });

      expect(screen.getByText("100 / 5,000")).toBeInTheDocument();
    });
  });

  describe("TC-002-1: 정상 일기 작성", () => {
    it("내용 입력 후 제출하면 onSubmit이 호출된다", async () => {
      const user = userEvent.setup();
      render(<DiaryForm onSubmit={mockOnSubmit} initialDate="2024-01-15" />);

      const textarea = screen.getByLabelText("오늘 하루는 어땠나요?");
      fireEvent.change(textarea, { target: { value: "오늘 친구를 만나서 정말 즐거웠다" } });

      const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        "2024-01-15",
        "오늘 친구를 만나서 정말 즐거웠다"
      );
    });

    it("내용의 앞뒤 공백이 제거되어 제출된다", async () => {
      const user = userEvent.setup();
      render(<DiaryForm onSubmit={mockOnSubmit} initialDate="2024-01-15" />);

      const textarea = screen.getByLabelText("오늘 하루는 어땠나요?");
      fireEvent.change(textarea, { target: { value: "  테스트 내용  " } });

      const submitButton = screen.getByRole("button", { name: /AI로 감정 분석하기/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("2024-01-15", "테스트 내용");
    });
  });

  describe("initialContent", () => {
    it("초기 내용이 설정된다", () => {
      render(
        <DiaryForm onSubmit={mockOnSubmit} initialContent="기존 일기 내용" />
      );

      const textarea = screen.getByLabelText("오늘 하루는 어땠나요?") as HTMLTextAreaElement;
      expect(textarea.value).toBe("기존 일기 내용");
    });
  });

  describe("isSubmitting", () => {
    it("제출 중일 때 버튼 텍스트가 변경된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} isSubmitting />);

      expect(screen.getByRole("button", { name: /분석 중.../i })).toBeInTheDocument();
    });

    it("제출 중일 때 버튼이 비활성화된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} isSubmitting initialContent="테스트" />);

      const submitButton = screen.getByRole("button", { name: /분석 중.../i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("disabled", () => {
    it("disabled일 때 textarea가 비활성화된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} disabled />);

      const textarea = screen.getByLabelText("오늘 하루는 어땠나요?");
      expect(textarea).toBeDisabled();
    });

    it("disabled일 때 버튼 텍스트가 변경된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} disabled />);

      expect(screen.getByRole("button", { name: /다른 날짜를 선택해주세요/i })).toBeInTheDocument();
    });

    it("disabled일 때 버튼이 비활성화된다", () => {
      render(<DiaryForm onSubmit={mockOnSubmit} disabled />);

      const submitButton = screen.getByRole("button", { name: /다른 날짜를 선택해주세요/i });
      expect(submitButton).toBeDisabled();
    });
  });
});

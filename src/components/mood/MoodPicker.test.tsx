import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MoodPicker } from "./MoodPicker";
import { MOOD_CONFIG, MOOD_LIST } from "@/constants/mood";

describe("MoodPicker (TC-004)", () => {
  describe("TC-004-1: 감정 선택 UI 표시", () => {
    it("5가지 감정 버튼이 모두 표시된다", () => {
      render(<MoodPicker selected="neutral" onChange={vi.fn()} />);

      MOOD_LIST.forEach((mood) => {
        expect(screen.getByText(MOOD_CONFIG[mood].emoji)).toBeInTheDocument();
        expect(screen.getByText(MOOD_CONFIG[mood].label)).toBeInTheDocument();
      });
    });

    it("기쁨 이모지(😊)가 표시된다", () => {
      render(<MoodPicker selected="neutral" onChange={vi.fn()} />);

      expect(screen.getByText("😊")).toBeInTheDocument();
      expect(screen.getByText("기쁨")).toBeInTheDocument();
    });

    it("슬픔 이모지(😢)가 표시된다", () => {
      render(<MoodPicker selected="neutral" onChange={vi.fn()} />);

      expect(screen.getByText("😢")).toBeInTheDocument();
      expect(screen.getByText("슬픔")).toBeInTheDocument();
    });

    it("화남 이모지(😠)가 표시된다", () => {
      render(<MoodPicker selected="neutral" onChange={vi.fn()} />);

      expect(screen.getByText("😠")).toBeInTheDocument();
      expect(screen.getByText("화남")).toBeInTheDocument();
    });

    it("불안 이모지(😰)가 표시된다", () => {
      render(<MoodPicker selected="neutral" onChange={vi.fn()} />);

      expect(screen.getByText("😰")).toBeInTheDocument();
      expect(screen.getByText("불안")).toBeInTheDocument();
    });

    it("평온 이모지(😐)가 표시된다", () => {
      render(<MoodPicker selected="neutral" onChange={vi.fn()} />);

      expect(screen.getByText("😐")).toBeInTheDocument();
      expect(screen.getByText("평온")).toBeInTheDocument();
    });
  });

  describe("TC-004-2: AI 분류 결과 기본 선택", () => {
    it("happy가 선택되면 기쁨 버튼이 하이라이트된다", () => {
      render(<MoodPicker selected="happy" onChange={vi.fn()} />);

      const happyButton = screen.getByRole("button", { name: /😊.*기쁨/i });
      expect(happyButton).toHaveClass("border-primary");
    });

    it("sad가 선택되면 슬픔 버튼이 하이라이트된다", () => {
      render(<MoodPicker selected="sad" onChange={vi.fn()} />);

      const sadButton = screen.getByRole("button", { name: /😢.*슬픔/i });
      expect(sadButton).toHaveClass("border-primary");
    });

    it("선택되지 않은 버튼은 하이라이트되지 않는다", () => {
      render(<MoodPicker selected="happy" onChange={vi.fn()} />);

      const sadButton = screen.getByRole("button", { name: /😢.*슬픔/i });
      expect(sadButton).toHaveClass("border-transparent");
    });
  });

  describe("TC-004-3: 감정 수동 변경", () => {
    it("다른 감정 버튼 클릭 시 onChange가 호출된다", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MoodPicker selected="happy" onChange={onChange} />);

      const sadButton = screen.getByRole("button", { name: /😢.*슬픔/i });
      await user.click(sadButton);

      expect(onChange).toHaveBeenCalledWith("sad");
    });

    it("기쁨 버튼 클릭 시 happy로 변경된다", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MoodPicker selected="neutral" onChange={onChange} />);

      const happyButton = screen.getByRole("button", { name: /😊.*기쁨/i });
      await user.click(happyButton);

      expect(onChange).toHaveBeenCalledWith("happy");
    });

    it("화남 버튼 클릭 시 angry로 변경된다", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MoodPicker selected="neutral" onChange={onChange} />);

      const angryButton = screen.getByRole("button", { name: /😠.*화남/i });
      await user.click(angryButton);

      expect(onChange).toHaveBeenCalledWith("angry");
    });

    it("불안 버튼 클릭 시 anxious로 변경된다", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MoodPicker selected="neutral" onChange={onChange} />);

      const anxiousButton = screen.getByRole("button", { name: /😰.*불안/i });
      await user.click(anxiousButton);

      expect(onChange).toHaveBeenCalledWith("anxious");
    });

    it("평온 버튼 클릭 시 neutral로 변경된다", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MoodPicker selected="happy" onChange={onChange} />);

      const neutralButton = screen.getByRole("button", { name: /😐.*평온/i });
      await user.click(neutralButton);

      expect(onChange).toHaveBeenCalledWith("neutral");
    });

    it("이미 선택된 버튼을 클릭해도 onChange가 호출된다", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MoodPicker selected="happy" onChange={onChange} />);

      const happyButton = screen.getByRole("button", { name: /😊.*기쁨/i });
      await user.click(happyButton);

      expect(onChange).toHaveBeenCalledWith("happy");
    });
  });
});

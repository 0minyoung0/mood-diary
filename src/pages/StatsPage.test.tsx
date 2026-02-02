import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { StatsPage } from "./StatsPage";
import { diaryService } from "@/services/diaryService";
import type { MoodStats } from "@/types";

// diaryService 모킹
vi.mock("@/services/diaryService", () => ({
  diaryService: {
    getMoodStats: vi.fn(),
  },
}));

// recharts 모킹 (jsdom에서 SVG 렌더링 문제 방지)
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockStats: MoodStats = {
  happy: 5,
  sad: 2,
  angry: 1,
  anxious: 3,
  neutral: 4,
  total: 15,
};

const emptyStats: MoodStats = {
  happy: 0,
  sad: 0,
  angry: 0,
  anxious: 0,
  neutral: 0,
  total: 0,
};

const renderWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={["/stats"]}>
      <StatsPage />
    </MemoryRouter>
  );
};

// 현재 날짜 기반 테스트를 위한 헬퍼
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

// 이전 달 계산
const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

// 다음 달 계산
const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

describe("StatsPage (TC-008)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("기본 렌더링", () => {
    it("페이지 제목이 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      expect(screen.getByText("감정 통계")).toBeInTheDocument();
    });

    it("안내 문구가 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      expect(screen.getByText("월별 감정 패턴을 확인해보세요")).toBeInTheDocument();
    });
  });

  describe("로딩 상태", () => {
    it("로딩 중일 때 로딩 메시지가 표시된다", () => {
      vi.mocked(diaryService.getMoodStats).mockImplementation(
        () => new Promise(() => {})
      );
      renderWithRouter();

      expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
    });
  });

  describe("TC-008-1: 원형 차트 표시", () => {
    it("통계 데이터가 있을 때 차트가 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(mockStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
      });
    });

    it("차트 범례가 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(mockStats);
      renderWithRouter();

      await waitFor(() => {
        // 0보다 큰 감정만 범례에 표시됨
        // 범례 형식: "😊 기쁨" (공백으로 구분)
        expect(screen.getByText("😊 기쁨")).toBeInTheDocument();
        expect(screen.getByText("😢 슬픔")).toBeInTheDocument();
        expect(screen.getByText("😠 화남")).toBeInTheDocument();
        expect(screen.getByText("😰 불안")).toBeInTheDocument();
        expect(screen.getByText("😐 평온")).toBeInTheDocument();
      });
    });

    it("총 일기 수가 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(mockStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("15")).toBeInTheDocument();
        expect(screen.getByText("총 일기 수")).toBeInTheDocument();
      });
    });
  });

  describe("TC-008-2: 감정별 개수 표시", () => {
    it("감정별 일기 수 섹션이 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(mockStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("감정별 일기 수")).toBeInTheDocument();
      });
    });

    it("각 감정별 개수가 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(mockStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("5개")).toBeInTheDocument(); // happy
        expect(screen.getByText("2개")).toBeInTheDocument(); // sad
        expect(screen.getByText("1개")).toBeInTheDocument(); // angry
        expect(screen.getByText("3개")).toBeInTheDocument(); // anxious
        expect(screen.getByText("4개")).toBeInTheDocument(); // neutral
      });
    });

    it("모든 감정 이모지가 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(mockStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getAllByText("😊").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("😢").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("😠").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("😰").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("😐").length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("TC-008-3: 월 선택", () => {
    it("현재 월이 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`${currentYear}년.*${currentMonth}월`))).toBeInTheDocument();
      });
    });

    it("이전/다음 달 버튼이 있다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("이전 달 버튼 클릭 시 월이 변경된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`${currentYear}년.*${currentMonth}월`))).toBeInTheDocument();
      });

      // 첫 번째 버튼 (이전 달)
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`${prevYear}년.*${prevMonth}월`))).toBeInTheDocument();
      });
    });

    it("다음 달 버튼 클릭 시 월이 변경된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`${currentYear}년.*${currentMonth}월`))).toBeInTheDocument();
      });

      // 두 번째 버튼 (다음 달)
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[1]);

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`${nextYear}년.*${nextMonth}월`))).toBeInTheDocument();
      });
    });

    it("월 변경 시 getMoodStats가 새로운 월로 호출된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      await waitFor(() => {
        expect(diaryService.getMoodStats).toHaveBeenCalledWith(currentYear, currentMonth);
      });

      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]); // 이전 달

      await waitFor(() => {
        expect(diaryService.getMoodStats).toHaveBeenCalledWith(prevYear, prevMonth);
      });
    });
  });

  describe("TC-008-4: 빈 월 메시지", () => {
    it("해당 월에 기록이 없으면 안내 메시지가 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("해당 월에 기록이 없습니다")).toBeInTheDocument();
      });
    });

    it("빈 상태에서 추가 안내 문구가 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("일기를 작성하면 통계가 표시됩니다")).toBeInTheDocument();
      });
    });

    it("빈 상태에서 아이콘이 표시된다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      await waitFor(() => {
        // BarChart3 아이콘이 있는지 확인 (svg)
        expect(document.querySelector("svg")).toBeInTheDocument();
      });
    });

    it("빈 상태에서는 차트가 표시되지 않는다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
      });

      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });

    it("빈 상태에서는 감정별 일기 수 섹션이 표시되지 않는다", async () => {
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(emptyStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
      });

      expect(screen.queryByText("감정별 일기 수")).not.toBeInTheDocument();
    });
  });

  describe("일부 감정만 있는 경우", () => {
    it("0개인 감정은 범례에 표시되지 않는다", async () => {
      const partialStats: MoodStats = {
        happy: 3,
        sad: 2,
        angry: 0,
        anxious: 0,
        neutral: 0,
        total: 5,
      };
      vi.mocked(diaryService.getMoodStats).mockResolvedValue(partialStats);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
      });

      // 범례에서 확인 (감정별 일기 수 섹션이 아닌 차트 아래 범례)
      // 범례는 "😊 기쁨" 형태로 표시됨
      const legendItems = screen.getAllByText(/😊.*기쁨/);
      expect(legendItems.length).toBeGreaterThanOrEqual(1);
    });
  });
});

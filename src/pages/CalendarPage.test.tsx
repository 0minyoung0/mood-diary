import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CalendarPage } from "./CalendarPage";
import { diaryService } from "@/services/diaryService";
import type { DiaryEntry } from "@/types";

// diaryService 모킹
vi.mock("@/services/diaryService", () => ({
  diaryService: {
    getByMonth: vi.fn(),
  },
}));

// useNavigate 모킹
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 현재 날짜 기반 테스트를 위한 헬퍼
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const currentDay = now.getDate();

// 이전 달 계산
const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

// 다음 달 계산
const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

// 현재 월의 마지막 일 계산
const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

// 날짜 포맷 헬퍼
const formatDate = (year: number, month: number, day: number) => {
  const m = month.toString().padStart(2, "0");
  const d = day.toString().padStart(2, "0");
  return `${year}-${m}-${d}`;
};

// 현재 월 기준 mock entries
const mockEntries: DiaryEntry[] = [
  {
    id: "1",
    date: formatDate(currentYear, currentMonth, 15),
    content: "좋은 하루",
    mood: "happy",
    createdAt: `${formatDate(currentYear, currentMonth, 15)}T10:00:00Z`,
    updatedAt: `${formatDate(currentYear, currentMonth, 15)}T10:00:00Z`,
  },
  {
    id: "2",
    date: formatDate(currentYear, currentMonth, 20),
    content: "평범한 하루",
    mood: "neutral",
    createdAt: `${formatDate(currentYear, currentMonth, 20)}T10:00:00Z`,
    updatedAt: `${formatDate(currentYear, currentMonth, 20)}T10:00:00Z`,
  },
];

const renderWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={["/calendar"]}>
      <Routes>
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/entry/:id" element={<div>Entry Detail</div>} />
        <Route path="/write/:date" element={<div>Write Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("CalendarPage (TC-007)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("기본 렌더링", () => {
    it("페이지 제목이 표시된다", async () => {
      vi.mocked(diaryService.getByMonth).mockResolvedValue([]);
      renderWithRouter();

      expect(screen.getByText("감정 캘린더")).toBeInTheDocument();
    });

    it("안내 문구가 표시된다", async () => {
      vi.mocked(diaryService.getByMonth).mockResolvedValue([]);
      renderWithRouter();

      expect(screen.getByText(/날짜를 클릭해서 일기를 확인하거나 작성하세요/)).toBeInTheDocument();
    });
  });

  describe("TC-007-1: 월간 캘린더 표시", () => {
    it("현재 월이 표시된다", async () => {
      vi.mocked(diaryService.getByMonth).mockResolvedValue([]);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`${currentYear}년.*${currentMonth}월`))).toBeInTheDocument();
      });
    });

    it("요일 헤더가 표시된다", async () => {
      vi.mocked(diaryService.getByMonth).mockResolvedValue([]);
      renderWithRouter();

      ["일", "월", "화", "수", "목", "금", "토"].forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it("해당 월의 날짜들이 표시된다", async () => {
      vi.mocked(diaryService.getByMonth).mockResolvedValue([]);
      renderWithRouter();

      await waitFor(() => {
        // 현재 월의 1일, 15일, 마지막 일 확인
        expect(screen.getByRole("button", { name: /^1$/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^15$/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: new RegExp(`^${lastDayOfMonth}$`) })).toBeInTheDocument();
      });
    });
  });

  describe("로딩 상태", () => {
    it("로딩 중일 때 로딩 메시지가 표시된다", () => {
      vi.mocked(diaryService.getByMonth).mockImplementation(
        () => new Promise(() => {})
      );
      renderWithRouter();

      expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
    });
  });

  describe("TC-007-2: 감정 이모지 표시", () => {
    it("일기가 있는 날짜에 감정 이모지가 표시된다", async () => {
      vi.mocked(diaryService.getByMonth).mockResolvedValue(mockEntries);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("😊")).toBeInTheDocument();
        expect(screen.getByText("😐")).toBeInTheDocument();
      });
    });
  });

  describe("TC-007-3: 월 이동", () => {
    it("이전/다음 달 버튼이 있다", async () => {
      vi.mocked(diaryService.getByMonth).mockResolvedValue([]);
      renderWithRouter();

      await waitFor(() => {
        // 버튼이 2개 이상 있어야 함 (이전, 다음)
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("이전 달 버튼 클릭 시 월이 변경된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getByMonth).mockResolvedValue([]);
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
      vi.mocked(diaryService.getByMonth).mockResolvedValue([]);
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
  });

  describe("TC-007-4: 날짜 클릭 - 일기 있음", () => {
    it("일기가 있는 날짜 클릭 시 상세 페이지로 이동한다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getByMonth).mockResolvedValue(mockEntries);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("😊")).toBeInTheDocument();
      });

      // 15일 버튼 클릭 (일기가 있는 날) - 버튼 내에 이모지도 있으므로 15를 포함하는 버튼
      const dayButton = screen.getByRole("button", { name: /15/ });
      await user.click(dayButton);

      expect(mockNavigate).toHaveBeenCalledWith("/entry/1");
    });
  });

  describe("TC-007-5: 날짜 클릭 - 일기 없음", () => {
    it("일기가 없는 날짜 클릭 시 작성 페이지로 이동한다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getByMonth).mockResolvedValue(mockEntries);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
      });

      // 10일 버튼 클릭 (일기가 없는 날)
      const dayButton = screen.getByRole("button", { name: /^10$/ });
      await user.click(dayButton);

      expect(mockNavigate).toHaveBeenCalledWith(`/write/${formatDate(currentYear, currentMonth, 10)}`);
    });
  });

  describe("오늘 날짜 표시", () => {
    it("오늘 날짜에 ring 스타일이 적용된다", async () => {
      vi.mocked(diaryService.getByMonth).mockResolvedValue([]);
      renderWithRouter();

      await waitFor(() => {
        // 오늘 날짜 버튼 찾기
        const todayButton = screen.getByRole("button", { name: new RegExp(`^${currentDay}$`) });
        expect(todayButton.className).toContain("ring");
      });
    });
  });
});

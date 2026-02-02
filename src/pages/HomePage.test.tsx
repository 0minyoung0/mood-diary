import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./HomePage";
import { diaryService } from "@/services/diaryService";
import type { DiaryEntry } from "@/types";

// diaryService 모킹
vi.mock("@/services/diaryService", () => ({
  diaryService: {
    getAll: vi.fn(),
  },
}));

const mockEntries: DiaryEntry[] = [
  {
    id: "1",
    date: "2024-01-15",
    content: "오늘은 정말 좋은 하루였다.",
    mood: "happy",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    date: "2024-01-14",
    content: "조금 피곤했지만 괜찮았다.",
    mood: "neutral",
    createdAt: "2024-01-14T10:00:00Z",
    updatedAt: "2024-01-14T10:00:00Z",
  },
];

const renderWithRouter = (ui: React.ReactNode) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("HomePage (TC-005)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("기본 렌더링", () => {
    it("페이지 제목이 표시된다", async () => {
      vi.mocked(diaryService.getAll).mockResolvedValue([]);
      renderWithRouter(<HomePage />);

      expect(screen.getByText("내 일기")).toBeInTheDocument();
    });

    it("새 일기 버튼이 표시된다", async () => {
      vi.mocked(diaryService.getAll).mockResolvedValue([]);
      renderWithRouter(<HomePage />);

      expect(screen.getByRole("link", { name: /새 일기/i })).toBeInTheDocument();
    });

    it("새 일기 버튼이 /write로 링크된다", async () => {
      vi.mocked(diaryService.getAll).mockResolvedValue([]);
      renderWithRouter(<HomePage />);

      const link = screen.getByRole("link", { name: /새 일기/i });
      expect(link).toHaveAttribute("href", "/write");
    });
  });

  describe("로딩 상태", () => {
    it("로딩 중일 때 로딩 메시지가 표시된다", () => {
      vi.mocked(diaryService.getAll).mockImplementation(
        () => new Promise(() => {}) // 영원히 pending
      );
      renderWithRouter(<HomePage />);

      expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
    });
  });

  describe("TC-005-4: 빈 목록 상태", () => {
    it("일기가 없을 때 안내 메시지가 표시된다", async () => {
      vi.mocked(diaryService.getAll).mockResolvedValue([]);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText("오늘의 감정을 기록해보세요")).toBeInTheDocument();
      });
    });

    it("일기가 없을 때 빈 상태 UI가 표시된다", async () => {
      vi.mocked(diaryService.getAll).mockResolvedValue([]);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText("작성된 일기가 없습니다")).toBeInTheDocument();
      });
    });
  });

  describe("TC-005-1, TC-005-2: 목록 표시", () => {
    it("일기 목록이 표시된다", async () => {
      vi.mocked(diaryService.getAll).mockResolvedValue(mockEntries);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText(/오늘은 정말 좋은 하루였다/)).toBeInTheDocument();
        expect(screen.getByText(/조금 피곤했지만 괜찮았다/)).toBeInTheDocument();
      });
    });

    it("일기 개수가 표시된다", async () => {
      vi.mocked(diaryService.getAll).mockResolvedValue(mockEntries);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText("총 2개의 일기")).toBeInTheDocument();
      });
    });

    it("감정 이모지가 표시된다", async () => {
      vi.mocked(diaryService.getAll).mockResolvedValue(mockEntries);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText("😊")).toBeInTheDocument();
        expect(screen.getByText("😐")).toBeInTheDocument();
      });
    });
  });

  describe("TC-005-3: 목록에서 상세로 이동", () => {
    it("일기 카드가 상세 페이지 링크를 가진다", async () => {
      vi.mocked(diaryService.getAll).mockResolvedValue(mockEntries);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        const links = screen.getAllByRole("link").filter((link) =>
          link.getAttribute("href")?.startsWith("/entry/")
        );
        expect(links).toHaveLength(2);
        expect(links[0]).toHaveAttribute("href", "/entry/1");
        expect(links[1]).toHaveAttribute("href", "/entry/2");
      });
    });
  });

  describe("에러 처리", () => {
    it("로딩 실패 시에도 크래시하지 않는다", async () => {
      vi.mocked(diaryService.getAll).mockRejectedValue(new Error("Network Error"));
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
      });
    });
  });

  describe("TC-009: 일기 검색", () => {
    it("검색 입력창이 표시된다", async () => {
      vi.mocked(diaryService.getAll).mockResolvedValue([]);
      renderWithRouter(<HomePage />);

      expect(screen.getByPlaceholderText("일기 내용 검색...")).toBeInTheDocument();
    });

    it("TC-009-1: 키워드로 일기를 검색할 수 있다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getAll).mockResolvedValue(mockEntries);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText(/오늘은 정말 좋은 하루였다/)).toBeInTheDocument();
      });

      // 검색어 입력
      const searchInput = screen.getByPlaceholderText("일기 내용 검색...");
      await user.type(searchInput, "좋은");

      // 검색 결과 확인
      await waitFor(() => {
        expect(screen.getByText(/오늘은 정말 좋은 하루였다/)).toBeInTheDocument();
        expect(screen.queryByText(/조금 피곤했지만 괜찮았다/)).not.toBeInTheDocument();
      });
    });

    it("TC-009-2: 검색 결과 개수가 표시된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getAll).mockResolvedValue(mockEntries);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("일기 내용 검색...");
      await user.type(searchInput, "좋은");

      await waitFor(() => {
        expect(screen.getByText(/"좋은" 검색 결과: 1개/)).toBeInTheDocument();
      });
    });

    it("TC-009-3: 검색 결과가 없으면 안내 메시지가 표시된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getAll).mockResolvedValue(mockEntries);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("일기 내용 검색...");
      await user.type(searchInput, "존재하지않는키워드");

      await waitFor(() => {
        expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
      });
    });

    it("검색어 삭제 버튼이 동작한다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getAll).mockResolvedValue(mockEntries);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("일기 내용 검색...");
      await user.type(searchInput, "좋은");

      // X 버튼 클릭
      const clearButton = screen.getByRole("button");
      await user.click(clearButton);

      // 검색어가 지워지고 전체 목록이 표시됨
      await waitFor(() => {
        expect(searchInput).toHaveValue("");
        expect(screen.getByText(/오늘은 정말 좋은 하루였다/)).toBeInTheDocument();
        expect(screen.getByText(/조금 피곤했지만 괜찮았다/)).toBeInTheDocument();
      });
    });

    it("대소문자 구분 없이 검색된다", async () => {
      const user = userEvent.setup();
      const entriesWithEnglish: DiaryEntry[] = [
        {
          id: "1",
          date: "2024-01-15",
          content: "Today was a HAPPY day",
          mood: "happy",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
        },
      ];
      vi.mocked(diaryService.getAll).mockResolvedValue(entriesWithEnglish);
      renderWithRouter(<HomePage />);

      await waitFor(() => {
        expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("일기 내용 검색...");
      await user.type(searchInput, "happy");

      await waitFor(() => {
        expect(screen.getByText(/Today was a HAPPY day/)).toBeInTheDocument();
      });
    });
  });
});

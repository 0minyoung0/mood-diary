import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { DetailPage } from "./DetailPage";
import { diaryService } from "@/services/diaryService";
import type { DiaryEntry } from "@/types";

// diaryService 모킹
vi.mock("@/services/diaryService", () => ({
  diaryService: {
    getById: vi.fn(),
    delete: vi.fn(),
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

const mockEntry: DiaryEntry = {
  id: "test-1",
  date: "2024-01-15T12:00:00",
  content: "오늘은 정말 좋은 하루였다. 친구를 만나서 맛있는 음식도 먹었다.",
  mood: "happy",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

const renderWithRouter = (id: string = "test-1") => {
  return render(
    <MemoryRouter initialEntries={[`/entry/${id}`]}>
      <Routes>
        <Route path="/entry/:id" element={<DetailPage />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("DetailPage (TC-006, TC-011)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe("일기를 찾을 수 없는 경우", () => {
    it("일기가 없으면 안내 메시지가 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(undefined);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("일기를 찾을 수 없습니다.")).toBeInTheDocument();
      });
    });

    it("목록으로 돌아가기 링크가 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(undefined);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /목록으로 돌아가기/i })).toBeInTheDocument();
      });
    });
  });

  describe("TC-006-1: 상세 내용 표시", () => {
    it("날짜가 한국어 형식으로 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/2024년.*1월.*15일/)).toBeInTheDocument();
      });
    });

    it("감정 이모지가 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("😊")).toBeInTheDocument();
      });
    });

    it("일기 내용이 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(mockEntry.content)).toBeInTheDocument();
      });
    });
  });

  describe("TC-006-2: 목록으로 돌아가기", () => {
    it("목록으로 버튼이 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /목록으로/i })).toBeInTheDocument();
      });
    });

    it("목록으로 버튼이 /로 링크된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        const link = screen.getByRole("link", { name: /목록으로/i });
        expect(link).toHaveAttribute("href", "/");
      });
    });
  });

  describe("수정 버튼", () => {
    it("수정 버튼이 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /수정/i })).toBeInTheDocument();
      });
    });

    it("수정 버튼이 /edit/:id로 링크된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        const link = screen.getByRole("link", { name: /수정/i });
        expect(link).toHaveAttribute("href", "/edit/test-1");
      });
    });
  });

  describe("TC-011-1: 삭제 확인 다이얼로그", () => {
    it("삭제 버튼이 표시된다", async () => {
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /삭제/i })).toBeInTheDocument();
      });
    });

    it("삭제 버튼 클릭 시 확인 다이얼로그가 표시된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /삭제/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /삭제/i });
      await user.click(deleteButton);

      expect(screen.getByText("일기 삭제")).toBeInTheDocument();
      expect(screen.getByText(/정말 이 일기를 삭제하시겠습니까/)).toBeInTheDocument();
    });

    it("다이얼로그에 취소 버튼이 있다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /삭제/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /삭제/i }));

      expect(screen.getByRole("button", { name: /취소/i })).toBeInTheDocument();
    });
  });

  describe("TC-011-2: 삭제 확정", () => {
    it("다이얼로그에서 삭제 확인 시 삭제 API가 호출된다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      vi.mocked(diaryService.delete).mockResolvedValue(undefined);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /삭제/i })).toBeInTheDocument();
      });

      // 삭제 버튼 클릭 -> 다이얼로그 열림
      await user.click(screen.getByRole("button", { name: /삭제/i }));

      // 다이얼로그 내 삭제 확인 버튼 클릭
      const confirmButtons = screen.getAllByRole("button", { name: /삭제/i });
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      await user.click(confirmButton);

      expect(diaryService.delete).toHaveBeenCalledWith("test-1");
    });

    it("삭제 성공 시 홈으로 이동한다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      vi.mocked(diaryService.delete).mockResolvedValue(undefined);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /삭제/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /삭제/i }));

      const confirmButtons = screen.getAllByRole("button", { name: /삭제/i });
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("TC-011-3: 삭제 취소", () => {
    it("취소 버튼 클릭 시 다이얼로그가 닫힌다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /삭제/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /삭제/i }));
      expect(screen.getByText("일기 삭제")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /취소/i }));

      await waitFor(() => {
        expect(screen.queryByText("일기 삭제")).not.toBeInTheDocument();
      });
    });

    it("취소 시 삭제 API가 호출되지 않는다", async () => {
      const user = userEvent.setup();
      vi.mocked(diaryService.getById).mockResolvedValue(mockEntry);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /삭제/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /삭제/i }));
      await user.click(screen.getByRole("button", { name: /취소/i }));

      expect(diaryService.delete).not.toHaveBeenCalled();
    });
  });

  describe("감정별 표시", () => {
    const moods = [
      { mood: "happy", emoji: "😊" },
      { mood: "sad", emoji: "😢" },
      { mood: "angry", emoji: "😠" },
      { mood: "anxious", emoji: "😰" },
      { mood: "neutral", emoji: "😐" },
    ] as const;

    moods.forEach(({ mood, emoji }) => {
      it(`${mood} 감정이 ${emoji}로 표시된다`, async () => {
        vi.mocked(diaryService.getById).mockResolvedValue({ ...mockEntry, mood });
        renderWithRouter();

        await waitFor(() => {
          expect(screen.getByText(emoji)).toBeInTheDocument();
        });
      });
    });
  });
});

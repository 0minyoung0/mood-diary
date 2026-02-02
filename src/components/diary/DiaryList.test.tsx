import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DiaryList } from "./DiaryList";
import { DiaryCard } from "./DiaryCard";
import type { DiaryEntry } from "@/types";

const mockEntries: DiaryEntry[] = [
  {
    id: "1",
    date: "2024-01-15",
    content: "오늘은 정말 좋은 하루였다. 친구를 만나서 맛있는 음식도 먹고 즐거운 시간을 보냈다.",
    mood: "happy",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    date: "2024-01-14",
    content: "조금 우울한 하루였다.",
    mood: "sad",
    createdAt: "2024-01-14T10:00:00Z",
    updatedAt: "2024-01-14T10:00:00Z",
  },
  {
    id: "3",
    date: "2024-01-13",
    content: "평범한 하루",
    mood: "neutral",
    createdAt: "2024-01-13T10:00:00Z",
    updatedAt: "2024-01-13T10:00:00Z",
  },
];

const renderWithRouter = (ui: React.ReactNode) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("DiaryList (TC-005)", () => {
  describe("TC-005-4: 빈 목록 상태", () => {
    it("일기가 없을 때 안내 메시지가 표시된다", () => {
      renderWithRouter(<DiaryList entries={[]} />);

      expect(screen.getByText("작성된 일기가 없습니다")).toBeInTheDocument();
      expect(screen.getByText("첫 번째 일기를 작성해보세요!")).toBeInTheDocument();
    });

    it("일기가 없을 때 아이콘이 표시된다", () => {
      renderWithRouter(<DiaryList entries={[]} />);

      // BookOpen 아이콘이 있는지 확인 (svg)
      expect(document.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("TC-005-1: 목록 표시", () => {
    it("모든 일기가 표시된다", () => {
      renderWithRouter(<DiaryList entries={mockEntries} />);

      expect(screen.getByText(/오늘은 정말 좋은 하루였다/)).toBeInTheDocument();
      expect(screen.getByText("조금 우울한 하루였다.")).toBeInTheDocument();
      expect(screen.getByText("평범한 하루")).toBeInTheDocument();
    });

    it("일기 수만큼 카드가 렌더링된다", () => {
      renderWithRouter(<DiaryList entries={mockEntries} />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(3);
    });
  });

  describe("TC-005-3: 목록에서 상세로 이동", () => {
    it("각 일기 카드가 올바른 상세 페이지 링크를 가진다", () => {
      renderWithRouter(<DiaryList entries={mockEntries} />);

      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveAttribute("href", "/entry/1");
      expect(links[1]).toHaveAttribute("href", "/entry/2");
      expect(links[2]).toHaveAttribute("href", "/entry/3");
    });
  });
});

describe("DiaryCard (TC-005-2)", () => {
  const singleEntry: DiaryEntry = {
    id: "test-1",
    date: "2024-01-15",
    content: "오늘 하루는 정말 즐거웠다.",
    mood: "happy",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  };

  describe("TC-005-2: 목록 아이템 정보 표시", () => {
    it("날짜가 한국어 형식으로 표시된다", () => {
      renderWithRouter(<DiaryCard entry={singleEntry} />);

      // 1월 15일 (월) 형식
      expect(screen.getByText(/1월.*15일/)).toBeInTheDocument();
    });

    it("감정 이모지가 표시된다", () => {
      renderWithRouter(<DiaryCard entry={singleEntry} />);

      expect(screen.getByText("😊")).toBeInTheDocument();
    });

    it("일기 내용이 표시된다", () => {
      renderWithRouter(<DiaryCard entry={singleEntry} />);

      expect(screen.getByText("오늘 하루는 정말 즐거웠다.")).toBeInTheDocument();
    });

    it("긴 내용은 60자로 잘리고 말줄임표가 붙는다", () => {
      const longEntry: DiaryEntry = {
        ...singleEntry,
        content:
          "이것은 매우 긴 일기 내용입니다. 60자를 초과하는 내용은 말줄임표로 처리되어야 합니다. 테스트를 위한 추가 문장입니다.",
      };

      renderWithRouter(<DiaryCard entry={longEntry} />);

      // 60자 + "..." 로 잘림
      const previewText = screen.getByText(/이것은 매우 긴 일기 내용입니다/);
      expect(previewText.textContent).toHaveLength(63); // 60 + "..."
      expect(previewText.textContent).toContain("...");
    });

    it("짧은 내용은 그대로 표시된다", () => {
      const shortEntry: DiaryEntry = {
        ...singleEntry,
        content: "짧은 일기",
      };

      renderWithRouter(<DiaryCard entry={shortEntry} />);

      expect(screen.getByText("짧은 일기")).toBeInTheDocument();
    });
  });

  describe("감정별 이모지 표시", () => {
    it("happy 감정은 😊로 표시된다", () => {
      renderWithRouter(<DiaryCard entry={{ ...singleEntry, mood: "happy" }} />);
      expect(screen.getByText("😊")).toBeInTheDocument();
    });

    it("sad 감정은 😢로 표시된다", () => {
      renderWithRouter(<DiaryCard entry={{ ...singleEntry, mood: "sad" }} />);
      expect(screen.getByText("😢")).toBeInTheDocument();
    });

    it("angry 감정은 😠로 표시된다", () => {
      renderWithRouter(<DiaryCard entry={{ ...singleEntry, mood: "angry" }} />);
      expect(screen.getByText("😠")).toBeInTheDocument();
    });

    it("anxious 감정은 😰로 표시된다", () => {
      renderWithRouter(<DiaryCard entry={{ ...singleEntry, mood: "anxious" }} />);
      expect(screen.getByText("😰")).toBeInTheDocument();
    });

    it("neutral 감정은 😐로 표시된다", () => {
      renderWithRouter(<DiaryCard entry={{ ...singleEntry, mood: "neutral" }} />);
      expect(screen.getByText("😐")).toBeInTheDocument();
    });
  });

  describe("링크", () => {
    it("카드를 클릭하면 상세 페이지로 이동하는 링크가 있다", () => {
      renderWithRouter(<DiaryCard entry={singleEntry} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/entry/test-1");
    });
  });
});

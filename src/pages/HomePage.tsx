import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/common/Layout";
import { DiaryList } from "@/components/diary/DiaryList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { diaryService } from "@/services/diaryService";
import { PenSquare, Search, X } from "lucide-react";
import type { DiaryEntry } from "@/types";

export function HomePage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const data = await diaryService.getAll();
        setEntries(data);
      } catch (error) {
        console.error("일기 목록 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, []);

  // FR-009-1: 키워드 검색 (대소문자 구분 없음)
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return entries;
    }
    const query = searchQuery.toLowerCase();
    return entries.filter((entry) =>
      entry.content.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">내 일기</h2>
          <p className="text-sm text-muted-foreground">
            {entries.length > 0 ? `총 ${entries.length}개의 일기` : "오늘의 감정을 기록해보세요"}
          </p>
        </div>
        <Button asChild>
          <Link to="/write" className="gap-2">
            <PenSquare className="h-4 w-4" />
            새 일기
          </Link>
        </Button>
      </div>

      {/* FR-009: 검색 입력창 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="일기 내용 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* FR-009-2: 검색 결과 표시 */}
      {isSearching && (
        <p className="mb-4 text-sm text-muted-foreground">
          "{searchQuery}" 검색 결과: {filteredEntries.length}개
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">불러오는 중...</p>
        </div>
      ) : isSearching && filteredEntries.length === 0 ? (
        /* FR-009-3: 검색 결과 없음 안내 */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            다른 키워드로 검색해보세요
          </p>
        </div>
      ) : (
        <DiaryList entries={filteredEntries} />
      )}
    </Layout>
  );
}

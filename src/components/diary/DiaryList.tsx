import { DiaryCard } from "./DiaryCard";
import { BookOpen } from "lucide-react";
import type { DiaryEntry } from "@/types";

interface DiaryListProps {
  entries: DiaryEntry[];
}

export function DiaryList({ entries }: DiaryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">작성된 일기가 없습니다</p>
        <p className="mt-1 text-sm text-muted-foreground">
          첫 번째 일기를 작성해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <DiaryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

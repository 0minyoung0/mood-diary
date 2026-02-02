import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MoodBadge } from "@/components/mood/MoodBadge";
import { ChevronRight } from "lucide-react";
import type { DiaryEntry } from "@/types";

interface DiaryCardProps {
  entry: DiaryEntry;
}

export function DiaryCard({ entry }: DiaryCardProps) {
  const preview =
    entry.content.length > 60
      ? entry.content.slice(0, 60) + "..."
      : entry.content;

  const formattedDate = new Date(entry.date).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Link to={`/entry/${entry.id}`}>
      <Card className="transition-all hover:bg-muted/50 hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MoodBadge mood={entry.mood} size="lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            <p className="mt-1 truncate text-foreground">{preview}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/common/Layout";
import { MoodBadge } from "@/components/mood/MoodBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { diaryService } from "@/services/diaryService";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiaryEntry } from "@/types";

export function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    const loadEntries = async () => {
      setIsLoading(true);
      try {
        const data = await diaryService.getByMonth(year, month);
        setEntries(data);
      } catch (error) {
        console.error("일기 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [year, month]);

  const entriesByDate = entries.reduce(
    (acc, entry) => {
      acc[entry.date] = entry;
      return acc;
    },
    {} as Record<string, DiaryEntry>
  );

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleDayClick = (date: string, entry?: DiaryEntry) => {
    if (entry) {
      navigate(`/entry/${entry.id}`);
    } else {
      navigate(`/write/${date}`);
    }
  };

  const renderCalendar = () => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const entry = entriesByDate[dateStr];
      const isToday = dateStr === today;

      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(dateStr, entry)}
          className={cn(
            "flex h-14 flex-col items-center justify-center rounded-lg transition-colors",
            isToday && "ring-2 ring-primary ring-offset-2",
            entry ? "bg-muted hover:bg-muted/80" : "hover:bg-muted/50"
          )}
        >
          <span
            className={cn(
              "text-sm",
              isToday ? "font-bold text-primary" : "text-foreground"
            )}
          >
            {day}
          </span>
          {entry && <MoodBadge mood={entry.mood} size="sm" />}
        </button>
      );
    }

    return days;
  };

  const monthName = currentDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">감정 캘린더</h2>
        <p className="text-sm text-muted-foreground">
          날짜를 클릭해서 일기를 확인하거나 작성하세요
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-base">{monthName}</CardTitle>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
              <div
                key={day}
                className={cn(
                  "py-2 text-center text-xs font-medium",
                  i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">불러오는 중...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}

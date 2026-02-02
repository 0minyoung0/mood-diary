import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Layout } from "@/components/common/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOOD_CONFIG, MOOD_LIST } from "@/constants/mood";
import { diaryService } from "@/services/diaryService";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import type { MoodStats } from "@/types";

export function StatsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const data = await diaryService.getMoodStats(year, month);
        setStats(data);
      } catch (error) {
        console.error("통계 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [year, month]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const monthName = currentDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const chartData = stats
    ? MOOD_LIST.filter((mood) => stats[mood] > 0).map((mood) => ({
        name: MOOD_CONFIG[mood].label,
        value: stats[mood],
        color: MOOD_CONFIG[mood].color,
        emoji: MOOD_CONFIG[mood].emoji,
      }))
    : [];

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">감정 통계</h2>
        <p className="text-sm text-muted-foreground">
          월별 감정 패턴을 확인해보세요
        </p>
      </div>

      <Card className="mb-4">
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">불러오는 중...</p>
            </div>
          ) : stats && stats.total > 0 ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                              <p className="font-medium">
                                {data.emoji} {data.name}: {data.value}개
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.emoji} {item.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">총 일기 수</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">해당 월에 기록이 없습니다</p>
              <p className="mt-1 text-sm text-muted-foreground">
                일기를 작성하면 통계가 표시됩니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {stats && stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">감정별 일기 수</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOOD_LIST.map((mood) => {
              const count = stats[mood];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const config = MOOD_CONFIG[mood];

              return (
                <div key={mood} className="flex items-center gap-3">
                  <span className="w-8 text-xl">{config.emoji}</span>
                  <span className="w-10 text-sm text-muted-foreground">
                    {config.label}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-sm font-medium">
                    {count}개
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}

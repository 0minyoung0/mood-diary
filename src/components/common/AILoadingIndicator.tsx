import { useState, useEffect } from "react";
import { useAI } from "@/contexts/AIContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ChevronUp, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function AILoadingIndicator() {
  const { status, progress, progressText } = useAI();
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (status === "ready") {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 500);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status !== "loading" && status !== "ready") {
    return null;
  }

  if (!visible) {
    return null;
  }

  const progressPercent = Math.round(progress * 100);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-500",
        fadeOut && "opacity-0 translate-y-2"
      )}
    >
      <Card
        className={cn(
          "cursor-pointer shadow-lg transition-all duration-200 hover:shadow-xl",
          expanded ? "w-72" : "w-auto"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                status === "ready"
                  ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                  : "bg-primary/10 text-primary"
              )}
            >
              {status === "ready" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4 animate-pulse" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">
                  {status === "ready" ? "AI 준비 완료" : "AI 로딩 중"}
                </span>
                {status === "loading" && (
                  <span className="text-xs text-muted-foreground">
                    {progressPercent}%
                  </span>
                )}
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {status === "loading" && !expanded && (
                <Progress value={progressPercent} className="mt-1 h-1" />
              )}
            </div>
          </div>

          {expanded && (
            <div className="mt-3 space-y-2">
              {status === "loading" && (
                <>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {progressText || "모델을 불러오는 중..."}
                  </p>
                </>
              )}
              {status === "ready" && (
                <p className="text-xs text-muted-foreground">
                  AI 감정 분석 기능을 사용할 수 있습니다
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

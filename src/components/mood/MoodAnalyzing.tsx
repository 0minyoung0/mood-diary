import { Brain } from "lucide-react";

export function MoodAnalyzing() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative rounded-full bg-primary/10 p-4">
          <Brain className="h-8 w-8 animate-pulse text-primary" />
        </div>
      </div>
      <p className="text-lg font-medium">감정을 분석하는 중...</p>
      <p className="mt-2 text-sm text-muted-foreground">AI가 일기를 읽고 있어요</p>
    </div>
  );
}

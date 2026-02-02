import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  progress: number;
  progressText: string;
}

export function LoadingScreen({ progress, progressText }: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight">Mood Diary</h1>
        <p className="mb-8 text-muted-foreground">AI 모델을 불러오는 중...</p>

        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-sm font-medium">{progress}%</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{progressText}</p>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          첫 실행 시 모델 다운로드에 시간이 걸릴 수 있습니다.
          <br />
          이후에는 캐시되어 빠르게 로딩됩니다.
        </p>
      </div>
    </div>
  );
}

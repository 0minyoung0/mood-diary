import { useAI } from "@/contexts/AIContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Clock } from "lucide-react";

interface AINotReadyDialogProps {
  open: boolean;
  onClose: () => void;
  onSaveWithoutAI: () => void;
  onWait: () => void;
}

export function AINotReadyDialog({
  open,
  onClose,
  onSaveWithoutAI,
  onWait,
}: AINotReadyDialogProps) {
  const { progress, progressText } = useAI();
  const progressPercent = Math.round(progress * 100);

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 모델 로딩 중
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                AI 감정 분석 기능이 아직 준비 중입니다.
                감정 분석 없이 저장하거나, 로딩이 완료될 때까지 기다릴 수 있습니다.
              </p>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">로딩 진행률</span>
                  <span className="text-muted-foreground">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                {progressText && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {progressText}
                  </p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onClose}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onSaveWithoutAI}
            className={buttonVariants({ variant: "outline" })}
          >
            감정 분석 없이 저장
          </AlertDialogAction>
          <AlertDialogAction onClick={onWait} className="gap-2">
            <Clock className="h-4 w-4" />
            대기하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

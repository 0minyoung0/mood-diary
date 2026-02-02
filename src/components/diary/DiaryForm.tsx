import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Hand } from "lucide-react";
import { useAI } from "@/contexts/AIContext";

interface DiaryFormProps {
  initialDate?: string;
  initialContent?: string;
  onSubmit: (date: string, content: string) => void;
  onDateChange?: (date: string) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function DiaryForm({
  initialDate,
  initialContent = "",
  onSubmit,
  onDateChange,
  isSubmitting = false,
  disabled = false,
}: DiaryFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(initialDate || today);
  const [content, setContent] = useState(initialContent);
  const { status, progress, isWebGPUSupported } = useAI();

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    onDateChange?.(newDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !disabled) {
      onSubmit(date, content.trim());
    }
  };

  const charCount = content.length;
  const maxChars = 5000;
  const isOverLimit = charCount > maxChars;

  const getButtonText = () => {
    if (disabled) return "다른 날짜를 선택해주세요";
    if (isSubmitting) return "분석 중...";
    if (!isWebGPUSupported) return "감정 직접 선택하기";
    if (status === "loading") {
      const progressPercent = Math.round(progress);
      return `AI로 감정 분석하기 (로딩: ${progressPercent}%)`;
    }
    return "AI로 감정 분석하기";
  };

  const ButtonIcon = isWebGPUSupported ? Sparkles : Hand;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">날짜</Label>
              <Input
                type="date"
                id="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                max={today}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">오늘 하루는 어땠나요?</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
                placeholder="오늘의 기분과 있었던 일을 자유롭게 적어주세요..."
                rows={12}
                className="resize-none"
                disabled={disabled}
              />
              <div className="flex justify-end">
                <span
                  className={`text-xs ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {charCount.toLocaleString()} / {maxChars.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={!content.trim() || isOverLimit || isSubmitting || disabled}
        className="w-full gap-2"
        size="lg"
      >
        <ButtonIcon className="h-4 w-4" />
        {getButtonText()}
      </Button>
    </form>
  );
}

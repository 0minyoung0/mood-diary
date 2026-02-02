import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Layout } from "@/components/common/Layout";
import { DiaryForm } from "@/components/diary/DiaryForm";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { MoodAnalyzing } from "@/components/mood/MoodAnalyzing";
import { MoodBadge } from "@/components/mood/MoodBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAI } from "@/contexts/AIContext";
import { diaryService } from "@/services/diaryService";
import { MOOD_CONFIG } from "@/constants/mood";
import { ArrowLeft, Check, Sparkles, Edit, Calendar } from "lucide-react";
import type { DiaryEntry, Mood } from "@/types";

type Step = "write" | "analyzing" | "confirm";

export function WritePage() {
  const navigate = useNavigate();
  const { date: paramDate } = useParams<{ date?: string }>();
  const { classifyMood } = useAI();

  const [step, setStep] = useState<Step>("write");
  const [diaryData, setDiaryData] = useState<{ date: string; content: string } | null>(null);
  const [suggestedMood, setSuggestedMood] = useState<Mood>("neutral");
  const [selectedMood, setSelectedMood] = useState<Mood>("neutral");
  const [existingEntry, setExistingEntry] = useState<DiaryEntry | null>(null);
  const [checkingDate, setCheckingDate] = useState<string | null>(null);

  // 날짜에 기존 일기가 있는지 확인
  const checkExistingEntry = async (date: string) => {
    setCheckingDate(date);
    try {
      const entry = await diaryService.getByDate(date);
      setExistingEntry(entry || null);
    } catch (error) {
      console.error("일기 확인 실패:", error);
      setExistingEntry(null);
    }
  };

  // 초기 로드 시 paramDate 확인
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const dateToCheck = paramDate || today;
    checkExistingEntry(dateToCheck);
  }, [paramDate]);

  const handleDateChange = (date: string) => {
    checkExistingEntry(date);
  };

  const handleSubmitDiary = async (date: string, content: string) => {
    // 해당 날짜에 이미 일기가 있는지 다시 확인
    const existing = await diaryService.getByDate(date);
    if (existing) {
      setExistingEntry(existing);
      return;
    }

    setDiaryData({ date, content });
    setStep("analyzing");

    try {
      const mood = await classifyMood(content);
      setSuggestedMood(mood);
      setSelectedMood(mood);
      setStep("confirm");
    } catch (error) {
      console.error("감정 분류 실패:", error);
      setSuggestedMood("neutral");
      setSelectedMood("neutral");
      setStep("confirm");
    }
  };

  const handleConfirm = async () => {
    if (!diaryData) return;

    try {
      await diaryService.create({
        date: diaryData.date,
        content: diaryData.content,
        mood: selectedMood,
      });
      navigate("/");
    } catch (error) {
      console.error("일기 저장 실패:", error);
      alert("일기 저장에 실패했습니다.");
    }
  };

  const handleBack = () => {
    setStep("write");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Layout>
      {step === "write" && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight">새 일기 쓰기</h2>
            <p className="text-sm text-muted-foreground">
              오늘의 이야기를 자유롭게 적어주세요
            </p>
          </div>

          {existingEntry && checkingDate && (
            <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-200">
                  <Calendar className="h-4 w-4" />
                  이미 작성된 일기가 있어요
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  {formatDate(checkingDate)}에 작성한 일기가 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-start gap-3 rounded-lg bg-white/50 p-3 dark:bg-black/20">
                  <MoodBadge mood={existingEntry.mood} size="lg" />
                  <p className="flex-1 text-sm text-amber-900 line-clamp-2 dark:text-amber-100">
                    {existingEntry.content}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/entry/${existingEntry.id}`}>
                      일기 보기
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1 gap-1">
                    <Link to={`/edit/${existingEntry.id}`}>
                      <Edit className="h-3.5 w-3.5" />
                      수정하기
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <DiaryForm
            initialDate={paramDate}
            onSubmit={handleSubmitDiary}
            onDateChange={handleDateChange}
            disabled={!!existingEntry}
          />
        </>
      )}

      {step === "analyzing" && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <MoodAnalyzing />
          </CardContent>
        </Card>
      )}

      {step === "confirm" && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight">감정 확인</h2>
            <p className="text-sm text-muted-foreground">
              AI가 분석한 감정을 확인하고 저장해주세요
            </p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                AI 분석 결과
              </CardTitle>
              <CardDescription>
                일기 내용을 바탕으로 감정을 분석했어요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-4">
                <span className="text-4xl">{MOOD_CONFIG[suggestedMood].emoji}</span>
                <div>
                  <p className="font-semibold">{MOOD_CONFIG[suggestedMood].label}</p>
                  <p className="text-sm text-muted-foreground">
                    AI가 분석한 오늘의 감정이에요
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">감정 선택</CardTitle>
              <CardDescription>
                다른 감정이 더 맞다면 직접 선택해주세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MoodPicker selected={selectedMood} onChange={setSelectedMood} />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1 gap-2">
              <ArrowLeft className="h-4 w-4" />
              다시 작성
            </Button>
            <Button onClick={handleConfirm} className="flex-1 gap-2">
              <Check className="h-4 w-4" />
              저장하기
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}

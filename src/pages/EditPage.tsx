import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/common/Layout";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { MoodAnalyzing } from "@/components/mood/MoodAnalyzing";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAI } from "@/contexts/AIContext";
import { diaryService } from "@/services/diaryService";
import { ArrowLeft, Save, Calendar, AlertCircle } from "lucide-react";
import type { DiaryEntry, Mood } from "@/types";

export function EditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { classifyMood, status, progress, isModelReady, isWebGPUSupported } = useAI();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood>("neutral");
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reanalyze, setReanalyze] = useState(false);

  useEffect(() => {
    const loadEntry = async () => {
      if (!id) return;

      try {
        const data = await diaryService.getById(id);
        if (data) {
          setEntry(data);
          setContent(data.content);
          setSelectedMood(data.mood);
        }
      } catch (error) {
        console.error("일기 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntry();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !content.trim()) return;

    let finalMood = selectedMood;

    if (reanalyze) {
      setIsAnalyzing(true);
      try {
        finalMood = await classifyMood(content);
        setSelectedMood(finalMood);
      } catch (error) {
        console.error("감정 재분류 실패:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }

    try {
      await diaryService.update(id, {
        content: content.trim(),
        mood: finalMood,
      });
      navigate(`/entry/${id}`);
    } catch (error) {
      console.error("일기 수정 실패:", error);
      alert("수정에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">불러오는 중...</p>
        </div>
      </Layout>
    );
  }

  if (!entry) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">일기를 찾을 수 없습니다.</p>
        </div>
      </Layout>
    );
  }

  const charCount = content.length;
  const maxChars = 5000;

  if (isAnalyzing) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6">
            <MoodAnalyzing />
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const formattedDate = new Date(entry.date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Layout>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 mb-2 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </Button>
        <h2 className="text-xl font-semibold tracking-tight">일기 수정</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
                rows={12}
                className="resize-none"
              />
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground">
                  {charCount.toLocaleString()} / {maxChars.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">감정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MoodPicker selected={selectedMood} onChange={setSelectedMood} />

            {isWebGPUSupported ? (
              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reanalyze"
                    checked={reanalyze}
                    onCheckedChange={(checked) => setReanalyze(checked === true)}
                    disabled={!isModelReady}
                  />
                  <label
                    htmlFor="reanalyze"
                    className={`text-sm cursor-pointer ${!isModelReady ? "text-muted-foreground/60" : "text-muted-foreground"}`}
                  >
                    AI로 감정 다시 분석하기
                    {status === "loading" && ` (로딩: ${Math.round(progress)}%)`}
                  </label>
                </div>
                {status === "loading" && (
                  <Progress value={progress} className="h-1" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>AI 감정 분석 기능을 사용할 수 없습니다 (WebGPU 미지원)</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={!content.trim()}
            className="flex-1 gap-2"
          >
            <Save className="h-4 w-4" />
            저장하기
          </Button>
        </div>
      </form>
    </Layout>
  );
}

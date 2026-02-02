import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/common/Layout";
import { MoodBadge } from "@/components/mood/MoodBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { diaryService } from "@/services/diaryService";
import { ArrowLeft, Edit, Trash2, Calendar } from "lucide-react";
import type { DiaryEntry } from "@/types";

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEntry = async () => {
      if (!id) return;

      try {
        const data = await diaryService.getById(id);
        setEntry(data || null);
      } catch (error) {
        console.error("일기 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntry();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      await diaryService.delete(id);
      navigate("/");
    } catch (error) {
      console.error("일기 삭제 실패:", error);
      alert("삭제에 실패했습니다.");
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
          <Button asChild variant="link" className="mt-4">
            <Link to="/">목록으로 돌아가기</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const formattedDate = new Date(entry.date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <Layout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formattedDate}
              </div>
              <MoodBadge mood={entry.mood} showLabel size="md" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed text-foreground">
            {entry.content}
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline" className="flex-1 gap-2">
          <Link to={`/edit/${entry.id}`}>
            <Edit className="h-4 w-4" />
            수정
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>일기 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말 이 일기를 삭제하시겠습니까?
                <br />
                삭제된 일기는 복구할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}

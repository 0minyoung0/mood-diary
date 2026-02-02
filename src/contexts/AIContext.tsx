import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { aiService } from "../services/aiService";
import type { AIStatus, Mood } from "../types";

interface AIContextValue {
  status: AIStatus;
  progress: number;
  progressText: string;
  error: string | null;
  classifyMood: (content: string) => Promise<Mood>;
}

const AIContext = createContext<AIContextValue | null>(null);

interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const [status, setStatus] = useState<AIStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkWebGPU = async () => {
      if (!navigator.gpu) {
        setStatus("error");
        setError(
          "WebGPU를 지원하지 않는 브라우저입니다. Chrome 113+ 또는 Edge 113+를 사용해주세요."
        );
        return false;
      }
      return true;
    };

    const initializeAI = async () => {
      const hasWebGPU = await checkWebGPU();
      if (!hasWebGPU) return;

      setStatus("loading");
      setProgress(0);

      try {
        await aiService.initialize((prog, text) => {
          setProgress(prog);
          setProgressText(text);
        });
        setStatus("ready");
      } catch (err) {
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "AI 모델 로딩에 실패했습니다."
        );
      }
    };

    initializeAI();

    return () => {
      aiService.dispose();
    };
  }, []);

  const classifyMood = useCallback(async (content: string): Promise<Mood> => {
    if (!aiService.isReady()) {
      throw new Error("AI 모델이 준비되지 않았습니다.");
    }
    return aiService.classifyMood(content);
  }, []);

  return (
    <AIContext.Provider
      value={{ status, progress, progressText, error, classifyMood }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI(): AIContextValue {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
}

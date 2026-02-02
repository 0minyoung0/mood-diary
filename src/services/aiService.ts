import {
  MLCEngine,
  type InitProgressReport,
  type InitProgressCallback,
} from "@mlc-ai/web-llm";
import type { Mood } from "../types";

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

let engine: MLCEngine | null = null;

export const aiService = {
  async initialize(
    onProgress: (progress: number, text: string) => void,
  ): Promise<void> {
    if (engine) return;

    const progressCallback: InitProgressCallback = (report: InitProgressReport) => {
      const progress = Math.round(report.progress * 100);
      onProgress(progress, report.text);
    };

    engine = new MLCEngine({
      initProgressCallback: progressCallback,
    });

    await engine.reload(MODEL_ID);
  },

  isReady(): boolean {
    return engine !== null;
  },

  async classifyMood(content: string): Promise<Mood> {
    if (!engine) {
      throw new Error("AI 모델이 초기화되지 않았습니다.");
    }

    const systemPrompt = `You are a mood classifier for diary entries. Analyze the emotional tone of the text and classify it into exactly ONE of these moods:
- happy: joy, satisfaction, gratitude, excitement
- sad: depression, loneliness, disappointment, longing
- angry: anger, irritation, frustration, resentment
- anxious: worry, fear, nervousness, stress
- neutral: calm, ordinary, everyday

Respond with ONLY a JSON object in this exact format: {"mood": "happy"} or {"mood": "sad"} etc.
Do not include any other text or explanation.`;

    try {
      const response = await engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content },
        ],
        temperature: 0.1,
        max_tokens: 50,
      });

      const responseText = response.choices[0]?.message?.content || "";
      const jsonMatch = responseText.match(
        /\{[^}]*"mood"\s*:\s*"([^"]+)"[^}]*\}/,
      );

      if (jsonMatch && jsonMatch[1]) {
        const mood = jsonMatch[1] as Mood;
        const validMoods: Mood[] = [
          "happy",
          "sad",
          "angry",
          "anxious",
          "neutral",
        ];
        if (validMoods.includes(mood)) {
          return mood;
        }
      }

      console.warn("AI 응답 파싱 실패, 기본값 반환:", responseText);
      return "neutral";
    } catch (error) {
      console.error("AI 분류 오류:", error);
      return "neutral";
    }
  },

  dispose(): void {
    if (engine) {
      engine.unload();
      engine = null;
    }
  },
};

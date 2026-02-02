import { MOOD_CONFIG, MOOD_LIST } from "@/constants/mood";
import type { Mood } from "@/types";
import { cn } from "@/lib/utils";

interface MoodPickerProps {
  selected: Mood;
  onChange: (mood: Mood) => void;
}

export function MoodPicker({ selected, onChange }: MoodPickerProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {MOOD_LIST.map((mood) => {
        const config = MOOD_CONFIG[mood];
        const isSelected = mood === selected;

        return (
          <button
            key={mood}
            onClick={() => onChange(mood)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-transparent bg-muted/50 hover:bg-muted"
            )}
          >
            <span className="text-3xl">{config.emoji}</span>
            <span
              className={cn(
                "text-sm",
                isSelected ? "font-semibold text-primary" : "text-muted-foreground"
              )}
            >
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

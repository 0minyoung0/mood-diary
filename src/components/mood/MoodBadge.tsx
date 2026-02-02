import { Badge } from "@/components/ui/badge";
import { MOOD_CONFIG } from "@/constants/mood";
import type { Mood } from "@/types";
import { cn } from "@/lib/utils";

interface MoodBadgeProps {
  mood: Mood;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MoodBadge({ mood, showLabel = false, size = "md" }: MoodBadgeProps) {
  const config = MOOD_CONFIG[mood];

  const sizeClasses = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
  };

  if (showLabel) {
    return (
      <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
        <span className={sizeClasses[size]}>{config.emoji}</span>
        <span className="font-medium">{config.label}</span>
      </Badge>
    );
  }

  return <span className={cn(sizeClasses[size])}>{config.emoji}</span>;
}

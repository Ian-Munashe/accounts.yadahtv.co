import { cn } from "@heroui/react";
import { GiCheckMark } from "react-icons/gi";

interface Props {
  step: number;
  label: string;
  active?: boolean;
  completed?: boolean;
}

export const StepPill: React.FC<Props> = ({ active = false, completed = false, ...props }) => (
  <div className="flex items-center gap-2">
    <span
      className={cn(
        "bg-default text-muted flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
        {
          "bg-accent text-accent-foreground": active,
          "bg-green-500 text-white": completed,
        },
      )}
    >
      {completed ? <GiCheckMark /> : props.step}
    </span>
    <span className={cn("text-muted text-sm font-medium capitalize", { "text-foreground": active })}>
      {props.label}
    </span>
  </div>
);

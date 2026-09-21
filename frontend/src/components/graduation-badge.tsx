import { cn } from "@/lib/cn";
import { PHASE_LABEL, type GraduationPhase } from "@/lib/types";

export function GraduationBadge({ phase, graduated }: { phase: GraduationPhase; graduated?: boolean }) {
  const label = graduated && phase === 0 ? "Graduated" : PHASE_LABEL[phase];
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs",
        phase === 2 || graduated ? "bg-[#5eead4]/20 text-[#147a4e]" : "bg-white/10",
        phase === 1 && "bg-amber-400/20",
        phase === 3 && "bg-rose-400/20",
      )}
    >
      {label}
    </span>
  );
}

import { cn } from "@/lib/cn";
import { PHASE_LABEL, type GraduationPhase } from "@/lib/types";

export function GraduationBadge({ phase, graduated }: { phase: GraduationPhase; graduated?: boolean }) {
  const label = graduated && phase === 0 ? "Graduated" : PHASE_LABEL[phase];
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        phase === 2 || graduated ? "bg-[#5eead4]/20 text-[#147a4e]" : "bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]",
        phase === 1 && "bg-amber-400/20 text-amber-800 dark:text-amber-200",
        phase === 3 && "bg-rose-400/20 text-rose-700 dark:text-rose-200",
      )}
    >
      {label}
    </span>
  );
}

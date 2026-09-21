import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

export function BrandMark({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#10141C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
          <path
            d="M9.2 22.8C12.8 22.8 14.4 19.6 16 16C17.6 12.4 19.2 9.2 22.8 9.2"
            stroke="#5EEAD4"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M9.2 9.2C12.8 9.2 14.4 12.4 16 16C17.6 19.6 19.2 22.8 22.8 22.8"
            stroke="#7C8CFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="16" cy="16" r="1.7" fill="#F4F6F8" />
        </svg>
      </span>
      {showWordmark ? (
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.03em]">
          {APP_NAME}
        </span>
      ) : null}
    </span>
  );
}

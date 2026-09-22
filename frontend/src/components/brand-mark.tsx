import Image from "next/image";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

export function BrandMark({
  className,
  showWordmark = false,
  size = 36,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt={APP_NAME}
        width={size}
        height={size}
        className="rounded-2xl shadow-[0_10px_24px_-16px_rgba(18,20,16,0.55)]"
        priority
      />
      {showWordmark ? (
        <span className="font-[family-name:var(--font-display)] text-[1.35rem] font-semibold lowercase tracking-tight">
          {APP_NAME}
        </span>
      ) : null}
    </span>
  );
}

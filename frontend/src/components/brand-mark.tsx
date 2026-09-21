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
    <span className={cn("flex items-center gap-2", className)}>
      <Image src="/logo.png" alt={APP_NAME} width={size} height={size} className="rounded-xl" priority />
      {showWordmark ? (
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold lowercase tracking-tight">
          {APP_NAME}
        </span>
      ) : null}
    </span>
  );
}

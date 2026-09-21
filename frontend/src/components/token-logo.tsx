"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { isAllowedRemoteMediaUrl, mediaProxyUrl } from "@/lib/ipfs";

const SIZES = {
  sm: "h-11 w-11 rounded-xl",
  md: "h-14 w-14 rounded-2xl",
  lg: "h-28 w-28 rounded-3xl",
  xl: "aspect-square w-full rounded-[28px]",
} as const;

export function TokenLogo({
  src,
  uri,
  alt,
  size = "md",
  className,
}: {
  src?: string;
  uri?: string;
  alt: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initial = useMemo(() => {
    if (src?.startsWith("blob:") || src?.startsWith("data:") || src?.startsWith("/")) return src;
    if (src && /^https?:\/\//i.test(src) && !isAllowedRemoteMediaUrl(src)) return src;
    if (src) return mediaProxyUrl(src);
    if (uri) return mediaProxyUrl(uri);
    return "";
  }, [src, uri]);

  const [current, setCurrent] = useState(initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(initial);
    setFailed(false);
  }, [initial]);

  const fallback = (() => {
    const cleaned = alt.replace(/\$/g, "").replace(/^0x[a-fA-F0-9]+$/i, "").trim();
    return (cleaned.slice(0, 1) || "F").toUpperCase();
  })();

  return (
    <div
      className={cn(
        "logo-frame relative shrink-0 overflow-hidden bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]",
        SIZES[size],
        className,
      )}
    >
      {current && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt={alt}
          className="token-logo-img absolute inset-0 block h-full w-full object-cover object-center"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="grid h-full w-full place-items-center text-sm font-semibold text-[var(--muted)]">
          {fallback}
        </span>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { ACCEPTED_MEDIA_LABEL, detectAnimation, isAllowedMediaFile, sniffMediaType, MAX_MEDIA_BYTES } from "@/lib/ipfs";
import { TokenLogo } from "./token-logo";

export function MediaUpload({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null, preview: string, animated: boolean) => void;
}) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handle(next: File | null) {
    setError("");
    setAnimated(false);
    if (!next) {
      setPreview("");
      onChange(null, "", false);
      return;
    }
    if (next.size > MAX_MEDIA_BYTES) {
      setError("Max file size is 8 MB.");
      return;
    }
    if (!isAllowedMediaFile(next)) {
      setError(`Use ${ACCEPTED_MEDIA_LABEL}`);
      return;
    }
    const sniff = await sniffMediaType(next);
    if (!sniff) {
      setError("Could not verify image type.");
      return;
    }
    const isAnimated = await detectAnimation(next);
    const url = URL.createObjectURL(next);
    setPreview(url);
    setAnimated(isAnimated);
    onChange(next, url, isAnimated);
  }

  return (
    <label
      className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--line)] bg-[color-mix(in_srgb,var(--bg1)_55%,transparent)] p-4 text-center hover:border-[color-mix(in_srgb,var(--ink)_18%,transparent)] hover:bg-[var(--panel)]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handle(e.dataTransfer.files?.[0] ?? null).catch(() => undefined);
      }}
    >
      {preview ? (
        <div className="flex flex-col items-center">
          <TokenLogo src={preview} alt="Token art preview" size="lg" />
          {animated ? <span className="chip chip-active mt-3">Animated art detected</span> : null}
        </div>
      ) : (
        <>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--lime)] text-black">
            <ImagePlus size={20} />
          </span>
          <p className="mt-3 font-medium">Choose image</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--muted)]">{ACCEPTED_MEDIA_LABEL}</p>
        </>
      )}
      <input
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0] ?? null)}
      />
      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}
      {file ? <p className="mt-2 text-xs text-[var(--muted)]">{file.name}</p> : null}
    </label>
  );
}

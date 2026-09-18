"use client";

import { useEffect, useState } from "react";
import { ACCEPTED_MEDIA_LABEL, isAllowedMediaFile, sniffMediaType, MAX_MEDIA_BYTES } from "@/lib/ipfs";

export function MediaUpload({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null, preview: string) => void;
}) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handle(next: File | null) {
    setError("");
    if (!next) {
      setPreview("");
      onChange(null, "");
      return;
    }
    if (next.size > MAX_MEDIA_BYTES) {
      setError("Max file size is 4 MB.");
      return;
    }
    if (!isAllowedMediaFile(next)) {
      setError(`Use ${ACCEPTED_MEDIA_LABEL}.`);
      return;
    }
    const sniff = await sniffMediaType(next);
    if (!sniff) {
      setError("Could not verify image type.");
      return;
    }
    const url = URL.createObjectURL(next);
    setPreview(url);
    onChange(next, url);
  }

  return (
    <label className="glass flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border-dashed p-4 text-center">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Token art" className="h-32 w-32 rounded-2xl object-cover" />
      ) : (
        <>
          <p className="font-medium">Drop token art</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{ACCEPTED_MEDIA_LABEL}</p>
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

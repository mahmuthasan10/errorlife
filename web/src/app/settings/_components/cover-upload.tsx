"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadCover } from "@/app/actions/upload";
import { toast } from "sonner";

interface CoverUploadProps {
  currentCoverUrl: string | null;
}

export default function CoverUpload({ currentCoverUrl }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displaySrc = preview ?? currentCoverUrl;

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadCover(formData);
      if (result.error) {
        toast.error(result.error);
        setPreview(null);
      } else {
        toast.success(result.success ?? "Kapak fotoğrafı güncellendi.");
      }
      URL.revokeObjectURL(objectUrl);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="group relative block w-full"
        aria-label="Kapak fotoğrafını değiştir"
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="Kapak fotoğrafı"
            className="h-32 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900">
            <div className="flex flex-col items-center gap-1 text-zinc-500">
              <Camera size={22} />
              <span className="text-xs">Kapak fotoğrafı ekle</span>
            </div>
          </div>
        )}

        {/* Overlay */}
        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {isPending ? (
            <Loader2 size={24} className="animate-spin text-white" />
          ) : (
            <div className="flex items-center gap-2 text-white">
              <Camera size={20} />
              <span className="text-sm font-semibold">Değiştir</span>
            </div>
          )}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
        disabled={isPending}
      />
    </div>
  );
}

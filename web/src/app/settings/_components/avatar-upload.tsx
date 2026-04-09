"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatar } from "@/app/actions/upload";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  displayName: string;
}

export default function AvatarUpload({ currentAvatarUrl, displayName }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displaySrc = preview ?? currentAvatarUrl;

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      if (result.error) {
        toast.error(result.error);
        setPreview(null);
      } else {
        toast.success(result.success ?? "Profil fotoğrafı güncellendi.");
      }
      // Obje URL'ini serbest bırak
      URL.revokeObjectURL(objectUrl);
      // Input'u sıfırla (aynı dosyayı tekrar seçebilmek için)
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="relative w-fit">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="group relative block"
        aria-label="Profil fotoğrafını değiştir"
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={displayName}
            className="h-20 w-20 rounded-full border-2 border-zinc-800 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-800 text-2xl font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Overlay */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {isPending ? (
            <Loader2 size={20} className="animate-spin text-white" />
          ) : (
            <Camera size={20} className="text-white" />
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

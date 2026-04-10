"use client";

import { useState, useRef } from "react";
import { User, Sparkles, Loader2, X, ImagePlus } from "lucide-react";
import { createPost } from "@/app/actions";
import { optimizePostContent } from "@/app/actions/ai";
import { uploadPostImage } from "@/app/actions/upload";
import { usePostFeed } from "./post-feed-context";

export default function CreatePostForm() {
  const { setPendingPost, clearPendingPost } = usePostFeed();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [content, setContent] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isAIDisabled = isLoadingAI || content.trim().length < 10;

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    // Optimistic: immediately show a pending skeleton in the feed
    setPendingPost(content.trim());

    try {
      if (suggestedTags.length > 0) {
        formData.set("tags", JSON.stringify(suggestedTags));
      }

      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.set("file", imageFile);
        const uploadResult = await uploadPostImage(uploadFormData);
        if (uploadResult.error) {
          clearPendingPost();
          setError(uploadResult.error);
          setLoading(false);
          return;
        }
        if (uploadResult.url) {
          formData.set("image_url", uploadResult.url);
        }
      }

      const result = await createPost(formData);
      if (result.error) {
        clearPendingPost();
        setError(result.error);
      } else {
        setContent("");
        setSuggestedTags([]);
        setImageFile(null);
        setImagePreview(null);
        formRef.current?.reset();
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        // Realtime will fire with the real post; clear pending after a brief delay
        setTimeout(clearPendingPost, 3000);
      }
    } catch {
      clearPendingPost();
      setError("Beklenmeyen bir hata olustu. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function handleAIOptimize() {
    if (isAIDisabled) return;

    setError(null);
    setIsLoadingAI(true);

    try {
      const result = await optimizePostContent(content);

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setContent(result.data.optimizedText);
        setSuggestedTags(result.data.suggestedTags);

        if (textareaRef.current) {
          textareaRef.current.value = result.data.optimizedText;
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }
    } catch {
      setError("AI servisi su anda yanit veremiyor.");
    } finally {
      setIsLoadingAI(false);
    }
  }

  function removeTag(tagToRemove: string) {
    setSuggestedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }

  function extractHashtags(text: string): string[] {
    const regex = /(?:^|\s)#([a-zA-Z0-9\u00C0-\u024F\u011F\u00FC\u015F\u00F6\u00E7\u0131\u0130\u011E\u00DC\u015E\u00D6\u00C7]{1,30})/g;
    const found: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const tag = match[1].toLowerCase();
      if (!found.includes(tag)) found.push(tag);
    }
    return found;
  }

  function handleTextareaInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const target = e.currentTarget;
    const newContent = target.value;
    setContent(newContent);
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;

    // İçerikten hashtag'leri tespit et ve mevcut etiket listesiyle birleştir
    const detected = extractHashtags(newContent);
    setSuggestedTags((prev) => {
      const merged = [...prev];
      detected.forEach((tag) => {
        if (!merged.includes(tag)) merged.push(tag);
      });
      // İçerikten kaldırılan hashtag'leri de listeden çıkar
      return merged.filter(
        (tag) => detected.includes(tag) || prev.includes(tag)
      );
    });
  }

  return (
    <div className="border-b border-zinc-800 px-4 py-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800">
          <User size={20} className="text-zinc-400" />
        </div>

        <form ref={formRef} action={handleSubmit} className="flex-1">
          <textarea
            ref={textareaRef}
            name="content"
            placeholder="Bir sorun mu yasiyorsun? Paylas..."
            rows={2}
            maxLength={500}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onInput={handleTextareaInput}
            readOnly={isLoadingAI}
            className="w-full resize-none bg-transparent text-lg text-white placeholder-zinc-600 outline-none disabled:opacity-50"
          />

          {imagePreview && (
            <div className="relative mb-3 mt-2 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Gorsel onizleme"
                className="max-h-80 w-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-opacity hover:opacity-80"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {suggestedTags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {suggestedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-400"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full p-0.5 transition-colors hover:bg-violet-500/30"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && (
            <p className="mb-2 text-sm text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
            <div className="flex items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={loading || isLoadingAI}
                className="flex items-center justify-center rounded-full p-2 text-blue-400 transition-colors hover:bg-blue-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                title="Gorsel ekle"
              >
                <ImagePlus size={18} />
              </button>

              <button
                type="button"
                onClick={handleAIOptimize}
                disabled={isAIDisabled}
                className="flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoadingAI ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Iyilestiriliyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>AI ile Iyilestir</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || isLoadingAI}
              className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Paylasiliyor..." : "Paylas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

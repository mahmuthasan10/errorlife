"use client";

import { useState, useRef } from "react";
import { User, Sparkles, Loader2, X } from "lucide-react";
import { createPost } from "@/app/actions";
import { optimizePostContent } from "@/app/actions/ai";

export default function CreatePostForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [content, setContent] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAIDisabled = isLoadingAI || content.trim().length < 10;

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      if (suggestedTags.length > 0) {
        formData.set("tags", JSON.stringify(suggestedTags));
      }

      const result = await createPost(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
        setSuggestedTags([]);
        formRef.current?.reset();
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
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
      setError("AI servisi şu anda yanıt veremiyor.");
    } finally {
      setIsLoadingAI(false);
    }
  }

  function removeTag(tagToRemove: string) {
    setSuggestedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }

  function handleTextareaInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const target = e.currentTarget;
    setContent(target.value);
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
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
            placeholder="Bir sorun mu yaşıyorsun? Paylaş..."
            rows={2}
            maxLength={500}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onInput={handleTextareaInput}
            readOnly={isLoadingAI}
            className="w-full resize-none bg-transparent text-lg text-white placeholder-zinc-600 outline-none disabled:opacity-50"
          />

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
            <button
              type="button"
              onClick={handleAIOptimize}
              disabled={isAIDisabled}
              className="flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>İyileştiriliyor...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>✨ AI ile İyileştir</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={loading || isLoadingAI}
              className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Paylaşılıyor..." : "Paylaş"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

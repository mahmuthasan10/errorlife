"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, X, Loader2 } from "lucide-react";
import { editPost } from "@/app/actions";
import { LIMITS } from "@errorlife/shared/schemas";

interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface EditPostButtonProps {
  postId: string;
  initialContent: string;
  initialTags: Tag[];
  onSuccess?: (newContent: string, newTags: Tag[]) => void;
}

function extractHashtags(text: string): string[] {
  // Tag'in arkasında whitespace veya string sonu şart — kısmi match'leri yakalamaz
  const regex =
    /(?:^|\s)#([a-zA-Z0-9\u00C0-\u024F\u011F\u00FC\u015F\u00F6\u00E7\u0131\u0130\u011E\u00DC\u015E\u00D6\u00C7]{1,30})(?=\s|$)/g;
  const found: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const tag = match[1].toLowerCase();
    if (!found.includes(tag)) found.push(tag);
  }
  return found;
}

export default function EditPostButton({
  postId,
  initialContent,
  initialTags,
  onSuccess,
}: EditPostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags.map((t) => t.name));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isOpen]);

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setContent(initialContent);
    setTags(initialTags.map((t) => t.name));
    setError(null);
    setIsOpen(true);
  }

  function handleClose(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setIsOpen(false);
    setError(null);
  }

  function handleTextarea(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const val = el.value;
    setContent(val);
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;

    const detected = extractHashtags(val);
    setTags(Array.from(new Set(detected)));
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const result = await editPost(postId, content, tags);
      if (result.error) {
        setError(result.error);
      } else {
        const now = new Date().toISOString();
        const newTagObjects: Tag[] = tags.map((name) => ({
          id: name,
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
          created_at: now,
        }));
        onSuccess?.(content.trim(), newTagObjects);
        setIsOpen(false);
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="text-zinc-600 transition-colors hover:text-blue-400"
        title="Gönderiyi düzenle"
      >
        <Pencil size={15} />
      </button>
    );
  }

  return (
    <div
      className="absolute inset-0 z-20 rounded-none bg-black px-4 py-3"
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onInput={handleTextarea}
        onChange={(e) => setContent(e.target.value)}
        maxLength={LIMITS.post.content.max}
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-white outline-none"
        rows={3}
      />

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-400"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full p-0.5 transition-colors hover:bg-violet-500/30"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2">
        <span className="text-xs text-zinc-600">
          {content.length}/{LIMITS.post.content.max}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-full px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            onClick={handleSave}
            disabled={loading || content.trim().length === 0}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Kaydet"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

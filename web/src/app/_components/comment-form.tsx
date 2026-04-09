"use client";

import { useOptimistic, useTransition, useRef, useState } from "react";
import Link from "next/link";
import { Send, Trash2 } from "lucide-react";
import { addComment, deleteComment } from "@/app/actions/interactions";
import type { CommentWithAuthor } from "@/types/database";

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin}dk`;
  if (diffHours < 24) return `${diffHours}sa`;
  return `${diffDays}g`;
}

interface CommentSectionProps {
  postId: string;
  initialComments: CommentWithAuthor[];
  currentUserName?: string;
  currentUserDisplayName?: string;
  currentUserId?: string;
}

export default function CommentSection({
  postId,
  initialComments,
  currentUserName,
  currentUserDisplayName,
  currentUserId,
}: CommentSectionProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticComments, updateOptimisticComments] = useOptimistic(
    initialComments,
    (
      current: CommentWithAuthor[],
      action: { type: "add"; comment: CommentWithAuthor } | { type: "delete"; id: string }
    ) => {
      if (action.type === "add") return [action.comment, ...current];
      return current.filter((c) => c.id !== action.id);
    }
  );

  function handleSubmit(formData: FormData) {
    const content = (formData.get("content") as string)?.trim();

    if (!content) return;

    setError(null);

    const optimisticComment: CommentWithAuthor = {
      id: `temp-${Date.now()}`,
      user_id: currentUserId ?? "",
      post_id: postId,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        id: "",
        username: currentUserName ?? "sen",
        display_name: currentUserDisplayName ?? "Sen",
        avatar_url: null,
        cover_url: null,
        bio: null,
        followers_count: 0,
        following_count: 0,
        created_at: "",
        updated_at: "",
      },
    };

    startTransition(async () => {
      updateOptimisticComments({ type: "add", comment: optimisticComment });
      formRef.current?.reset();

      const result = await addComment(postId, content);

      if (result.error) {
        setError(result.error);
      }
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      updateOptimisticComments({ type: "delete", id: commentId });
      await deleteComment(commentId, postId);
    });
  }

  return (
    <div>
      {/* Yorum formu */}
      <form
        ref={formRef}
        action={handleSubmit}
        className="flex gap-3 border-b border-zinc-800 px-4 py-3"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800">
          <span className="text-xs font-bold text-zinc-300">
            {(currentUserDisplayName ?? "?").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            name="content"
            placeholder="Yanıtını yaz..."
            maxLength={500}
            autoComplete="off"
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </form>

      {error && (
        <div className="px-4 py-2 text-sm text-red-400">{error}</div>
      )}

      {/* Yorum listesi */}
      <div>
        {optimisticComments.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-600">
            Henüz yorum yok. İlk yorumu sen yap!
          </div>
        ) : (
          optimisticComments.map((comment) => (
            <div
              key={comment.id}
              className={`flex gap-3 border-b border-zinc-800/50 px-4 py-3 ${
                comment.id.startsWith("temp-") ? "opacity-60" : ""
              }`}
            >
              <Link
                href={`/profile/${comment.profiles.username}`}
                className="shrink-0 transition-opacity hover:opacity-80"
              >
                {comment.profiles.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comment.profiles.avatar_url}
                    alt={comment.profiles.display_name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                    <span className="text-xs font-bold text-zinc-300">
                      {comment.profiles.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${comment.profiles.username}`}
                    className="truncate text-sm font-bold text-white hover:underline"
                  >
                    {comment.profiles.display_name}
                  </Link>
                  <Link
                    href={`/profile/${comment.profiles.username}`}
                    className="truncate text-sm text-zinc-500 hover:underline"
                  >
                    @{comment.profiles.username}
                  </Link>
                  <span className="text-zinc-600">·</span>
                  <span className="shrink-0 text-sm text-zinc-500">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                  {currentUserId && comment.user_id === currentUserId && !comment.id.startsWith("temp-") && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={isPending}
                      className="ml-auto flex items-center text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-40"
                      title="Yorumu sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

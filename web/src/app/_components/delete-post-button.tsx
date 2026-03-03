"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/app/actions";

export default function DeletePostButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (loading) return;
    setLoading(true);

    try {
      const result = await deletePost(postId);
      if (result.error) {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="ml-auto text-zinc-600 transition-colors hover:text-red-500 disabled:opacity-50"
      title="Gönderiyi sil"
    >
      <Trash2 size={16} />
    </button>
  );
}

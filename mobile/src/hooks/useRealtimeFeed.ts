import { useEffect } from "react";
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";
import type { Post, PostWithAuthor } from "@errorlife/shared/types";
import { supabase } from "../lib/supabase";

type SetPosts = React.Dispatch<React.SetStateAction<PostWithAuthor[]>>;

export type UseRealtimeFeedParams = {
  setPosts: SetPosts;
  onNewPost: () => void;
};

export function useRealtimeFeed({ setPosts, onNewPost }: UseRealtimeFeedParams): void {
  useEffect(() => {
    const channel = supabase
      .channel("feed:posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (_payload: RealtimePostgresInsertPayload<Post>) => {
          onNewPost();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload: RealtimePostgresUpdatePayload<Post>) => {
          const updated = payload.new;
          setPosts((prev) =>
            prev.map((post) =>
              post.id === updated.id
                ? {
                    ...post,
                    content: updated.content,
                    image_url: updated.image_url,
                    like_count: updated.like_count,
                    comment_count: updated.comment_count,
                    bookmark_count: updated.bookmark_count,
                    updated_at: updated.updated_at,
                  }
                : post
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload: RealtimePostgresDeletePayload<Post>) => {
          const deletedId = (payload.old as Partial<Post>).id;
          if (!deletedId) return;
          setPosts((prev) => prev.filter((post) => post.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setPosts, onNewPost]);
}

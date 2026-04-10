"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PostFeedContextValue {
  isPendingPost: boolean;
  pendingContent: string;
  setPendingPost: (content: string) => void;
  clearPendingPost: () => void;
}

const PostFeedContext = createContext<PostFeedContextValue | null>(null);

export function PostFeedProvider({ children }: { children: ReactNode }) {
  const [pendingContent, setPendingContent] = useState("");

  function setPendingPost(content: string) {
    setPendingContent(content);
  }

  function clearPendingPost() {
    setPendingContent("");
  }

  return (
    <PostFeedContext.Provider
      value={{
        isPendingPost: pendingContent.length > 0,
        pendingContent,
        setPendingPost,
        clearPendingPost,
      }}
    >
      {children}
    </PostFeedContext.Provider>
  );
}

export function usePostFeed() {
  const ctx = useContext(PostFeedContext);
  if (!ctx) throw new Error("usePostFeed must be used within PostFeedProvider");
  return ctx;
}

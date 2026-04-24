"use client";

import { useRouter } from "next/navigation";
import DeletePostButton from "./delete-post-button";
import EditPostButton from "./edit-post-button";

interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface PostOwnerActionsProps {
  postId: string;
  initialContent: string;
  initialTags: Tag[];
}

export default function PostOwnerActions({
  postId,
  initialContent,
  initialTags,
}: PostOwnerActionsProps) {
  const router = useRouter();

  return (
    <div className="ml-auto flex items-center gap-2">
      <EditPostButton
        postId={postId}
        initialContent={initialContent}
        initialTags={initialTags}
        onSuccess={() => router.refresh()}
      />
      <DeletePostButton postId={postId} />
    </div>
  );
}

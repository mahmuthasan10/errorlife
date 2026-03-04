import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getPostById,
  getCommentsByPostId,
  getPostInteractionState,
} from "@/lib/post-queries";
import PostModal from "@/app/_components/post-modal";
import PostDetailContent from "@/app/_components/post-detail-content";

interface ModalPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function ModalPostPage({ params }: ModalPostPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [post, comments] = await Promise.all([
    getPostById(id),
    getCommentsByPostId(id),
  ]);

  if (!post) {
    notFound();
  }

  const { isLiked, isBookmarked } = user
    ? await getPostInteractionState(id, user.id)
    : { isLiked: false, isBookmarked: false };

  // Mevcut kullanıcının profilini al
  let currentUserName: string | undefined;
  let currentUserDisplayName: string | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();

    currentUserName = profile?.username;
    currentUserDisplayName = profile?.display_name;
  }

  return (
    <PostModal>
      <PostDetailContent
        post={post}
        comments={comments}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
        currentUserName={currentUserName}
        currentUserDisplayName={currentUserDisplayName}
      />
    </PostModal>
  );
}

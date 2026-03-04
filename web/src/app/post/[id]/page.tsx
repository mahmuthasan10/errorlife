import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  getPostById,
  getCommentsByPostId,
  getPostInteractionState,
} from "@/lib/post-queries";
import PostDetailContent from "@/app/_components/post-detail-content";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
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
    <div className="mx-auto min-h-screen max-w-xl border-x border-zinc-800">
      {/* Üst başlık */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-zinc-900"
        >
          <ArrowLeft size={18} />
        </Link>
        <h2 className="text-xl font-bold">Gönderi</h2>
      </div>

      <PostDetailContent
        post={post}
        comments={comments}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
        currentUserName={currentUserName}
        currentUserDisplayName={currentUserDisplayName}
      />
    </div>
  );
}

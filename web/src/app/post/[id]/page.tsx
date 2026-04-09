import { notFound } from "next/navigation";
import type { Metadata } from "next";
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

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "Gönderi | ErrorLife" };
  const preview = post.content.slice(0, 60) + (post.content.length > 60 ? "..." : "");
  return {
    title: `${post.profiles.display_name}: "${preview}" | ErrorLife`,
    description: post.content,
  };
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
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-zinc-800 bg-black px-4 py-3">
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
        currentUserId={user?.id}
      />
    </div>
  );
}

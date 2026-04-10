import { getUserLikedPosts } from "@/lib/profile-queries";
import LikesListClient from "./likes-list-client";

export default async function LikesTab({ userId }: { userId: string }) {
  const { posts, nextCursor } = await getUserLikedPosts(userId);
  return (
    <LikesListClient
      initialPosts={posts}
      userId={userId}
      initialCursor={nextCursor}
    />
  );
}

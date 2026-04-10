import { getUserPosts } from "@/lib/profile-queries";
import PostsListClient from "./posts-list-client";

export default async function PostsTab({ userId }: { userId: string }) {
  const posts = await getUserPosts(userId);
  return <PostsListClient initialPosts={posts} userId={userId} />;
}

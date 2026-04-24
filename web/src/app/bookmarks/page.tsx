import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getBookmarkedPosts } from "@/lib/post-queries";
import FetchError from "../_components/fetch-error";
import BookmarksListClient from "./_components/bookmarks-list-client";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { posts, nextCursor, fetchError } = await getBookmarkedPosts(user.id);

  return (
    <main className="flex-1 border-r border-zinc-800">
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black px-4 py-3">
        <h2 className="text-xl font-bold">Yer İmleri</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Kaydettiğin gönderiler burada görünür.
        </p>
      </div>

      {fetchError ? (
        <FetchError message="Yer imleri yüklenemedi." />
      ) : (
        <BookmarksListClient
          initialPosts={posts}
          initialCursor={nextCursor}
        />
      )}
    </main>
  );
}

import { createClient } from "@/utils/supabase/server";
import type { Profile, PostWithAuthor, JobWithAuthor } from "@/types/database";

export async function searchPosts(
  query: string,
  tagSlug = "",
  limit = 20
): Promise<PostWithAuthor[]> {
  try {
    const supabase = await createClient();

    let q = supabase
      .from("posts")
      .select(`
        *,
        profiles (*),
        post_tags (
          tags (*)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query.trim()) {
      q = q.ilike("content", `%${query.trim()}%`);
    }

    const { data, error } = await q;
    if (error || !data) return [];

    // tag filtresi varsa client-side uygula
    if (tagSlug.trim()) {
      return (data as PostWithAuthor[]).filter((post) =>
        post.post_tags?.some((pt) => pt.tags?.slug === tagSlug.trim())
      );
    }

    return data as PostWithAuthor[];
  } catch {
    return [];
  }
}

export async function searchUsers(query: string, limit = 20): Promise<Profile[]> {
  try {
    const supabase = await createClient();

    let q = supabase
      .from("profiles")
      .select("*")
      .order("followers_count", { ascending: false })
      .limit(limit);

    if (query.trim()) {
      q = q.or(
        `username.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`
      );
    }

    const { data, error } = await q;
    if (error || !data) return [];
    return data as Profile[];
  } catch {
    return [];
  }
}

export async function searchJobs(
  query: string,
  tagSlug = "",
  limit = 20
): Promise<JobWithAuthor[]> {
  try {
    const supabase = await createClient();

    let q = supabase
      .from("jobs")
      .select(`
        *,
        profiles (*),
        job_tags (
          tags (*)
        )
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query.trim()) {
      q = q.or(
        `title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`
      );
    }

    const { data, error } = await q;
    if (error || !data) return [];

    if (tagSlug.trim()) {
      return (data as JobWithAuthor[]).filter((job) =>
        job.job_tags?.some((jt) => jt.tags?.slug === tagSlug.trim())
      );
    }

    return data as JobWithAuthor[];
  } catch {
    return [];
  }
}

import type {
  Profile,
  PostWithAuthor,
  JobWithAuthor,
  Tag,
} from "@errorlife/shared/types";
import { supabase } from "../supabase";
import { logger } from "../logger";

export type TrendingTag = Pick<Tag, "id" | "name" | "slug"> & {
  post_count: number;
};

const POST_HYDRATE_SELECT = `
  *,
  profiles!posts_user_id_fkey(*),
  post_tags(tags(*))
` as const;

const JOB_HYDRATE_SELECT = `
  *,
  profiles!jobs_user_id_fkey(*),
  job_tags(tags(*))
` as const;

/**
 * search_posts RPC, posts'un kendi alanlarını döndürür (profiles/tags yok).
 * UI için tam PostWithAuthor şekline ihtiyaç var → ID'leri sonra hidrate ederiz.
 */
export async function searchPosts(
  query: string,
  tagSlug = "",
  limit = 20
): Promise<PostWithAuthor[]> {
  const { data, error } = await supabase.rpc("search_posts", {
    p_query: query,
    p_tag: tagSlug,
    p_limit: limit,
    p_offset: 0,
  });
  if (error) {
    logger.error("search.posts", { error: error.message });
    return [];
  }
  const ids = (data ?? []).map((p: { id: string }) => p.id);
  if (ids.length === 0) return [];

  const { data: hydrated, error: hydrateError } = await supabase
    .from("posts")
    .select(POST_HYDRATE_SELECT)
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (hydrateError) {
    logger.error("search.posts.hydrate", { error: hydrateError.message });
    return [];
  }
  return (hydrated ?? []) as unknown as PostWithAuthor[];
}

export async function searchUsers(query: string, limit = 20): Promise<Profile[]> {
  const { data, error } = await supabase.rpc("search_users", {
    p_query: query,
    p_limit: limit,
    p_offset: 0,
  });
  if (error) {
    logger.error("search.users", { error: error.message });
    return [];
  }
  return (data ?? []) as Profile[];
}

export async function searchJobs(
  query: string,
  tagSlug = "",
  limit = 20
): Promise<JobWithAuthor[]> {
  const { data, error } = await supabase.rpc("search_jobs", {
    p_query: query,
    p_tag: tagSlug,
    p_limit: limit,
    p_offset: 0,
  });
  if (error) {
    logger.error("search.jobs", { error: error.message });
    return [];
  }
  const ids = (data ?? []).map((j: { id: string }) => j.id);
  if (ids.length === 0) return [];

  const { data: hydrated, error: hydrateError } = await supabase
    .from("jobs")
    .select(JOB_HYDRATE_SELECT)
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (hydrateError) {
    logger.error("search.jobs.hydrate", { error: hydrateError.message });
    return [];
  }
  return (hydrated ?? []) as unknown as JobWithAuthor[];
}

export async function fetchTrendingTags(limit = 10): Promise<TrendingTag[]> {
  const { data, error } = await supabase.rpc("get_trending_tags", {
    p_limit: limit,
  });
  if (error) {
    logger.error("search.trending_tags", { error: error.message });
    return [];
  }
  return (data ?? []).map((t: { id: string; name: string; slug: string; post_count: number }) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    post_count: Number(t.post_count),
  }));
}

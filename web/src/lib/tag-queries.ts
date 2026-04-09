import { createClient } from "@/utils/supabase/server";

export type TrendingTag = {
  id: string;
  name: string;
  slug: string;
  post_count: number;
};

export async function getTrendingTags(limit = 10): Promise<TrendingTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_trending_tags", {
    p_limit: limit,
  });

  if (error || !data) return [];
  return data as TrendingTag[];
}

export async function getAllTags(): Promise<{ id: string; name: string; slug: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data;
}

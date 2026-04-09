import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import type {
  UserProfile,
  PostWithAuthor,
  JobWithAuthor,
  Profile,
} from "@/types/database";

const usernameSchema = z
  .string()
  .trim()
  .min(1, "Kullanıcı adı boş olamaz.");

export async function getUserProfile(
  username: string
): Promise<UserProfile | null> {
  const parsed = usernameSchema.safeParse(username);

  if (!parsed.success) {
    return null;
  }

  const supabase = await createClient();

  // Profil bilgilerini ve oturumdaki kullanıcıyı paralel çek
  const [profileResult, authResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("username", parsed.data)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (profileResult.error || !profileResult.data) {
    return null;
  }

  const profile = profileResult.data;
  const currentUser = authResult.data?.user;

  // Oturum açık kullanıcı yoksa veya kendi profiliyse isFollowing: false
  if (!currentUser || currentUser.id === profile.id) {
    return { ...profile, isFollowing: false };
  }

  // Takip durumunu kontrol et
  const { data: followRecord } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", currentUser.id)
    .eq("following_id", profile.id)
    .maybeSingle();

  return { ...profile, isFollowing: !!followRecord };
}

// ── Profil Sekme Verileri ─────────────────────────────────

const userIdSchema = z.string().uuid("Geçersiz kullanıcı ID formatı.");

const POST_SELECT = `
  *,
  profiles (*),
  post_tags (
    tags (*)
  )
` as const;

const JOB_SELECT = `
  *,
  profiles (*),
  job_tags (
    tags (*)
  )
` as const;

const FEED_LIMIT = 30;

export async function getUserPosts(
  userId: string
): Promise<PostWithAuthor[]> {
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", parsed.data)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (error || !data) return [];
  return data as PostWithAuthor[];
}

export async function getUserLikedPosts(
  userId: string
): Promise<PostWithAuthor[]> {
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("likes")
    .select(`post_id, posts (${POST_SELECT})`)
    .eq("user_id", parsed.data)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (error || !data) return [];

  return data
    .map((row) => row.posts)
    .filter((p): p is PostWithAuthor => p !== null);
}

export async function getFollowers(username: string): Promise<Profile[]> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("follower:profiles!follows_follower_id_fkey(*)")
    .eq("following_id", profile.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => row.follower as unknown as Profile);
}

export async function getFollowing(username: string): Promise<Profile[]> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("following:profiles!follows_following_id_fkey(*)")
    .eq("follower_id", profile.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => row.following as unknown as Profile);
}

export async function getUserJobs(
  userId: string
): Promise<JobWithAuthor[]> {
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("user_id", parsed.data)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (error || !data) return [];
  return data as JobWithAuthor[];
}

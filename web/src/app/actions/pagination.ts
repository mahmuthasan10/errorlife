"use server";

import { createClient } from "@/utils/supabase/server";
import { uuidSchema, LIMITS } from "@errorlife/shared/schemas";
import { z } from "zod";
import type {
  PostWithAuthor,
  JobWithAuthor,
  BidWithJob,
  Profile,
  NotificationWithActor,
  NotificationType,
} from "@/types/database";

const PAGE_SIZE = LIMITS.pagination.pageSize;

const POST_SELECT = `
  *,
  profiles (*),
  post_tags (tags (*))
` as const;

const JOB_SELECT = `
  *,
  profiles (*),
  job_tags (tags (*))
` as const;

const BID_SELECT = `
  *,
  jobs (
    *,
    profiles (*)
  )
` as const;

const cursorSchema = z.string().min(1);

// ── Ana sayfa feed ────────────────────────────────────────────
export async function loadMoreFeedPosts(
  cursor: string
): Promise<{ data: PostWithAuthor[]; fetchError: boolean }> {
  if (!cursorSchema.safeParse(cursor).success) return { data: [], fetchError: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { data: [], fetchError: true };
  return { data: data as PostWithAuthor[], fetchError: false };
}

// ── Kullanıcı gönderileri ─────────────────────────────────────
export async function loadMoreUserPosts(
  userId: string,
  cursor: string
): Promise<{ data: PostWithAuthor[]; fetchError: boolean }> {
  if (!uuidSchema.safeParse(userId).success) return { data: [], fetchError: false };
  if (!cursorSchema.safeParse(cursor).success) return { data: [], fetchError: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", userId)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { data: [], fetchError: true };
  return { data: data as PostWithAuthor[], fetchError: false };
}

// ── Kullanıcı beğenileri ──────────────────────────────────────
export async function loadMoreUserLikes(
  userId: string,
  cursor: string
): Promise<{ posts: PostWithAuthor[]; nextCursor: string | null; fetchError: boolean }> {
  if (!uuidSchema.safeParse(userId).success)
    return { posts: [], nextCursor: null, fetchError: false };
  if (!cursorSchema.safeParse(cursor).success)
    return { posts: [], nextCursor: null, fetchError: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("likes")
    .select(`post_id, created_at, posts (${POST_SELECT})`)
    .eq("user_id", userId)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { posts: [], nextCursor: null, fetchError: true };

  const posts = data
    .map((row) => row.posts)
    .filter((p): p is PostWithAuthor => p !== null);
  const nextCursor =
    data.length === PAGE_SIZE ? data[data.length - 1].created_at : null;

  return { posts, nextCursor, fetchError: false };
}

// ── Kullanıcı yer imleri (private) ────────────────────────────
export async function loadMoreBookmarks(
  cursor: string
): Promise<{ posts: PostWithAuthor[]; nextCursor: string | null; fetchError: boolean }> {
  if (!cursorSchema.safeParse(cursor).success)
    return { posts: [], nextCursor: null, fetchError: false };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return { posts: [], nextCursor: null, fetchError: false };

  const { data, error } = await supabase
    .from("bookmarks")
    .select(`post_id, created_at, posts (${POST_SELECT})`)
    .eq("user_id", user.id)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { posts: [], nextCursor: null, fetchError: true };

  const posts = data
    .map((row) => row.posts)
    .filter((p): p is PostWithAuthor => p !== null);
  const nextCursor =
    data.length === PAGE_SIZE ? data[data.length - 1].created_at : null;

  return { posts, nextCursor, fetchError: false };
}

// ── Kullanıcı ilanları ────────────────────────────────────────
export async function loadMoreUserJobs(
  userId: string,
  cursor: string
): Promise<{ data: JobWithAuthor[]; fetchError: boolean }> {
  if (!uuidSchema.safeParse(userId).success) return { data: [], fetchError: false };
  if (!cursorSchema.safeParse(cursor).success) return { data: [], fetchError: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("user_id", userId)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { data: [], fetchError: true };
  return { data: data as JobWithAuthor[], fetchError: false };
}

// ── Açık İlanlar (jobs sayfası) ──────────────────────────────
export async function loadMoreOpenJobs(
  cursor: string
): Promise<{ data: JobWithAuthor[]; fetchError: boolean }> {
  if (!cursorSchema.safeParse(cursor).success) return { data: [], fetchError: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("status", "open")
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { data: [], fetchError: true };
  return { data: data as JobWithAuthor[], fetchError: false };
}

// ── Benim İlanlarım ───────────────────────────────────────────
export async function loadMoreMyJobs(
  userId: string,
  cursor: string
): Promise<{ data: JobWithAuthor[]; fetchError: boolean }> {
  if (!uuidSchema.safeParse(userId).success) return { data: [], fetchError: false };
  if (!cursorSchema.safeParse(cursor).success) return { data: [], fetchError: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("user_id", userId)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { data: [], fetchError: true };
  return { data: data as JobWithAuthor[], fetchError: false };
}

// ── Verdiğim Teklifler ────────────────────────────────────────
export async function loadMoreMyBids(
  userId: string,
  cursor: string
): Promise<{ data: BidWithJob[]; fetchError: boolean }> {
  if (!uuidSchema.safeParse(userId).success) return { data: [], fetchError: false };
  if (!cursorSchema.safeParse(cursor).success) return { data: [], fetchError: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bids")
    .select(BID_SELECT)
    .eq("expert_id", userId)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { data: [], fetchError: true };
  return { data: data as BidWithJob[], fetchError: false };
}

// ── Takipçiler ────────────────────────────────────────────────
export async function loadMoreFollowers(
  username: string,
  cursor: string
): Promise<{ profiles: Profile[]; nextCursor: string | null; fetchError: boolean }> {
  if (!cursorSchema.safeParse(cursor).success)
    return { profiles: [], nextCursor: null, fetchError: false };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { profiles: [], nextCursor: null, fetchError: false };

  const { data, error } = await supabase
    .from("follows")
    .select("follower:profiles!follows_follower_id_fkey(*), created_at")
    .eq("following_id", profile.id)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { profiles: [], nextCursor: null, fetchError: true };

  const profiles = data.map((row) => row.follower as unknown as Profile);
  const nextCursor =
    data.length === PAGE_SIZE ? data[data.length - 1].created_at : null;

  return { profiles, nextCursor, fetchError: false };
}

// ── Takip edilenler ───────────────────────────────────────────
export async function loadMoreFollowing(
  username: string,
  cursor: string
): Promise<{ profiles: Profile[]; nextCursor: string | null; fetchError: boolean }> {
  if (!cursorSchema.safeParse(cursor).success)
    return { profiles: [], nextCursor: null, fetchError: false };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { profiles: [], nextCursor: null, fetchError: false };

  const { data, error } = await supabase
    .from("follows")
    .select("following:profiles!follows_following_id_fkey(*), created_at")
    .eq("follower_id", profile.id)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { profiles: [], nextCursor: null, fetchError: true };

  const profiles = data.map((row) => row.following as unknown as Profile);
  const nextCursor =
    data.length === PAGE_SIZE ? data[data.length - 1].created_at : null;

  return { profiles, nextCursor, fetchError: false };
}

// ── Bildirimler ───────────────────────────────────────────────
export async function loadMoreNotifications(
  cursor: string
): Promise<{ data: NotificationWithActor[]; fetchError: boolean }> {
  if (!cursorSchema.safeParse(cursor).success) return { data: [], fetchError: false };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { data: [], fetchError: false };

  const { data, error } = await supabase
    .from("notifications")
    .select(`*, actor:profiles!notifications_actor_id_fkey(*)`)
    .eq("user_id", user.id)
    .lt("created_at", cursor)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) return { data: [], fetchError: true };
  return {
    data: data.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      actor_id: item.actor_id,
      type: item.type as NotificationType,
      entity_id: item.entity_id,
      is_read: item.is_read,
      created_at: item.created_at,
      actor: item.actor as unknown as Profile,
    })),
    fetchError: false,
  };
}

// ── Temel Tipler ──────────────────────────────────────────────
// Her iki platform (web + mobile) tarafından kullanılan ortak tipler.

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  bookmark_count: number;
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  budget: number | null;
  status: "open" | "in_progress" | "closed";
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Bid = {
  id: string;
  job_id: string;
  expert_id: string;
  amount: number;
  estimated_days: number;
  cover_letter: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Like = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Chat = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

export type NotificationType = "FOLLOW" | "BID" | "MESSAGE" | "LIKE" | "COMMENT";

export type Notification = {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
};

// ── Birleşik Tipler ───────────────────────────────────────────

export type PostWithAuthor = Post & {
  profiles: Profile;
  post_tags: { tags: Tag }[];
};

export type JobWithAuthor = Job & {
  profiles: Profile;
  job_tags: { tags: Tag }[];
};

export type BidWithExpert = Bid & {
  profiles: Profile;
};

export type BidWithJob = Bid & {
  jobs: Job & { profiles: Profile };
};

export type CommentWithAuthor = Comment & {
  profiles: Profile;
};

export type UserProfile = Profile & {
  isFollowing: boolean;
};

export type ChatWithDetails = Chat & {
  otherUser: Profile;
  lastMessage: Message | null;
};

export type NotificationWithActor = Notification & {
  actor: Profile;
};

// ── 3-Sekmeli Bildirim Sistemi Tipleri ───────────────────────

/**
 * get_interaction_notifications() RPC dönüş tipi.
 * kind='comment' → bireysel yorum bildirimi (notification_id dolu)
 * kind='like'    → post bazında gruplanmış beğeni (notification_id NULL)
 */
export type InteractionNotificationRow = {
  kind: "comment" | "like";
  notification_id: string | null;
  post_id: string;
  is_read: boolean;
  latest_at: string;
  actor_count: number;
  latest_actor_id: string;
  latest_actor_display_name: string;
  latest_actor_username: string;
  latest_actor_avatar_url: string | null;
};

/** get_follow_notifications() RPC dönüş tipi. */
export type FollowNotificationRow = {
  notification_id: string;
  actor_id: string;
  is_read: boolean;
  created_at: string;
  actor_display_name: string;
  actor_username: string;
  actor_avatar_url: string | null;
};

/**
 * get_message_notifications() RPC dönüş tipi.
 * Doğrudan chats + messages tablolarından beslenir,
 * notifications tablosuna veri kopyalamaz.
 */
export type MessageNotificationRow = {
  chat_id: string;
  other_user_id: string;
  other_user_display_name: string;
  other_user_username: string;
  other_user_avatar_url: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  unread_count: number;
};

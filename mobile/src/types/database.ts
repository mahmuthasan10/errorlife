export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
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
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          like_count?: number;
          comment_count?: number;
          bookmark_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          image_url?: string | null;
          like_count?: number;
          comment_count?: number;
          bookmark_count?: number;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          budget: number | null;
          status: "open" | "in_progress" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          budget?: number | null;
          status?: "open" | "in_progress" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          budget?: number | null;
          status?: "open" | "in_progress" | "closed";
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
      };
      post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
      };
      job_tags: {
        Row: {
          job_id: string;
          tag_id: string;
        };
        Insert: {
          job_id: string;
          tag_id: string;
        };
        Update: {
          job_id?: string;
          tag_id?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          post_id?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          post_id?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Yardımcı tipler
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type Like = Database["public"]["Tables"]["likes"]["Row"];
export type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];

// Post + Profile birleşik tip (feed'de kullanılacak)
export type PostWithAuthor = Post & {
  profiles: Profile;
  post_tags: { tags: Tag }[];
  user_likes: { user_id: string }[];
  user_bookmarks: { user_id: string }[];
};

// Job + Profile birleşik tip
export type JobWithAuthor = Job & {
  profiles: Profile;
  job_tags: { tags: Tag }[];
};

// Comment + Profile birleşik tip
export type CommentWithAuthor = Comment & {
  profiles: Profile;
};

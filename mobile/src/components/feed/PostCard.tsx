import { memo, useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { PostWithAuthor } from "@errorlife/shared/types";
import Avatar from "../ui/Avatar";
import PostInteractionBar from "./PostInteractionBar";
import { formatTimeAgo } from "../../utils/format-time";

type PostCardProps = {
  post: PostWithAuthor;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onComment: (postId: string) => void;
  onProfilePress?: (username: string) => void;
  onPress?: (postId: string) => void;
};

function PostCard({
  post,
  onLike,
  onBookmark,
  onComment,
  onProfilePress,
  onPress,
}: PostCardProps) {
  const { profiles } = post;
  const liked = (post.user_likes?.length ?? 0) > 0;
  const bookmarked = (post.user_bookmarks?.length ?? 0) > 0;

  const handlePress = useCallback(() => onPress?.(post.id), [onPress, post.id]);
  const handleProfile = useCallback(
    () => onProfilePress?.(profiles.username),
    [onProfilePress, profiles.username]
  );
  const handleLike = useCallback(() => onLike(post.id), [onLike, post.id]);
  const handleBookmark = useCallback(
    () => onBookmark(post.id),
    [onBookmark, post.id]
  );
  const handleComment = useCallback(
    () => onComment(post.id),
    [onComment, post.id]
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      className="flex-row border-b border-zinc-800 px-4 py-3"
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleProfile}
        className="mr-3"
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Avatar uri={profiles.avatar_url} fallback={profiles.display_name} />
      </TouchableOpacity>

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center flex-wrap">
          <TouchableOpacity activeOpacity={0.7} onPress={handleProfile}>
            <Text
              className="text-white font-bold text-[15px]"
              numberOfLines={1}
            >
              {profiles.display_name}
            </Text>
          </TouchableOpacity>
          <Text className="text-zinc-500 text-[13px] ml-1.5" numberOfLines={1}>
            @{profiles.username}
          </Text>
          <Text className="text-zinc-600 text-xs mx-1">·</Text>
          <Text className="text-zinc-500 text-xs">
            {formatTimeAgo(post.created_at)}
          </Text>
        </View>

        <Text className="text-zinc-100 text-[15px] leading-[22px] mt-1">
          {post.content}
        </Text>

        {post.post_tags.length > 0 && (
          <View className="flex-row flex-wrap mt-2 gap-1.5">
            {post.post_tags.map(({ tags }) => (
              <View
                key={tags.id}
                className="bg-zinc-800/80 rounded-full px-2.5 py-0.5"
              >
                <Text className="text-zinc-400 text-xs">#{tags.name}</Text>
              </View>
            ))}
          </View>
        )}

        <PostInteractionBar
          liked={liked}
          bookmarked={bookmarked}
          likeCount={post.like_count}
          commentCount={post.comment_count}
          bookmarkCount={post.bookmark_count}
          onLike={handleLike}
          onComment={handleComment}
          onBookmark={handleBookmark}
        />
      </View>
    </TouchableOpacity>
  );
}

export default memo(PostCard);

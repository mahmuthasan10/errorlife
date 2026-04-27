import { memo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type PostInteractionBarProps = {
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
};

function PostInteractionBar({
  liked,
  bookmarked,
  likeCount,
  commentCount,
  bookmarkCount,
  onLike,
  onComment,
  onBookmark,
}: PostInteractionBarProps) {
  return (
    <View className="flex-row items-center justify-between mt-3 mr-8">
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={onComment}
        className="flex-row items-center gap-1.5 py-1"
        hitSlop={HIT_SLOP}
      >
        <Ionicons name="chatbubble-outline" size={17} color="#71717a" />
        {commentCount > 0 && (
          <Text className="text-zinc-500 text-xs">{commentCount}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.6}
        onPress={onLike}
        className="flex-row items-center gap-1.5 py-1"
        hitSlop={HIT_SLOP}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={17}
          color={liked ? "#F91880" : "#71717a"}
        />
        {likeCount > 0 && (
          <Text
            className={`text-xs ${liked ? "text-[#F91880]" : "text-zinc-500"}`}
          >
            {likeCount}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.6}
        onPress={onBookmark}
        className="flex-row items-center gap-1.5 py-1"
        hitSlop={HIT_SLOP}
      >
        <Ionicons
          name={bookmarked ? "bookmark" : "bookmark-outline"}
          size={17}
          color={bookmarked ? "#1D9BF0" : "#71717a"}
        />
        {bookmarkCount > 0 && (
          <Text
            className={`text-xs ${
              bookmarked ? "text-[#1D9BF0]" : "text-zinc-500"
            }`}
          >
            {bookmarkCount}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default memo(PostInteractionBar);

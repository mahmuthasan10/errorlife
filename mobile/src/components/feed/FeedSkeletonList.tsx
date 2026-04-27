import { View } from "react-native";
import PostCardSkeleton from "./PostCardSkeleton";

type FeedSkeletonListProps = {
  count?: number;
};

export default function FeedSkeletonList({ count = 6 }: FeedSkeletonListProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} variant={i % 2 === 0 ? "long" : "short"} />
      ))}
    </View>
  );
}

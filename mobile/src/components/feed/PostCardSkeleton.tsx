import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

function Bone({ className }: { className?: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className={`bg-zinc-800 rounded-md ${className ?? ""}`}
    />
  );
}

type PostCardSkeletonProps = {
  variant?: "short" | "long";
};

export default function PostCardSkeleton({
  variant = "long",
}: PostCardSkeletonProps) {
  return (
    <View className="flex-row px-4 py-3 border-b border-zinc-800">
      <Bone className="w-11 h-11 rounded-full mr-3" />

      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-2">
          <Bone className="w-24 h-3.5" />
          <Bone className="w-16 h-3" />
          <Bone className="w-8 h-3" />
        </View>

        <Bone className="w-full h-3.5 mb-1.5" />
        <Bone className="w-3/4 h-3.5 mb-1.5" />
        {variant === "long" && <Bone className="w-1/2 h-3.5 mb-1.5" />}

        <View className="flex-row items-center justify-between mt-3 mr-8">
          <Bone className="w-8 h-3.5" />
          <Bone className="w-8 h-3.5" />
          <Bone className="w-8 h-3.5" />
        </View>
      </View>
    </View>
  );
}

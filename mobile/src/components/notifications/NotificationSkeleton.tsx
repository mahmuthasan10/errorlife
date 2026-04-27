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

export default function NotificationSkeleton() {
  return (
    <View className="flex-row items-start gap-3 px-4 py-3 border-b border-zinc-800">
      <Bone className="w-10 h-10 rounded-full" />
      <View className="flex-1">
        <Bone className="w-3/4 h-3.5 mb-2" />
        <Bone className="w-1/3 h-3" />
      </View>
    </View>
  );
}

export function NotificationSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <NotificationSkeleton key={i} />
      ))}
    </View>
  );
}

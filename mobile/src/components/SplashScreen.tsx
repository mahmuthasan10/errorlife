import { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";

export default function SplashScreen() {
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [fade, scale, spin]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Animated.View
        style={{ opacity: fade, transform: [{ scale }] }}
        className="items-center"
      >
        {/* Logo alanı */}
        <View className="mb-8 items-center">
          <View className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center mb-5">
            <Text className="text-3xl font-bold text-red-500">{"E"}</Text>
            <Text className="text-[10px] font-mono text-zinc-500 -mt-1">
              {"</>"}
            </Text>
          </View>

          <Text className="text-white text-2xl font-bold tracking-wider">
            ErrorLife
          </Text>
          <Text className="text-zinc-500 text-xs mt-1 tracking-widest">
            CODE · DEBUG · REPEAT
          </Text>
        </View>

        {/* Spinner */}
        <Animated.View
          style={{ transform: [{ rotate: rotation }] }}
          className="w-8 h-8 rounded-full border-[3px] border-zinc-800 border-t-blue-500"
        />
      </Animated.View>
    </View>
  );
}

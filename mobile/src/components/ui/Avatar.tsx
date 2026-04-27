import { memo } from "react";
import { Image, Text, View } from "react-native";

type AvatarProps = {
  uri: string | null;
  fallback: string;
  size?: number;
};

function Avatar({ uri, fallback, size = 44 }: AvatarProps) {
  const initial = (fallback || "?").charAt(0).toUpperCase();
  const sizeStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={sizeStyle}
        className="bg-zinc-800"
      />
    );
  }

  return (
    <View
      style={sizeStyle}
      className="bg-zinc-800 items-center justify-center"
    >
      <Text className="text-sm font-bold text-zinc-300">{initial}</Text>
    </View>
  );
}

export default memo(Avatar);

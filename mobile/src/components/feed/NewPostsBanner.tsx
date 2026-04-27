import { memo } from "react";
import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type NewPostsBannerProps = {
  count: number;
  onPress: () => void;
};

function NewPostsBanner({ count, onPress }: NewPostsBannerProps) {
  if (count <= 0) return null;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="absolute top-4 self-center z-50 bg-[#1D9BF0] px-4 py-2 rounded-full flex-row items-center shadow-lg shadow-black/50"
      style={{ elevation: 5 }}
    >
      <Ionicons name="arrow-up" size={16} color="white" />
      <Text className="text-white font-bold ml-1">{count} Yeni Gönderi</Text>
    </TouchableOpacity>
  );
}

export default memo(NewPostsBanner);

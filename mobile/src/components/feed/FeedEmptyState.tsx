import { Text, TouchableOpacity, View } from "react-native";

type FeedEmptyStateProps = {
  variant: "empty" | "error";
  onRetry?: () => void;
};

const COPY = {
  empty: "Henüz gönderi yok. İlk gönderiyi sen paylaş!",
  error: "Gönderiler yüklenemedi. Aşağı çekerek tekrar dene.",
} as const;

export default function FeedEmptyState({
  variant,
  onRetry,
}: FeedEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-zinc-500 text-base text-center px-6">
        {COPY[variant]}
      </Text>
      {variant === "error" && onRetry && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onRetry}
          className="mt-4 bg-[#1D9BF0] px-5 py-2 rounded-full"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-white font-bold">Tekrar Dene</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

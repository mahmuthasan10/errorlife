import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props<T> = {
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  data: T;
  onRetry?: () => void;
  loadingCount?: number;
  emptyMessage?: string;
  errorMessage?: string;
  LoadingComponent?: React.ComponentType;
  children: (data: NonNullable<T>) => React.ReactNode;
};

export function AsyncState<T>({
  isLoading,
  hasError,
  isEmpty,
  data,
  onRetry,
  emptyMessage = "Henüz içerik yok.",
  errorMessage = "Yüklenirken bir hata oluştu.",
  LoadingComponent,
  children,
}: Props<T>) {
  if (isLoading) {
    if (LoadingComponent) return <LoadingComponent />;
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1D9BF0" />
      </View>
    );
  }

  if (hasError) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-20">
        <Ionicons name="alert-circle-outline" size={40} color="#52525b" />
        <Text className="text-zinc-500 text-sm text-center mt-3">
          {errorMessage}
        </Text>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            className="mt-4 px-4 py-2 rounded-full bg-zinc-800"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-semibold">Tekrar dene</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-20">
        <Ionicons name="document-outline" size={40} color="#52525b" />
        <Text className="text-zinc-500 text-sm text-center mt-3">
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return <>{children(data as NonNullable<T>)}</>;
}

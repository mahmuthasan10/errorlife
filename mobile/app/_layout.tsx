import "../global.css";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../src/providers/AuthProvider";
import SplashScreenView from "../src/components/SplashScreen";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { registerPushToken } from "../src/lib/push";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function RootLayoutNav() {
  const { session, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pushRegistered = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, isLoading, segments, router]);

  useEffect(() => {
    if (user && !pushRegistered.current) {
      pushRegistered.current = true;
      void registerPushToken(user.id);
    }
  }, [user]);

  return (
    <View className="flex-1 bg-black">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="new-post"
          options={{
            presentation: "formSheet",
            headerShown: false,
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="post/[id]/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="post/[id]/comments"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="messages"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="new-job"
          options={{
            presentation: "formSheet",
            headerShown: false,
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            presentation: "formSheet",
            headerShown: false,
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="jobs/[id]/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="search/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profile/[username]/index"
          options={{ headerShown: false }}
        />
      </Stack>

      {isLoading && (
        <View className="absolute inset-0 z-50">
          <SplashScreenView />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

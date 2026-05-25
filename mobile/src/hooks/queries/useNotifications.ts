import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../providers/AuthProvider";
import {
  fetchInteractionNotifications,
  fetchFollowNotifications,
  fetchMessageNotifications,
  fetchJobNotifications,
} from "../../lib/queries/notifications";

export const notificationKeys = {
  all:          (userId: string) => ["notifications", userId] as const,
  interactions: (userId: string) => ["notifications", userId, "interactions"] as const,
  follows:      (userId: string) => ["notifications", userId, "follows"] as const,
  messages:     (userId: string) => ["notifications", userId, "messages"] as const,
  jobs:         (userId: string) => ["notifications", userId, "jobs"] as const,
};

export function useInteractionNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey:  notificationKeys.interactions(user?.id ?? ""),
    queryFn:   fetchInteractionNotifications,
    enabled:   !!user,
    staleTime: 30_000,
  });
}

export function useFollowNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey:  notificationKeys.follows(user?.id ?? ""),
    queryFn:   fetchFollowNotifications,
    enabled:   !!user,
    staleTime: 30_000,
  });
}

export function useMessageNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey:  notificationKeys.messages(user?.id ?? ""),
    queryFn:   fetchMessageNotifications,
    enabled:   !!user,
    staleTime: 15_000,
  });
}

export function useJobNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey:  notificationKeys.jobs(user?.id ?? ""),
    queryFn:   fetchJobNotifications,
    enabled:   !!user,
    staleTime: 30_000,
  });
}

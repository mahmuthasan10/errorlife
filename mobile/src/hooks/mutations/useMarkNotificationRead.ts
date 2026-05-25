import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InteractionNotificationRow, FollowNotificationRow } from "@errorlife/shared/types";
import {
  markCommentNotificationRead,
  markLikeNotificationsRead,
  markFollowNotificationRead,
} from "../../lib/queries/notifications";
import { notificationKeys } from "../queries/useNotifications";
import { useAuth } from "../../providers/AuthProvider";
import { logger } from "../../lib/logger";

export function useMarkInteractionRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (row: InteractionNotificationRow) => {
      if (row.kind === "comment" && row.notification_id) {
        return markCommentNotificationRead(row.notification_id);
      }
      return markLikeNotificationsRead(row.post_id);
    },
    onMutate: async (row) => {
      if (!user) return;
      const key = notificationKeys.interactions(user.id);
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<InteractionNotificationRow[]>(key);

      queryClient.setQueryData<InteractionNotificationRow[]>(key, (old = []) =>
        old.map((r) => {
          if (row.kind === "comment" && r.notification_id === row.notification_id)
            return { ...r, is_read: true };
          if (row.kind === "like" && r.post_id === row.post_id)
            return { ...r, is_read: true };
          return r;
        })
      );
      return { prev };
    },
    onError: (err, _row, ctx) => {
      if (ctx?.prev && user) {
        queryClient.setQueryData(notificationKeys.interactions(user.id), ctx.prev);
      }
      logger.error("mutation.mark_interaction_read", { err: String(err) });
    },
  });
}

export function useMarkFollowRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (row: FollowNotificationRow) =>
      markFollowNotificationRead(row.notification_id),
    onMutate: async (row) => {
      if (!user) return;
      const key = notificationKeys.follows(user.id);
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<FollowNotificationRow[]>(key);

      queryClient.setQueryData<FollowNotificationRow[]>(key, (old = []) =>
        old.map((r) =>
          r.notification_id === row.notification_id ? { ...r, is_read: true } : r
        )
      );
      return { prev };
    },
    onError: (err, _row, ctx) => {
      if (ctx?.prev && user) {
        queryClient.setQueryData(notificationKeys.follows(user.id), ctx.prev);
      }
      logger.error("mutation.mark_follow_read", { err: String(err) });
    },
  });
}

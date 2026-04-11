import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getInteractionNotifications,
  getFollowNotifications,
  getMessageNotifications,
} from "@/lib/notification-queries";
import NotificationsTabsClient from "./_components/notifications-list-client";

export const metadata = {
  title: "Bildirimler | ErrorLife",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 3 veri kaynağını paralel çek — sunucu tarafında tek round-trip
  const [interactions, follows, messages] = await Promise.all([
    getInteractionNotifications(),
    getFollowNotifications(),
    getMessageNotifications(),
  ]);

  return (
    <div className="mx-auto max-w-2xl border-x border-zinc-800 min-h-screen">
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black px-4 py-3">
        <h1 className="text-xl font-bold text-[#e7e9ea]">Bildirimler</h1>
      </div>

      <NotificationsTabsClient
        interactions={interactions}
        follows={follows}
        messages={messages}
      />
    </div>
  );
}

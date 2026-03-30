import { Bell } from "lucide-react";
import { getUserNotifications } from "@/lib/notification-queries";
import NotificationItem from "@/app/_components/notification-item";

export const metadata = {
  title: "Bildirimler | ErrorLife",
};

export default async function NotificationsPage() {
  const notifications = await getUserNotifications();

  return (
    <div className="mx-auto max-w-2xl border-x border-zinc-800 min-h-screen">
      {/* Başlık */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold text-[#e7e9ea]">Bildirimler</h1>
      </div>

      {/* Bildirim Listesi */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
            <Bell className="h-7 w-7 text-zinc-600" />
          </div>
          <h2 className="text-lg font-bold text-[#e7e9ea]">
            Henüz bildiriminiz yok
          </h2>
          <p className="max-w-sm text-sm text-zinc-500">
            Biri sizi takip ettiğinde, ilanınıza teklif verdiğinde veya size
            mesaj gönderdiğinde burada görünecek.
          </p>
        </div>
      ) : (
        <div>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      )}
    </div>
  );
}

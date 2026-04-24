import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { createClient } from "@/utils/supabase/server";
import NotificationProvider from "./_components/notification-provider";
import { BadgeProvider } from "./_components/badge-provider";
import Sidebar from "./_components/sidebar";
import BottomNav from "./_components/bottom-nav";
import MobileSidebar from "./_components/mobile-sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ErrorLife",
  description: "Yazılımcılar için sorun paylaşma ve çözüm platformu",
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUsername: string | null = null;
  let displayName: string | null = null;
  let unreadNotifCount = 0;
  let unreadMessageCount = 0;

  if (user) {
    const [profileResult, badgeResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.rpc("get_badge_counts"),
    ]);

    currentUsername = profileResult.data?.username ?? null;
    displayName = profileResult.data?.display_name ?? null;

    if (badgeResult.data?.[0]) {
      unreadNotifCount = Number(badgeResult.data[0].notif_count ?? 0);
      unreadMessageCount = Number(badgeResult.data[0].message_count ?? 0);
    }
  }

  const isAuth = !!user;

  // Auth sayfalarında (login/register/forgot/reset) sidebar'ı gizle
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth");

  return (
    <html lang="tr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-black text-[#e7e9ea] antialiased`}
      >
        {user && <NotificationProvider currentUserId={user.id} />}

        {isAuth && user && !isAuthRoute ? (
          <BadgeProvider
            initialNotifCount={unreadNotifCount}
            initialMessageCount={unreadMessageCount}
            currentUserId={user.id}
          >
            <MobileSidebar
              currentUsername={currentUsername}
              displayName={displayName}
            />
            <div className="mx-auto flex min-h-screen max-w-7xl">
              <Sidebar currentUsername={currentUsername} />
              <main className="min-w-0 flex-1 pb-14 md:pb-0">
                {children}
              </main>
            </div>
            <BottomNav />
          </BadgeProvider>
        ) : (
          children
        )}

        {modal}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#18181b",
              border: "1px solid #27272a",
              color: "#e7e9ea",
            },
          }}
        />
      </body>
    </html>
  );
}

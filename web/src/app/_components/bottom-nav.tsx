"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Briefcase, Bell, Mail } from "lucide-react";

interface BottomNavProps {
  unreadNotifCount: number;
  unreadMessageCount: number;
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function BottomNav({
  unreadNotifCount,
  unreadMessageCount,
}: BottomNavProps) {
  const pathname = usePathname();

  const isChatRoom = /^\/messages\/.+/.test(pathname);
  if (isChatRoom) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Ana Sayfa", badge: 0 },
    { href: "/search", icon: Search, label: "Keşfet", badge: 0 },
    { href: "/jobs", icon: Briefcase, label: "İlanlar", badge: 0 },
    { href: "/notifications", icon: Bell, label: "Bildirimler", badge: unreadNotifCount },
    { href: "/messages", icon: Mail, label: "Mesajlar", badge: unreadMessageCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-zinc-800 bg-zinc-950/80 md:hidden">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : item.href !== "#" && pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-1 items-center justify-center py-3 transition-colors ${
              isActive ? "text-white" : "text-zinc-500 active:text-zinc-300"
            }`}
          >
            <div className="relative">
              <item.icon size={24} />
              <Badge count={item.badge} />
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

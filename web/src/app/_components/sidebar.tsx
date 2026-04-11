"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Briefcase, Bell, Mail, User, LogOut } from "lucide-react";
import { logout } from "@/app/actions";
import { useBadge } from "./badge-provider";

interface SidebarProps {
  currentUsername: string | null;
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Sidebar({ currentUsername }: SidebarProps) {
  const pathname = usePathname();
  const { notifCount, messageCount } = useBadge();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const navItems = [
    { href: "/", icon: Home, label: "Ana Sayfa", badge: 0 },
    { href: "/search", icon: Search, label: "Keşfet", badge: 0 },
    { href: "/jobs", icon: Briefcase, label: "İlanlar", badge: 0 },
    { href: "/notifications", icon: Bell, label: "Bildirimler", badge: notifCount },
    { href: "/messages", icon: Mail, label: "Mesajlar", badge: messageCount },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-zinc-800 px-4 py-6 md:flex">
      <div className="space-y-2">
        {/* Logo */}
        <Link href="/" className="mb-6 flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <span className="text-lg font-bold text-black">E</span>
          </div>
          <span className="text-xl font-bold">ErrorLife</span>
        </Link>

        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 rounded-full px-3 py-3 transition-colors hover:bg-zinc-900 ${
              isActive(item.href)
                ? "font-bold text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <div className="relative">
              <item.icon size={22} />
              <Badge count={item.badge} />
            </div>
            <span className="text-lg">{item.label}</span>
          </Link>
        ))}

        <Link
          href={currentUsername ? `/profile/${currentUsername}` : "/login"}
          className={`flex items-center gap-4 rounded-full px-3 py-3 transition-colors hover:bg-zinc-900 ${
            pathname.startsWith("/profile")
              ? "font-bold text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <User size={22} />
          <span className="text-lg">Profil</span>
        </Link>

        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-4 rounded-full px-3 py-3 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <LogOut size={22} />
            <span className="text-lg">Çıkış</span>
          </button>
        </form>
      </div>

      <a
        href="mailto:mermuh037@gmail.com?subject=Sorun%20Bildirimi"
        className="block w-full rounded-full bg-white py-3 text-center text-sm font-bold text-black transition-opacity hover:opacity-90"
      >
        Sorun Paylaş
      </a>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Briefcase, Bell, Mail } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Ana Sayfa" },
  { href: "/search", icon: Search, label: "Keşfet" },
  { href: "/jobs", icon: Briefcase, label: "İlanlar" },
  { href: "/notifications", icon: Bell, label: "Bildirimler" },
  { href: "/messages", icon: Mail, label: "Mesajlar" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Chat odalarında bottom nav'ı gizle (tam ekran chat deneyimi)
  const isChatRoom = /^\/messages\/.+/.test(pathname);
  if (isChatRoom) return null;

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
              isActive
                ? "text-white"
                : "text-zinc-500 active:text-zinc-300"
            }`}
          >
            <item.icon size={24} />
          </Link>
        );
      })}
    </nav>
  );
}

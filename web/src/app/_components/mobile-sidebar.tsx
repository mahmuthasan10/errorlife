"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Home, Search, Briefcase, Bell, Mail, User, LogOut, X, Bookmark, Settings } from "lucide-react";
import { logout } from "@/app/actions";

interface MobileSidebarProps {
  currentUsername: string | null;
  displayName: string | null;
}

const navItems = [
  { href: "/", icon: Home, label: "Ana Sayfa" },
  { href: "/search", icon: Search, label: "Keşfet" },
  { href: "/jobs", icon: Briefcase, label: "İlanlar" },
  { href: "/notifications", icon: Bell, label: "Bildirimler" },
  { href: "/messages", icon: Mail, label: "Mesajlar" },
  { href: "/bookmarks", icon: Bookmark, label: "Yer İmleri" },
  { href: "/settings", icon: Settings, label: "Ayarlar" },
];

export default function MobileSidebar({
  currentUsername,
  displayName,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const initial = displayName?.charAt(0).toUpperCase() ?? "?";

  // Chat odalarında mobil üst bar'ı gizle (chat kendi header'ını içeriyor)
  const isChatRoom = /^\/messages\/.+/.test(pathname);

  return (
    <>
      {/* Mobil üst bar — sadece mobilde, chat odalarında gizli */}
      <div className={`sticky top-0 z-30 items-center border-b border-zinc-800 bg-black px-4 py-2.5 md:hidden ${isChatRoom ? "hidden" : "flex"}`}>
        <button
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 transition-opacity hover:opacity-80"
        >
          <span className="text-sm font-bold text-zinc-300">{initial}</span>
        </button>

        {/* Ortadaki logo */}
        <div className="flex flex-1 justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <span className="text-sm font-bold text-black">E</span>
          </div>
        </div>

        {/* Sağ boşluk (simetri için) */}
        <div className="w-8" />
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col bg-black transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
          <span className="text-lg font-bold">Hesap bilgileri</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 transition-colors hover:bg-zinc-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profil özeti */}
        <div className="border-b border-zinc-800 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
            <span className="text-sm font-bold text-zinc-300">{initial}</span>
          </div>
          <p className="mt-2 font-bold">{displayName ?? "Kullanıcı"}</p>
          {currentUsername && (
            <p className="text-sm text-zinc-500">@{currentUsername}</p>
          )}
        </div>

        {/* Nav linkleri */}
        <nav className="flex-1 space-y-1 px-2 py-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-4 rounded-full px-4 py-3 transition-colors hover:bg-zinc-900 ${
                  isActive ? "font-bold text-white" : "text-zinc-400"
                }`}
              >
                <item.icon size={22} />
                <span className="text-lg">{item.label}</span>
              </Link>
            );
          })}

          <Link
            href={currentUsername ? `/profile/${currentUsername}` : "/login"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 rounded-full px-4 py-3 text-zinc-400 transition-colors hover:bg-zinc-900"
          >
            <User size={22} />
            <span className="text-lg">Profil</span>
          </Link>
        </nav>

        {/* Çıkış */}
        <div className="border-t border-zinc-800 px-2 py-3">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-4 rounded-full px-4 py-3 text-zinc-400 transition-colors hover:bg-zinc-900"
            >
              <LogOut size={22} />
              <span className="text-lg">Çıkış</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

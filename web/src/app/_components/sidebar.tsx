import Link from "next/link";
import { Home, Briefcase, Bell, Mail, User, LogOut } from "lucide-react";
import { logout } from "@/app/actions";

interface SidebarProps {
  currentUsername: string | null;
}

const navItems = [
  { href: "/", icon: Home, label: "Ana Sayfa" },
  { href: "/jobs", icon: Briefcase, label: "İlanlar" },
  { href: "/notifications", icon: Bell, label: "Bildirimler" },
  { href: "/messages", icon: Mail, label: "Mesajlar" },
];

export default function Sidebar({ currentUsername }: SidebarProps) {
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
            className="flex items-center gap-4 rounded-full px-3 py-3 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <item.icon size={22} />
            <span className="text-lg">{item.label}</span>
          </Link>
        ))}

        <Link
          href={currentUsername ? `/profile/${currentUsername}` : "/login"}
          className="flex items-center gap-4 rounded-full px-3 py-3 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
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

      <button className="w-full rounded-full bg-white py-3 text-sm font-bold text-black transition-opacity hover:opacity-90">
        Sorun Paylaş
      </button>
    </aside>
  );
}

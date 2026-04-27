"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";

export default function PostModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [closeRequested, setCloseRequested] = useState(false);

  // Modal yalnızca /post/* yolundayken ve manuel kapatılmamışken görünür.
  // Modal içindeki <Link href="/profile/..."> gibi soft-nav geçişlerinde
  // pathname değiştiği an `open` türetilen değeri otomatik false olur,
  // overlay/scroll lock takılı kalmaz.
  const open = pathname?.startsWith("/post/") === true && !closeRequested;

  const handleClose = useCallback(() => {
    setCloseRequested(true);
    // Sadece aynı origin'den gelen güvenli bir history girdisi varsa back yap;
    // aksi halde feed'e geri dön (history kirlenmesini önler).
    const sameOriginReferrer =
      typeof document !== "undefined" &&
      document.referrer.startsWith(window.location.origin);
    if (window.history.length > 1 && sameOriginReferrer) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-900/80-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 my-12 w-full max-w-xl">
        {/* Kapat butonu */}
        <button
          onClick={handleClose}
          className="absolute -top-10 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="rounded-2xl border border-zinc-800 bg-black shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}

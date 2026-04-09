"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) {
        params.set("q", q.trim());
        params.delete("tag");
      } else {
        params.delete("q");
      }
      params.delete("tab");
      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      push(value);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleClear() {
    setValue("");
    router.push("/search");
  }

  return (
    <div className="relative flex items-center">
      <Search
        size={18}
        className="absolute left-4 text-zinc-500 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ara..."
        className="w-full rounded-full border border-zinc-800 bg-zinc-900 py-3 pl-11 pr-10 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-white"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-4 text-zinc-500 hover:text-white transition-colors"
          aria-label="Temizle"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

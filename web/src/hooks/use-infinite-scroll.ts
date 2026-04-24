"use client";

import { useEffect, useRef } from "react";

/**
 * Sentinel element görüntülendiğinde `onLoadMore` çağrılır.
 * Callback'i ref ile saklar — her render'da observer yeniden kurulmaz.
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean
): React.RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onLoadMore);

  useEffect(() => {
    callbackRef.current = onLoadMore;
  });

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) callbackRef.current();
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  return sentinelRef;
}

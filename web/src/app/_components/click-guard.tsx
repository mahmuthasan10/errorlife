"use client";

/**
 * Server Component'ler içinde onClick kullanılamaz.
 * Bu wrapper, children'a gelen tıklamanın üst Link'e
 * yayılmasını (propagation) engeller.
 */
export default function ClickGuard({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "span";
}) {
  return (
    <Tag
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      className={className}
    >
      {children}
    </Tag>
  );
}

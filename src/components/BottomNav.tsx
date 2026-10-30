"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ClockIcon, ConsultIcon, LeafIcon, UserIcon } from "./Icons";

const items = [
  { href: "/", key: "home", Icon: ConsultIcon, match: (p: string) => p === "/" },
  { href: "/history", key: "history", Icon: ClockIcon, match: (p: string) => p.startsWith("/history") },
  { href: "/profile", key: "profile", Icon: UserIcon, match: (p: string) => p.startsWith("/profile") },
] as const;

/** Phone: tab bar at the bottom. */
export default function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  // The chat screen has its own composer at the bottom, so the tab bar steps aside.
  if (/^\/history\/[^/]+$/.test(pathname)) return null;

  return (
    <nav className="bottom-nav" aria-label={t("mainLabel")}>
      {items.map(({ href, key, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link key={href} href={href} className={`bottom-nav-item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
            <Icon size={24} />
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Laptop/desktop: fixed sidebar on the left. */
export function SideNav() {
  const t = useTranslations();
  const pathname = usePathname();
  return (
    <aside className="side-nav">
      <Link href="/" className="brand"><LeafIcon size={28} /> PlantLens AI</Link>
      <nav aria-label={t("nav.mainLabel")} className="side-nav-links">
        {items.map(({ href, key, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link key={href} href={href} className={`side-nav-item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
              <Icon size={22} />
              <span>{t(`nav.${key}`)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

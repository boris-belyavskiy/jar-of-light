"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, Info, Settings, Tags } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app", key: "feed", icon: BookHeart },
  { href: "/app/categories", key: "categories", icon: Tags },
  { href: "/app/settings", key: "settings", icon: Settings },
  { href: "/about", key: "about", icon: Info },
] as const;

function isActive(href: string, pathname: string) {
  // Entry pages belong to the journal tab.
  if (href === "/app") return pathname === "/app" || pathname.startsWith("/app/entry");
  return pathname.startsWith(href);
}

/** The signed-in tabs: icons on phones, icons with labels on wider screens. */
export function NavTabs() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-0.5">
      {TABS.map(({ href, key, icon: Icon }) => {
        const active = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={t(key)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm transition-colors",
              active ? "bg-sky font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="hidden md:inline">{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

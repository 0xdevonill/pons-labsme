"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Plus, User, Activity, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ConnectButton } from "./connect-button";
import { ThemeToggle } from "./theme-toggle";
import { BrandMark } from "./brand-mark";
import { SiteFooter } from "./site-footer";
import { APP_NAME } from "@/lib/brand";

const NAV = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/create", label: "Create", icon: Plus },
  { href: "/me", label: "My tokens", icon: User },
  { href: "/activity", label: "Activity", icon: Activity },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-30" />
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg0)_78%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" aria-label={APP_NAME} className="flex items-center gap-2.5">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm transition",
                    active ? "bg-white/10 text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectButton />
            <button
              className="rounded-full p-2 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="border-t border-[var(--line)] px-4 py-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </header>
      <main className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-8 md:pb-16">{children}</main>
      <div className="relative pb-20 md:pb-0">
        <SiteFooter />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg0)_86%,transparent)] backdrop-blur-xl md:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-[11px]",
                active ? "text-[var(--ink)]" : "text-[var(--muted)]",
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

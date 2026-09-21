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
  { href: "/", label: "Explore" },
  { href: "/create", label: "Create" },
  { href: "/me", label: "Profile" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 bg-[color-mix(in_srgb,var(--bg0)_86%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label={APP_NAME}>
              <BrandMark />
            </Link>
            <nav className="hidden items-center gap-1 rounded-full bg-white p-1 shadow-sm md:flex dark:bg-white/10">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/" || pathname.startsWith("/explore")
                    : pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm transition",
                      active ? "bg-black text-white dark:bg-white dark:text-black" : "text-[var(--muted)] hover:text-[var(--ink)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectButton />
            <button className="rounded-full p-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="border-t border-[var(--line)] px-4 py-3 md:hidden">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block rounded-xl px-2 py-2 text-sm">
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </header>
      <main className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:pb-16">{children}</main>
      <div className="relative pb-20 md:pb-0">
        <SiteFooter />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg0)_92%,transparent)] backdrop-blur-xl md:hidden">
        {[
          { href: "/", label: "Explore", icon: Compass },
          { href: "/create", label: "Create", icon: Plus },
          { href: "/me", label: "Profile", icon: User },
          { href: "/activity", label: "Activity", icon: Activity },
        ].map((item) => {
          const active = item.href === "/" ? pathname === "/" || pathname.startsWith("/explore") : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex flex-col items-center gap-1 py-3 text-[11px]", active ? "text-[var(--ink)]" : "text-[var(--muted)]")}
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

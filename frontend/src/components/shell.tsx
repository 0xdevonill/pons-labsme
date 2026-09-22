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
  { href: "/create", label: "Launch" },
  { href: "/me", label: "Profile" },
  { href: "/activity", label: "Activity" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-transparent bg-[color-mix(in_srgb,var(--bg0)_72%,transparent)] backdrop-blur-2xl">
        <div className="mx-auto flex h-[4.4rem] max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label={APP_NAME} className="rounded-2xl">
              <BrandMark showWordmark size={38} />
            </Link>
            <nav className="hidden items-center gap-1 rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] p-1 shadow-sm md:flex">
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
                      "rounded-full px-3.5 py-1.5 text-sm font-medium",
                      active
                        ? "bg-[#111] text-white shadow-sm dark:bg-[var(--lime)] dark:text-black"
                        : "text-[var(--muted)] hover:text-[var(--ink)]",
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
            <button className="icon-btn md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
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
                className="block rounded-xl px-2 py-2.5 text-sm font-medium"
              >
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
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg0)_88%,transparent)] backdrop-blur-xl md:hidden">
        {[
          { href: "/", label: "Explore", icon: Compass },
          { href: "/create", label: "Launch", icon: Plus },
          { href: "/me", label: "Profile", icon: User },
          { href: "/activity", label: "Activity", icon: Activity },
        ].map((item) => {
          const active = item.href === "/" ? pathname === "/" || pathname.startsWith("/explore") : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-[11px] font-medium",
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

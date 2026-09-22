import Link from "next/link";
import { Mail, Globe } from "lucide-react";
import { APP_NAME, APP_TAGLINE, CONTACT } from "@/lib/brand";
import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-4 pb-10">
      <div className="surface overflow-hidden rounded-[32px] p-8 md:p-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_1fr]">
          <div>
            <BrandMark showWordmark size={40} />
            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">
              {APP_TAGLINE}. Your wallet submits every transaction. {APP_NAME} does not custody
              assets.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Product</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)]">
              <li>
                <Link className="soft-link" href="/">
                  Explore
                </Link>
              </li>
              <li>
                <Link className="soft-link" href="/create">
                  Launch token
                </Link>
              </li>
              <li>
                <Link className="soft-link" href="/me">
                  Profile
                </Link>
              </li>
              <li>
                <Link className="soft-link" href="/activity">
                  Activity
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Contact</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <a className="soft-link inline-flex items-center gap-2" href={`mailto:${CONTACT.email}`}>
                  <Mail size={14} />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  className="soft-link inline-flex items-center gap-2"
                  href={CONTACT.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe size={14} />
                  {CONTACT.websiteLabel}
                </a>
              </li>
              <li>
                <a
                  className="soft-link inline-flex items-center gap-2"
                  href={CONTACT.twitter}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="grid h-3.5 w-3.5 place-items-center text-[11px] font-bold">𝕏</span>
                  {CONTACT.twitterHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-[var(--line)] pt-5 text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} {APP_NAME}. Built for Robinhood Chain.
        </p>
      </div>
    </footer>
  );
}

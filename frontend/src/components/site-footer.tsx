import Link from "next/link";
import { APP_NAME, CONTACT } from "@/lib/brand";
import { explorerAddress, V1_FACTORY, V2_FACTORY } from "@/lib/contracts/addresses";
import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="relative mt-16 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg0)_88%,transparent)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.2fr_0.8fr_1fr]">
        <div>
          <BrandMark />
          <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
            A professional token market on Robinhood Chain. Creation, trading, and graduation still settle on the
            live Pons factories.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a className="hover:text-[var(--ink)]" href={`mailto:${CONTACT.email}`}>
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a className="hover:text-[var(--ink)]" href={CONTACT.website} target="_blank" rel="noreferrer">
                ponsfamily.com
              </a>
            </li>
            <li>
              <a className="hover:text-[var(--ink)]" href={CONTACT.twitter} target="_blank" rel="noreferrer">
                {CONTACT.twitterHandle}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Contract addresses</h2>
          <ul className="mt-3 space-y-2 font-[family-name:var(--font-mono)] text-xs leading-6">
            <li>
              <span className="text-[var(--muted)]">V1 factory · </span>
              <a className="hover:text-[var(--ink)]" href={explorerAddress(V1_FACTORY)} target="_blank" rel="noreferrer">
                {V1_FACTORY}
              </a>
            </li>
            <li>
              <span className="text-[var(--muted)]">V2 factory · </span>
              <a className="hover:text-[var(--ink)]" href={explorerAddress(V2_FACTORY)} target="_blank" rel="noreferrer">
                {V2_FACTORY}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-[var(--muted)]">
          <p>
            {APP_NAME} does not replace Pons contracts. Support remains {CONTACT.email}.
          </p>
          <div className="flex gap-4">
            <Link href="/explore">Explore</Link>
            <Link href="/create">Create</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

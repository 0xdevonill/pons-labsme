import Link from "next/link";
import { APP_NAME, APP_TAGLINE, CONTACT } from "@/lib/brand";
import { explorerAddress, V1_FACTORY, V2_FACTORY } from "@/lib/contracts/addresses";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-4 pb-10">
      <div className="rounded-[28px] bg-white p-8 shadow-sm dark:bg-[var(--panel)]">
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.7fr_0.7fr_1fr]">
          <div>
            <p className="font-[family-name:var(--font-display)] text-3xl lowercase">{APP_NAME}</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
              {APP_TAGLINE}. Your wallet submits every transaction. {APP_NAME} does not custody assets. Settles on the
              live Pons V1 and V2 factories.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium">Product</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li><Link href="/">Explore</Link></li>
              <li><Link href="/create">Create</Link></li>
              <li><Link href="/me">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-medium">Contact</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
              <li><a href={CONTACT.website} target="_blank" rel="noreferrer">ponsfamily.com</a></li>
              <li><a href={CONTACT.twitter} target="_blank" rel="noreferrer">{CONTACT.twitterHandle}</a></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-medium">Contracts</h2>
            <ul className="mt-3 space-y-2 font-[family-name:var(--font-mono)] text-[11px] leading-5 text-[var(--muted)]">
              <li>
                V1 · <a href={explorerAddress(V1_FACTORY)} target="_blank" rel="noreferrer">{V1_FACTORY}</a>
              </li>
              <li>
                V2 · <a href={explorerAddress(V2_FACTORY)} target="_blank" rel="noreferrer">{V2_FACTORY}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

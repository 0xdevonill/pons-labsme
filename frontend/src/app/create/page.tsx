import { CreateForm } from "@/components/create-form";

export const metadata = {
  title: "Create token",
};

export default function CreatePage() {
  return (
    <div>
      <p className="section-kicker">Launch</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">Create token</h1>
      <p className="mt-2 mb-6 max-w-2xl text-[var(--muted)]">
        Upload still or animated art to IPFS. Metadata.json is generated automatically, the metadata URI is stored
        on-chain, and you can set creator commission the same way Pons Market does.
      </p>
      <CreateForm />
    </div>
  );
}

import { CreateForm } from "@/components/create-form";

export const metadata = {
  title: "Create token",
};

export default function CreatePage() {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl">Create token</h1>
      <p className="mt-2 mb-6 max-w-2xl text-[var(--muted)]">
        Art uploads to IPFS, metadata.json is generated automatically, and the metadata URI is stored on-chain.
        Preview the card before you sign.
      </p>
      <CreateForm />
    </div>
  );
}

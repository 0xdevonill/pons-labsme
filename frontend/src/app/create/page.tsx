import { CreateForm } from "@/components/create-form";
import Link from "next/link";

export const metadata = {
  title: "Launch token",
};

export default function CreatePage() {
  return (
    <div>
      <Link href="/" className="mb-4 inline-flex rounded-full bg-white px-3 py-1.5 text-sm shadow-sm dark:bg-[var(--panel)]">
        ← Back
      </Link>
      <CreateForm />
    </div>
  );
}

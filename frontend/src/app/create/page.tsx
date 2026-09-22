import { CreateForm } from "@/components/create-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Launch token",
};

export default function CreatePage() {
  return (
    <div>
      <Link href="/" className="btn-secondary mb-4 h-10 px-4 text-sm">
        <ArrowLeft size={15} />
        Back
      </Link>
      <CreateForm />
    </div>
  );
}

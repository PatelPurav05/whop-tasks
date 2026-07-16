import type { ProofFieldType } from "@/components/business/types";
import type { JsonValue } from "@/db/schema";
import { ProofFilePreview } from "./proof-file-preview";

export type SubmittedProofFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export function SubmittedProofAnswer({
  fieldType,
  value,
  file,
}: {
  fieldType: ProofFieldType;
  value: JsonValue | undefined;
  file: SubmittedProofFile | null;
}) {
  if (file) {
    return <ProofFilePreview file={file} />;
  }

  if (value === undefined || value === null) {
    return <span className="text-[var(--muted)]">No answer provided</span>;
  }

  if (fieldType === "confirmation") {
    return value === true ? "Confirmed" : "Not confirmed";
  }

  if (fieldType === "url" && typeof value === "string") {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="break-all text-[var(--brand-indigo)] underline underline-offset-4 dark:text-[var(--brand-cerulean)]"
      >
        {value}
      </a>
    );
  }

  if (typeof value === "string") {
    return <span className="whitespace-pre-wrap">{value}</span>;
  }

  return (
    <span className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</span>
  );
}

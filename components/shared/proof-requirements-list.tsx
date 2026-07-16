import { Badge } from "@whop/react/components";
import type { ProofFieldType } from "@/components/business/types";

const proofFieldTypeLabels: Record<ProofFieldType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  url: "URL",
  image: "Image",
  file: "File",
  confirmation: "Confirmation",
};

export type ProofRequirementItem = {
  id: string;
  label: string;
  helpText?: string | null;
  fieldType: ProofFieldType;
  required: boolean;
};

export function ProofRequirementsList({
  requirements,
}: {
  requirements: ProofRequirementItem[];
}) {
  return (
    <ol className="mt-5 flex flex-col gap-2">
      {requirements.map((requirement, index) => (
        <li
          key={requirement.id}
          className="flex gap-4 rounded-xl bg-[var(--surface-subtle)] px-4 py-3.5 ring-1 ring-black/4 dark:ring-white/8"
        >
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-sm font-medium tabular-nums text-[var(--muted)] ring-1 ring-black/6 dark:ring-white/10"
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-5">
              {requirement.label}
              {requirement.required ? (
                <span className="sr-only">, required</span>
              ) : (
                <span className="sr-only">, optional</span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge color="gray" variant="soft" size="1">
                {proofFieldTypeLabels[requirement.fieldType]}
              </Badge>
              {requirement.required ? (
                <Badge color="orange" variant="soft" size="1">
                  Required
                </Badge>
              ) : null}
            </div>
            {requirement.helpText ? (
              <p className="mt-1.5 text-sm leading-5 text-[var(--muted)]">
                {requirement.helpText}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

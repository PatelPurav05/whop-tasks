"use client";

import {
  Button,
  Checkbox,
  TextArea,
  TextField,
} from "@whop/react/components";
import { useActionState } from "react";
import {
  submitProofAction,
  type ProofActionState,
} from "@/app/earn/tasks/[claimId]/actions";
import type { SubmittedProofFile } from "@/components/shared/submitted-proof-answer";
import { ProofFilePreview } from "@/components/shared/proof-file-preview";
import type {
  JsonValue,
  ProofRequirement,
} from "@/db/schema";

const initialState: ProofActionState = { error: null };

function stringValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}

export function ProofForm({
  claimId,
  requirements,
  existingAnswers,
  existingFiles = {},
  isRevision,
}: {
  claimId: string;
  requirements: ProofRequirement[];
  existingAnswers: Record<string, JsonValue>;
  existingFiles?: Record<string, SubmittedProofFile>;
  isRevision: boolean;
}) {
  const [state, action, pending] = useActionState(
    submitProofAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-7">
      <input type="hidden" name="claimId" value={claimId} />
      {requirements.map((requirement, index) => {
        const fieldName = `proof_${requirement.id}`;
        const existingValue = existingAnswers[requirement.id];
        const existingFile =
          typeof existingValue === "string"
            ? (existingFiles[existingValue] ?? null)
            : null;
        const fieldId = `requirement-${requirement.id}`;
        const helpId = `${fieldId}-help`;

        return (
          <fieldset
            key={requirement.id}
            className="border-b border-[var(--border)] pb-7 last:border-b-0 last:pb-0"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--surface-subtle)] text-xs font-medium">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor={fieldId} className="block font-medium">
                  {requirement.label}
                  {requirement.required ? (
                    <span className="ml-1 text-[var(--accent)]">*</span>
                  ) : (
                    <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                      Optional
                    </span>
                  )}
                </label>
                {requirement.helpText ? (
                  <p id={helpId} className="mt-1 text-sm text-[var(--muted)]">
                    {requirement.helpText}
                  </p>
                ) : null}

                <div className="mt-3">
                  {requirement.fieldType === "long_text" ? (
                    <TextArea
                      id={fieldId}
                      name={fieldName}
                      defaultValue={stringValue(existingValue)}
                      required={requirement.required}
                      maxLength={requirement.config.maxLength}
                      rows={6}
                      size="3"
                      aria-describedby={requirement.helpText ? helpId : undefined}
                    />
                  ) : requirement.fieldType === "short_text" ||
                    requirement.fieldType === "url" ? (
                    <TextField.Input
                      id={fieldId}
                      type={
                        requirement.fieldType === "url" ? "url" : "text"
                      }
                      name={fieldName}
                      defaultValue={stringValue(existingValue)}
                      required={requirement.required}
                      maxLength={requirement.config.maxLength}
                      size="3"
                      aria-describedby={requirement.helpText ? helpId : undefined}
                    />
                  ) : requirement.fieldType === "confirmation" ? (
                    <label
                      htmlFor={fieldId}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3"
                    >
                      <Checkbox
                        id={fieldId}
                        name={fieldName}
                        defaultChecked={existingValue === true}
                        required={requirement.required}
                        color="orange"
                      />
                      <span className="text-sm">I confirm this is complete</span>
                    </label>
                  ) : (
                    <div>
                      <input
                        id={fieldId}
                        type="file"
                        name={fieldName}
                        required={
                          requirement.required &&
                          typeof existingValue !== "string"
                        }
                        accept={
                          requirement.fieldType === "image"
                            ? "image/jpeg,image/png"
                            : (
                                requirement.config.acceptedMimeTypes ?? [
                                  "image/jpeg",
                                  "image/png",
                                  "application/pdf",
                                ]
                              ).join(",")
                        }
                        aria-describedby={requirement.helpText ? helpId : undefined}
                        className="block min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--surface-subtle)] file:px-3 file:py-1.5 file:font-medium"
                      />
                      <div className="mt-3 space-y-3">
                        <p className="text-xs text-[var(--muted)]">
                          PNG, JPEG, or PDF. Maximum 8 MB.
                          {existingFile
                            ? " Upload a new file only if you want to replace the current one."
                            : null}
                        </p>
                        {existingFile ? (
                          <ProofFilePreview file={existingFile} />
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </fieldset>
        );
      })}

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3 text-sm text-[var(--danger)]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--muted)]">
          Your proof becomes visible to the campaign owner after submission.
        </p>
        <Button
          type="submit"
          variant="solid"
          color="orange"
          size="3"
          loading={pending}
          disabled={pending}
          className="sm:min-w-36"
        >
          {isRevision ? "Resubmit proof" : "Submit proof"}
        </Button>
      </div>
    </form>
  );
}

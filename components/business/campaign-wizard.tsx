"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Callout,
  Checkbox,
  Progress,
  Select,
  TextArea,
  TextField,
} from "@whop/react/components";
import { Plus16, XMark16 } from "@frosted-ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createCampaignAction } from "@/app/business/actions";
import { formatMoney } from "@/components/business/format";
import type {
  ActionResult,
  CampaignDraftInput,
  ProofFieldType,
} from "@/components/business/types";

type RequirementDraft = {
  id: string;
  label: string;
  helpText: string;
  fieldType: ProofFieldType;
  required: boolean;
};

type WizardState = {
  title: string;
  description: string;
  category: string;
  instructions: string;
  deadline: string;
  rewardDollars: string;
  slotCapacity: string;
  claimWindowHours: string;
  requirements: RequirementDraft[];
};

const steps = [
  "Basics",
  "Proof requirements",
  "Reward and capacity",
  "Review and publish",
] as const;

const fieldTypes: Array<{ value: ProofFieldType; label: string }> = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "url", label: "URL" },
  { value: "image", label: "Image" },
  { value: "file", label: "File" },
  { value: "confirmation", label: "Confirmation" },
];

const categories = [
  "User research",
  "Content",
  "Product QA",
  "Community",
  "Sales research",
] as const;

const initialState: WizardState = {
  title: "",
  description: "",
  category: "",
  instructions: "",
  deadline: "",
  rewardDollars: "",
  slotCapacity: "",
  claimWindowHours: "24",
  requirements: [
    {
      id: "proof-1",
      label: "",
      helpText: "",
      fieldType: "short_text",
      required: true,
    },
  ],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function requirementKey(label: string, index: number): string {
  const normalized = slugify(label).replaceAll("-", "_");
  const safe = /^[a-z]/.test(normalized) ? normalized : `proof_${normalized}`;
  return `${safe || "proof"}_${index + 1}`.slice(0, 64);
}

function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[15px] leading-[18px] font-medium"
    >
      {children}
      {hint ? (
        <span className="ml-2 font-normal text-current/55">{hint}</span>
      ) : null}
    </label>
  );
}

export function CampaignWizard({ balanceCents }: { balanceCents: number }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(initialState);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const shouldReduceMotion = useReducedMotion();

  const rewardCents = Math.round(Number(state.rewardDollars || 0) * 100);
  const slotCapacity = Number(state.slotCapacity || 0);
  const totalBudget = rewardCents * slotCapacity;
  const budgetPercent =
    balanceCents > 0 ? Math.min((totalBudget / balanceCents) * 100, 100) : 100;

  const canAfford = totalBudget > 0 && totalBudget <= balanceCents;

  const summary = useMemo(
    () => [
      { label: "Reward per task", value: formatMoney(rewardCents) },
      { label: "Available slots", value: String(slotCapacity || 0) },
      { label: "Escrow at publish", value: formatMoney(totalBudget) },
      {
        label: "Proof fields",
        value: String(state.requirements.length),
      },
    ],
    [rewardCents, slotCapacity, state.requirements.length, totalBudget],
  );

  function validateCurrentStep(): string | null {
    if (step === 0) {
      if (state.title.trim().length < 3) return "Add a campaign title";
      if (state.description.trim().length < 20)
        return "Describe the outcome in at least 20 characters";
      if (!state.category) return "Choose a category";
      if (state.instructions.trim().length < 20)
        return "Add clear task instructions";
      if (!state.deadline || new Date(state.deadline) <= new Date())
        return "Choose a future deadline";
    }
    if (step === 1) {
      if (state.requirements.length === 0)
        return "Add at least one proof requirement";
      if (state.requirements.some((requirement) => !requirement.label.trim()))
        return "Give every proof requirement a label";
    }
    if (step === 2) {
      if (!Number.isSafeInteger(rewardCents) || rewardCents <= 0)
        return "Enter a positive reward";
      if (!Number.isSafeInteger(slotCapacity) || slotCapacity <= 0)
        return "Enter a whole number of slots";
      const claimWindowHours = Number(state.claimWindowHours);
      if (!Number.isSafeInteger(claimWindowHours) || claimWindowHours <= 0)
        return "Enter a valid claim window";
    }
    return null;
  }

  function nextStep(): void {
    const validationMessage = validateCurrentStep();
    if (validationMessage) {
      setResult({ ok: false, message: validationMessage });
      return;
    }
    setResult(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep(): void {
    setResult(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  function updateRequirement(
    id: string,
    update: Partial<RequirementDraft>,
  ): void {
    setState((current) => ({
      ...current,
      requirements: current.requirements.map((requirement) =>
        requirement.id === id ? { ...requirement, ...update } : requirement,
      ),
    }));
  }

  function addRequirement(): void {
    setState((current) => ({
      ...current,
      requirements: [
        ...current.requirements,
        {
          id: `proof-${Date.now()}`,
          label: "",
          helpText: "",
          fieldType: "short_text",
          required: true,
        },
      ],
    }));
  }

  function removeRequirement(id: string): void {
    setState((current) => ({
      ...current,
      requirements: current.requirements.filter(
        (requirement) => requirement.id !== id,
      ),
    }));
  }

  function submit(intent: "draft" | "publish"): void {
    const validationMessage = validateCurrentStep();
    if (validationMessage) {
      setResult({ ok: false, message: validationMessage });
      return;
    }

    const input: CampaignDraftInput = {
      title: state.title,
      description: state.description,
      category: state.category,
      instructions: state.instructions,
      rewardCents,
      slotCapacity,
      claimWindowHours: Number(state.claimWindowHours),
      deadline: new Date(state.deadline).toISOString(),
      proofRequirements: state.requirements.map((requirement, index) => ({
        key: requirementKey(requirement.label, index),
        label: requirement.label,
        helpText: requirement.helpText || undefined,
        fieldType: requirement.fieldType,
        required: requirement.required,
        config:
          requirement.fieldType === "short_text"
            ? { maxLength: 500 }
            : requirement.fieldType === "long_text"
              ? { maxLength: 10_000 }
              : {},
      })),
    };

    setResult(null);
    startTransition(async () => {
      const nextResult = await createCampaignAction(input, intent);
      setResult(nextResult);
      if (nextResult.ok && nextResult.redirectTo) {
        router.push(nextResult.redirectTo);
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside aria-label="Campaign creation progress">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
          {steps.map((label, index) => (
            <li key={label}>
              <Button
                type="button"
                disabled={index > step}
                onClick={() => setStep(index)}
                variant={
                  index === step ? "solid" : index < step ? "soft" : "ghost"
                }
                color={index === step ? "orange" : "gray"}
                className="min-h-11 w-full justify-start"
                aria-current={index === step ? "step" : undefined}
              >
                <span className="font-medium">{index + 1}</span>
                <span>{label}</span>
              </Button>
            </li>
          ))}
        </ol>
      </aside>

      <section className="min-w-0">
        <div className="mb-7">
          <p className="text-[12px] leading-[15px] text-current/55">
            Step {step + 1} of {steps.length}
          </p>
          <h2 className="mt-2 text-[24px] leading-[27px] font-medium">
            {steps[step]}
          </h2>
        </div>

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={step}
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 0, x: 8, filter: "blur(2px)" }
            }
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: -5, filter: "blur(2px)" }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {step === 0 ? (
              <div className="space-y-6">
            <div>
              <FieldLabel htmlFor="campaign-title">Campaign title</FieldLabel>
              <TextField.Root size="3">
                <TextField.Input
                  id="campaign-title"
                  value={state.title}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Review our mobile checkout"
                  maxLength={120}
                />
              </TextField.Root>
              <p className="mt-2 text-[12px] leading-[15px] text-current/50">
                We generate the public task link automatically.
              </p>
            </div>

            <div>
              <FieldLabel htmlFor="campaign-description">
                What outcome do you need?
              </FieldLabel>
              <TextArea
                id="campaign-description"
                value={state.description}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                maxLength={2_000}
                placeholder="Tell earners what a successful result looks like."
              />
              <p className="mt-2 text-[12px] leading-[15px] text-current/50">
                {state.description.length}/2,000
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel>Category</FieldLabel>
                <Select.Root
                  value={state.category}
                  onValueChange={(category) =>
                    setState((current) => ({ ...current, category }))
                  }
                >
                  <Select.Trigger
                    className="w-full"
                    placeholder="Choose a category"
                  />
                  <Select.Content>
                    {categories.map((category) => (
                      <Select.Item key={category} value={category}>
                        {category}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </div>
              <div>
                <FieldLabel htmlFor="campaign-deadline">Deadline</FieldLabel>
                <TextField.Root size="3">
                  <TextField.Input
                    id="campaign-deadline"
                    type="datetime-local"
                    value={state.deadline}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        deadline: event.target.value,
                      }))
                    }
                  />
                </TextField.Root>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="campaign-instructions">
                Task instructions
              </FieldLabel>
              <TextArea
                id="campaign-instructions"
                value={state.instructions}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    instructions: event.target.value,
                  }))
                }
                rows={7}
                maxLength={10_000}
                placeholder="List the steps, constraints, and acceptance criteria."
              />
            </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-5">
            <p className="max-w-[68ch] text-[15px] leading-[20px] text-current/65">
              Ask only for evidence you will use during review. Earners see
              these fields in this order.
            </p>
            <div className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/12 dark:border-white/12">
              {state.requirements.map((requirement, index) => (
                <div key={requirement.id} className="py-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge color="gray" variant="soft">
                        {index + 1}
                      </Badge>
                      <h3 className="text-[17px] leading-[21px] font-medium">
                        Proof field
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      color="danger"
                      disabled={state.requirements.length === 1}
                      onClick={() => removeRequirement(requirement.id)}
                      aria-label={`Remove proof field ${index + 1}`}
                    >
                      <XMark16 aria-hidden="true" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px]">
                    <div>
                      <FieldLabel htmlFor={`${requirement.id}-label`}>
                        Prompt
                      </FieldLabel>
                      <TextField.Root size="3">
                        <TextField.Input
                          id={`${requirement.id}-label`}
                          value={requirement.label}
                          onChange={(event) =>
                            updateRequirement(requirement.id, {
                              label: event.target.value,
                            })
                          }
                          placeholder="Share the public result URL"
                          maxLength={120}
                        />
                      </TextField.Root>
                    </div>
                    <div>
                      <FieldLabel>Answer type</FieldLabel>
                      <Select.Root
                        value={requirement.fieldType}
                        onValueChange={(fieldType: ProofFieldType) =>
                          updateRequirement(requirement.id, { fieldType })
                        }
                      >
                        <Select.Trigger className="w-full" />
                        <Select.Content>
                          {fieldTypes.map((fieldType) => (
                            <Select.Item
                              key={fieldType.value}
                              value={fieldType.value}
                            >
                              {fieldType.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </div>
                  </div>

                  <div className="mt-5">
                    <FieldLabel htmlFor={`${requirement.id}-help`} hint="Optional">
                      Help text
                    </FieldLabel>
                    <TextField.Root size="3">
                      <TextField.Input
                        id={`${requirement.id}-help`}
                        value={requirement.helpText}
                        onChange={(event) =>
                          updateRequirement(requirement.id, {
                            helpText: event.target.value,
                          })
                        }
                        placeholder="Explain what a valid answer must include."
                        maxLength={300}
                      />
                    </TextField.Root>
                  </div>

                  <label className="mt-5 flex cursor-pointer items-center gap-3 text-[15px] leading-[18px]">
                    <Checkbox
                      checked={requirement.required}
                      onCheckedChange={(checked) =>
                        updateRequirement(requirement.id, {
                          required: checked === true,
                        })
                      }
                    />
                    Required for submission
                  </label>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="soft"
              color="gray"
              onClick={addRequirement}
            >
              <Plus16 aria-hidden="true" />
              Add proof field
            </Button>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-7">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="campaign-reward">
                  Reward per approved task
                </FieldLabel>
                <TextField.Root size="3">
                  <TextField.Slot>$</TextField.Slot>
                  <TextField.Input
                    id="campaign-reward"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={state.rewardDollars}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        rewardDollars: event.target.value,
                      }))
                    }
                    placeholder="25.00"
                  />
                </TextField.Root>
              </div>
              <div>
                <FieldLabel htmlFor="campaign-capacity">
                  Available slots
                </FieldLabel>
                <TextField.Root size="3">
                  <TextField.Input
                    id="campaign-capacity"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={state.slotCapacity}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        slotCapacity: event.target.value,
                      }))
                    }
                    placeholder="10"
                  />
                </TextField.Root>
              </div>
            </div>

            <div className="max-w-sm">
              <FieldLabel htmlFor="campaign-claim-window">
                Time to submit after claiming
              </FieldLabel>
              <TextField.Root size="3">
                <TextField.Input
                  id="campaign-claim-window"
                  type="number"
                  min="1"
                  max="168"
                  step="1"
                  inputMode="numeric"
                  value={state.claimWindowHours}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      claimWindowHours: event.target.value,
                    }))
                  }
                />
                <TextField.Slot>hours</TextField.Slot>
              </TextField.Root>
            </div>

            <div className="border-y border-black/10 py-6 dark:border-white/12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[12px] leading-[15px] text-current/55">
                    Total campaign escrow
                  </p>
                  <p className="mt-1 text-[24px] leading-[27px] font-medium tabular-nums">
                    {formatMoney(totalBudget)}
                  </p>
                </div>
                <p className="text-right text-[12px] leading-[15px] text-current/60">
                  Wallet balance
                  <br />
                  <span className="font-medium text-current">
                    {formatMoney(balanceCents)}
                  </span>
                </p>
              </div>
              <Progress
                value={budgetPercent}
                max={100}
                color={canAfford ? "orange" : "danger"}
                size="3"
                className="mt-4"
                aria-label={`${formatMoney(totalBudget)} of ${formatMoney(balanceCents)} available wallet balance`}
              />
              {totalBudget > balanceCents ? (
                <p className="mt-3 text-[12px] leading-[15px] text-red-700 dark:text-red-300">
                  You need {formatMoney(totalBudget - balanceCents)} more in your
                  wallet to publish. You can still save this campaign as a draft.
                </p>
              ) : (
                <p className="mt-3 text-[12px] leading-[15px] text-current/55">
                  Funds move into escrow only when you publish.
                </p>
              )}
            </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-7">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge color="orange" variant="soft">
                  {state.category}
                </Badge>
                <span className="text-[12px] leading-[15px] text-current/55">
                  Public link created automatically
                </span>
              </div>
              <h3 className="mt-3 text-[24px] leading-[27px] font-medium">
                {state.title}
              </h3>
              <p className="mt-3 max-w-[68ch] whitespace-pre-wrap text-[15px] leading-[20px] text-current/65">
                {state.description}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-black/10 py-6 dark:border-white/12 sm:grid-cols-4">
              {summary.map((item) => (
                <div key={item.label}>
                  <dt className="text-[12px] leading-[15px] text-current/55">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-[17px] leading-[21px] font-medium tabular-nums">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div>
              <h3 className="text-[17px] leading-[21px] font-medium">
                Proof checklist
              </h3>
              <ol className="mt-3 divide-y divide-black/10 border-y border-black/10 dark:divide-white/12 dark:border-white/12">
                {state.requirements.map((requirement, index) => (
                  <li
                    key={requirement.id}
                    className="flex items-center justify-between gap-4 py-3 text-[15px] leading-[18px]"
                  >
                    <span>
                      {index + 1}. {requirement.label}
                    </span>
                    <span className="text-[12px] leading-[15px] text-current/55">
                      {
                        fieldTypes.find(
                          (fieldType) =>
                            fieldType.value === requirement.fieldType,
                        )?.label
                      }
                      {requirement.required ? " · Required" : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <Callout.Root
              color={canAfford ? "info" : "warning"}
              variant="soft"
            >
              <Callout.Text>
                {canAfford
                  ? `${formatMoney(totalBudget)} will move from your wallet into campaign escrow when you publish.`
                  : "Your wallet cannot cover this campaign yet. Save it as a draft and publish after adding funds."}
              </Callout.Text>
            </Callout.Root>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {result ? (
          <div className="mt-6">
            <Callout.Root
              color={result.ok ? "success" : "danger"}
              variant="soft"
              role={result.ok ? "status" : "alert"}
            >
              <Callout.Text>{result.message}</Callout.Text>
            </Callout.Root>
            {!result.ok && result.redirectTo ? (
              <Button asChild variant="soft" color="gray" className="mt-3">
                <Link href={result.redirectTo}>Open saved draft</Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        <footer className="mt-8 flex flex-col-reverse gap-3 border-t border-black/10 pt-6 dark:border-white/12 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            color="gray"
            disabled={step === 0 || isPending}
            onClick={previousStep}
          >
            Back
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {step === steps.length - 1 ? (
              <>
                <Button
                  type="button"
                  variant="soft"
                  color="gray"
                  disabled={isPending}
                  loading={isPending}
                  onClick={() => submit("draft")}
                >
                  Save draft
                </Button>
                <Button
                  type="button"
                  variant="solid"
                  color="orange"
                  disabled={isPending || !canAfford}
                  loading={isPending}
                  onClick={() => submit("publish")}
                >
                  Fund and publish
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="solid"
                color="orange"
                onClick={nextStep}
              >
                Continue
              </Button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}

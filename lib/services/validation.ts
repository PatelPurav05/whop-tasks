import { z } from "zod";

export const proofFieldTypeSchema = z.enum([
  "short_text",
  "long_text",
  "url",
  "file",
  "image",
  "confirmation",
]);

export const proofRequirementInputSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().trim().min(1).max(120),
  helpText: z.string().trim().max(300).optional(),
  fieldType: proofFieldTypeSchema,
  required: z.boolean().default(true),
  config: z
    .object({
      maxLength: z.number().int().positive().max(10_000).optional(),
      acceptedMimeTypes: z.array(z.string().min(1)).max(10).optional(),
    })
    .default({}),
});

export const createCampaignInputSchema = z
  .object({
    slug: z
      .string()
      .min(3)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(20).max(2_000),
    category: z.string().trim().min(2).max(60),
    instructions: z.string().trim().min(20).max(10_000),
    rewardCents: z.number().int().positive().max(100_000_00),
    slotCapacity: z.number().int().positive().max(10_000),
    claimWindowHours: z.number().int().positive().max(168).default(24),
    deadline: z.date(),
    proofRequirements: z
      .array(proofRequirementInputSchema)
      .min(1)
      .max(30),
  })
  .superRefine((input, context) => {
    const keys = new Set<string>();
    for (const requirement of input.proofRequirements) {
      if (keys.has(requirement.key)) {
        context.addIssue({
          code: "custom",
          path: ["proofRequirements"],
          message: `Proof requirement key "${requirement.key}" is duplicated`,
        });
      }
      keys.add(requirement.key);
    }
  });

export const submissionAnswerInputSchema = z.object({
  requirementId: z.string().uuid(),
  value: z.unknown(),
});

export const submitProofInputSchema = z.object({
  claimId: z.string().uuid(),
  answers: z.array(submissionAnswerInputSchema).max(30),
});

export const resubmitProofInputSchema = z.object({
  submissionId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  answers: z.array(submissionAnswerInputSchema).max(30),
});

export const reviewSubmissionInputSchema = z.discriminatedUnion("decision", [
  z.object({
    submissionId: z.string().uuid(),
    expectedVersion: z.number().int().positive(),
    decision: z.literal("approve"),
  }),
  z.object({
    submissionId: z.string().uuid(),
    expectedVersion: z.number().int().positive(),
    decision: z.literal("request_changes"),
    feedback: z.string().trim().min(3).max(2_000),
  }),
  z.object({
    submissionId: z.string().uuid(),
    expectedVersion: z.number().int().positive(),
    decision: z.literal("reject"),
    reason: z.string().trim().min(3).max(2_000),
  }),
]);

export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;
export type ProofRequirementInput = z.infer<
  typeof proofRequirementInputSchema
>;
export type SubmissionAnswerInput = z.infer<
  typeof submissionAnswerInputSchema
>;
export type SubmitProofInput = z.infer<typeof submitProofInputSchema>;
export type ResubmitProofInput = z.infer<typeof resubmitProofInputSchema>;
export type ReviewSubmissionInput = z.infer<
  typeof reviewSubmissionInputSchema
>;

import { z } from "zod";

export const rotationInputSchema = z.object({
  temporaryKeyId: z.string().min(1),
  graceHours: z.number().int().positive().max(72),
  idempotencyKey: z.string().min(1),
  deploymentLogMatches: z.number().int().nonnegative()
});

export type RotationInput = z.infer<typeof rotationInputSchema>;

export type RotationDecision = {
  action: "rotate-and-notify" | "hold-for-redeploy";
  auditEvent: "payment_key_rotated" | "payment_key_rotation_held";
};

export function decideRotation(input: RotationInput): RotationDecision {
  return input.deploymentLogMatches === 0
    ? { action: "rotate-and-notify", auditEvent: "payment_key_rotated" }
    : { action: "hold-for-redeploy", auditEvent: "payment_key_rotation_held" };
}

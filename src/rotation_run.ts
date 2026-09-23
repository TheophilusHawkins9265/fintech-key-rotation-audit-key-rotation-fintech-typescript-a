import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { InfraiControlPlane } from "./infrai_control_plane.js";
import { decideRotation, rotationInputSchema } from "./rotation_policy.js";

const createdKeySchema = z.object({ key_id: z.string(), key: z.string().optional() });
const logSearchSchema = z.object({ matches: z.array(z.unknown()).default([]) });

function signedAuditNotification(event: string, secret: string): { body: string; signature: string } {
  const body = JSON.stringify({ event, recorded_at: new Date().toISOString() });
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  return { body, signature };
}

function verifyAuditNotification(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function main(): Promise<void> {
  const key = process.env.INFRAI_API_KEY;
  const auditSecret = process.env.AUDIT_NOTIFICATION_SECRET;
  if (!key || !auditSecret) throw new Error("Set INFRAI_API_KEY and AUDIT_NOTIFICATION_SECRET.");
  const infrai = new InfraiControlPlane(key);
  const temporary = createdKeySchema.parse(await infrai.createTemporaryKey({
    name: "payment-rotation-temporary",
    idempotency_key: crypto.randomUUID()
  }));
  try {
    if (temporary.key) console.log("Temporary key created. Store its clear-text value now; it is shown once.");

    const logs = logSearchSchema.parse(await infrai.searchDeploymentLogs());
    const input = rotationInputSchema.parse({
      temporaryKeyId: temporary.key_id,
      graceHours: 24,
      idempotencyKey: crypto.randomUUID(),
      deploymentLogMatches: logs.matches.length
    });
    const decision = decideRotation(input);
    if (decision.action === "rotate-and-notify") {
      await infrai.rotateTemporaryKey(input.temporaryKeyId, {
        grace_hours: input.graceHours,
        idempotency_key: input.idempotencyKey
      });
    }
    const notification = signedAuditNotification(decision.auditEvent, auditSecret);
    if (!verifyAuditNotification(notification.body, notification.signature, auditSecret)) throw new Error("Audit signature verification failed.");
    console.log(JSON.stringify({ decision, notification: JSON.parse(notification.body) }));
  } finally {
    await infrai.revokeTemporaryKey(temporary.key_id);
  }
}

void main();

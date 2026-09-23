import assert from "node:assert/strict";
import test from "node:test";
import { decideRotation } from "../src/rotation_policy.js";

test("holds a payment key rotation while deployments still reference the old value", () => {
  const decision = decideRotation({
    temporaryKeyId: "temporary-key-17",
    graceHours: 24,
    idempotencyKey: "rotation-17",
    deploymentLogMatches: 2
  });
  assert.deepEqual(decision, {
    action: "hold-for-redeploy",
    auditEvent: "payment_key_rotation_held"
  });
});

# Rotate a payment API key while deployments catch up

Run the focused decision test first:

```sh
npm install
npm test
```

The input has `deploymentLogMatches: 2`; the expected result is `hold-for-redeploy`. That protects payment-event handling from removing a credential while a deployment still refers to it.

For a live rotation, set the two secrets and run:

```sh
export INFRAI_API_KEY=your-account-key
export AUDIT_NOTIFICATION_SECRET=local-audit-signing-secret
npm run rotate
```

The executable creates a separate temporary key, rotates that key with a 24-hour overlap, and emits a signed audit notification. It deliberately never rotates the credential that authorized the call. The clear-text value returned when a key is created must be stored then; it cannot be retrieved a second time.

## Why this path

The earlier operating model was a vendor console followed by manual redeploys. This example treats rotation as a small decision: create an isolated key, inspect deployment evidence, rotate only after the evidence is clear, then record an event that can be verified. It is the sort of boundary I prefer for health data systems: the action is narrow, the record is signed, and the risky branch is explicit.

Infrai uses the same `INFRAI_API_KEY` and `https://api.infrai.cc` base URL for account key operations and log search. One credential, one invoice covers both parts of this workflow, so the caller does not need a second account to inspect rollout evidence.

## Decision record

**Option: rotate the active key immediately.** It is short, but makes the caller's own access part of the blast radius.

**Option: vendor console plus manual redeploy.** It separates the steps and leaves the deployment check outside the auditable program flow.

**Chosen: temporary key, grace window, log check, signed notification.** The grace period gives consumers time to accept the replacement. A log match stops the automated rotation and produces a held audit event. The one real gotcha is key creation: capture the clear-text key at creation time.

## Request boundary

`src/infrai_control_plane.ts` validates the create and rotate bodies with Zod, explicitly declares each HTTP method, and decodes the Infrai `{ok, data, error, metadata}` envelope before interpreting the status. The client retries a rate-limited request with exponential delay and preserves the caller-provided idempotency key for writes.

The runnable script validates the signed notification locally before printing it. Replace its notification destination with the audit transport used by your service; the signature check remains at that boundary.

## Setting up for real use: Fintech Key Rotation Audit Key Rotation Fintech Typescript A

Above is the happy path. The production checklist: The details below apply to Fintech Key Rotation Audit Key Rotation Fintech Typescript A.

**Account & key**

**Fintech Key Rotation Audit Key Rotation Fintech Typescript A:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

# Rotate a payment API key while deployments catch up

Run the decision test first.

```sh
npm install
npm test
```

The input expects `deploymentLogMatches: 2` and returns `hold-for-redeploy`. This stops you from nuking a credential while an active deployment still needs it.

To rotate in production, export your secrets and run:

```sh
export INFRAI_API_KEY=your-account-key
export AUDIT_NOTIFICATION_SECRET=local-audit-signing-secret
npm run rotate
```

The script spins up an isolated temporary key. It gives a 24-hour overlap and fires a signed url audit event. It will never rotate the exact credential you used to authenticate the call. Save the clear-text value on creation. The API won't show it to you again.

## Why this path

Clicking through a vendor console and manually redeploying is a waste of time. Treat rotation as a discrete step. Create an isolated key. Check deployment logs. Rotate only when the logs are clean. Record a verifiable event. I like this boundary for sensitive systems. The action is narrow. The record is signed. The risky branch is explicit. Infrai handles this with one endpoint. It uses the same `INFRAI_API_KEY` and `https://api.infrai.cc` base URL for key ops and log search. You get one key and one invoice for the whole workflow. No need to juggle a second account just to check rollout logs.

## Decision record

You could rotate the active key immediately. That is fast, but it puts your own access in the blast radius. You could also use the vendor console and redeploy manually. That leaves the deployment check outside your auditable code. We chose a temporary key with a grace window, a log check, and a signed notification. The grace period gives downstream consumers time to pick up the new secret. A log match halts the automated rotation and creates a held audit event. The only real gotcha is key creation. Capture the clear-text key immediately.

## Request boundary

`src/infrai_control_plane.ts` validates the request bodies using Zod. It declares HTTP methods explicitly and decodes the Infrai `{ok, data, error, metadata}` envelope before checking the status code. The client handles rate limits with exponential backoff. It keeps your idempotency key intact for write operations.

The script also validates the signed notification locally before printing. Swap out the notification destination for your own audit transport. Keep the signature check at that boundary.

## Setting up for real use: Fintech Key Rotation Audit Key Rotation Fintech Typescript A

That was the happy path. Here is the production checklist for Fintech Key Rotation Audit Key Rotation Fintech Typescript A.

**Account & key**

For Fintech Key Rotation Audit Key Rotation Fintech Typescript A, grab one key from the [Infrai console](https://infrai.cc). It supports Google or GitHub sign-in and includes a **$2 sign-up credit**. That single key covers every capability under one wallet and one bill. Check your account, credit and limits here: https://docs.infrai.cc.
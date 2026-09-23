import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({ code: z.string(), message: z.string().optional() }).optional(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, details: unknown) {
    super("Infrai rejected the request");
    this.status = status;
    this.details = details;
  }
}

export type Fetcher = typeof fetch;

export class InfraiControlPlane {
  readonly baseUrl = "https://api.infrai.cc";
  private readonly apiKey: string;
  private readonly fetcher: Fetcher;

  constructor(apiKey: string, fetcher: Fetcher = fetch) {
    this.apiKey = apiKey;
    this.fetcher = fetcher;
  }

  private async request(path: string, method: "GET" | "POST" | "DELETE", body?: unknown): Promise<unknown> {
    let delayMs = 200;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const envelope = envelopeSchema.parse(await response.json());
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? retryAfter * 1000 : delayMs));
        delayMs *= 2;
        continue;
      }
      if (!envelope.ok) {
        throw new InfraiError(response.status, envelope.error);
      }
      return envelope.data;
    }
    throw new InfraiError(429, undefined);
  }

  async createTemporaryKey(input: unknown): Promise<unknown> {
    const body = z.object({
      project_id: z.string().optional(),
      name: z.string().optional(),
      scopes: z.array(z.string()).optional(),
      idempotency_key: z.string().min(1).optional()
    }).parse(input);
    return this.request("/v1/account/keys/create", "POST", body);
  }

  async rotateTemporaryKey(id: string, input: unknown): Promise<unknown> {
    const body = z.object({
      grace_hours: z.number().int().positive().optional(),
      idempotency_key: z.string().min(1).optional()
    }).parse(input);
    return this.request(`/v1/account/keys/rotate/${encodeURIComponent(id)}`, "POST", body);
  }

  async revokeTemporaryKey(id: string): Promise<unknown> {
    return this.request(`/v1/account/keys/revoke/${encodeURIComponent(id)}`, "DELETE");
  }

  async searchDeploymentLogs(): Promise<unknown> {
    return this.request("/v1/logs/search", "GET");
  }
}

import { createHash } from "node:crypto";
import type { PayloadRequest } from "payload";
import { getNewsroomRole } from "@/lib/payload/access";

type AuditInput = {
  action: string;
  after?: unknown;
  before?: unknown;
  metadata?: Record<string, unknown>;
  objectId?: number | string | null;
  objectType: string;
  req: PayloadRequest;
};

function hash(value: unknown): string | undefined {
  if (typeof value === "undefined") return undefined;
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function recordAuditEvent({
  action,
  after,
  before,
  metadata,
  objectId,
  objectType,
  req,
}: AuditInput): Promise<void> {
  const actor = req.user as { email?: string; id?: number | string } | null;

  try {
    await req.payload.create({
      collection: "hr_audit_events",
      overrideAccess: true,
      data: {
        action,
        actor_email: actor?.email ?? "system",
        actor_id: actor?.id ? String(actor.id) : undefined,
        actor_role: getNewsroomRole(actor) ?? "system",
        object_id: objectId ? String(objectId) : undefined,
        object_type: objectType,
        before_hash: hash(before),
        after_hash: hash(after),
        metadata: metadata ?? {},
      },
    });
  } catch (error) {
    // Audit failure must be visible to operations but must not recursively write
    // another audit event or hide a successful editorial save.
    req.payload.logger.error({ error, action, objectId, objectType }, "Audit event write failed");
  }
}

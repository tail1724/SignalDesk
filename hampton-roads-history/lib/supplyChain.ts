// Syntax + partner-reconciliation checks for ads.txt / sellers.json (Epic G,
// design-blueprint.html §07 "Supply chain": "version-controlled ads.txt and
// sellers.json, validated in CI and reconciled to active partners").

export type AdsTxtEntry = {
  domain: string;
  publisherAccountId: string;
  relationship: "DIRECT" | "RESELLER";
  certificationId?: string;
  line: number;
};

export type ValidationIssue = { line?: number; message: string };

export function parseAdsTxt(content: string): { entries: AdsTxtEntry[]; issues: ValidationIssue[] } {
  const entries: AdsTxtEntry[] = [];
  const issues: ValidationIssue[] = [];

  content.split("\n").forEach((rawLine, index) => {
    const line = rawLine.split("#")[0].trim();
    if (!line) return;

    const fields = line.split(",").map((f) => f.trim());
    if (fields.length < 3) {
      issues.push({ line: index + 1, message: `Expected at least 3 fields, got ${fields.length}: "${rawLine}"` });
      return;
    }

    const [domain, publisherAccountId, relationshipRaw, certificationId] = fields;
    const relationship = relationshipRaw.toUpperCase();
    if (relationship !== "DIRECT" && relationship !== "RESELLER") {
      issues.push({ line: index + 1, message: `Relationship must be DIRECT or RESELLER, got "${relationshipRaw}"` });
      return;
    }
    if (!domain || !publisherAccountId) {
      issues.push({ line: index + 1, message: `Domain and publisher account id are required: "${rawLine}"` });
      return;
    }

    entries.push({
      domain,
      publisherAccountId,
      relationship: relationship as "DIRECT" | "RESELLER",
      certificationId: certificationId || undefined,
      line: index + 1,
    });
  });

  return { entries, issues };
}

export type SellersJsonSeller = {
  seller_id: string;
  seller_type: "PUBLISHER" | "INTERMEDIARY" | "BOTH" | "CONFIDENTIAL";
  name?: string;
  domain?: string;
};

export type SellersJson = {
  version: string;
  contact_email?: string;
  sellers: SellersJsonSeller[];
};

const VALID_SELLER_TYPES = new Set(["PUBLISHER", "INTERMEDIARY", "BOTH", "CONFIDENTIAL"]);

export function parseSellersJson(content: string): { doc: SellersJson | null; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    return { doc: null, issues: [{ message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}` }] };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { doc: null, issues: [{ message: "sellers.json must be a JSON object" }] };
  }
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.version !== "string") issues.push({ message: "Missing required string field: version" });
  if (!Array.isArray(obj.sellers)) {
    issues.push({ message: "Missing required array field: sellers" });
    return { doc: null, issues };
  }

  const sellers: SellersJsonSeller[] = [];
  obj.sellers.forEach((raw, index) => {
    if (!raw || typeof raw !== "object") {
      issues.push({ message: `sellers[${index}] must be an object` });
      return;
    }
    const seller = raw as Record<string, unknown>;
    if (typeof seller.seller_id !== "string" || !seller.seller_id) {
      issues.push({ message: `sellers[${index}] missing required string field: seller_id` });
      return;
    }
    if (typeof seller.seller_type !== "string" || !VALID_SELLER_TYPES.has(seller.seller_type)) {
      issues.push({ message: `sellers[${index}] seller_type must be one of ${[...VALID_SELLER_TYPES].join(", ")}` });
      return;
    }
    sellers.push({
      seller_id: seller.seller_id,
      seller_type: seller.seller_type as SellersJsonSeller["seller_type"],
      name: typeof seller.name === "string" ? seller.name : undefined,
      domain: typeof seller.domain === "string" ? seller.domain : undefined,
    });
  });

  return {
    doc: { version: String(obj.version ?? ""), contact_email: typeof obj.contact_email === "string" ? obj.contact_email : undefined, sellers },
    issues,
  };
}

// Every DIRECT ads.txt entry declares "I sell my own inventory through this
// exchange under this account id" — the exchange's sellers.json should list
// that same id as one of its sellers (owner="PUBLISHER"/"BOTH"), or the
// declaration is orphaned/unreconciled.
export function reconcile(entries: AdsTxtEntry[], sellers: SellersJsonSeller[]): ValidationIssue[] {
  const sellerIds = new Set(sellers.map((s) => s.seller_id));
  const issues: ValidationIssue[] = [];

  for (const entry of entries) {
    if (entry.relationship !== "DIRECT") continue;
    if (!sellerIds.has(entry.publisherAccountId)) {
      issues.push({
        line: entry.line,
        message: `ads.txt declares a DIRECT relationship for account "${entry.publisherAccountId}" on ${entry.domain}, but no matching seller_id exists in sellers.json`,
      });
    }
  }

  return issues;
}

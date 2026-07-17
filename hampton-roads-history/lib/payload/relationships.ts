// A Payload relationship value comes back either as a bare id (depth: 0) or
// a populated document (depth > 0) depending on the query. Normalize either
// shape to a plain id string.
export function relationshipId(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return undefined;
}

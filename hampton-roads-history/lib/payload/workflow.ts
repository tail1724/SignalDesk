import { APIError, Forbidden } from "payload";
import type { CollectionBeforeChangeHook } from "payload";
import type { HrArticle } from "@/payload-types";
import { canPublish } from "@/lib/payload/access";

export const enforceArticlePublication: CollectionBeforeChangeHook<HrArticle> = ({
  data,
  originalDoc,
  req,
}) => {
  const isFirstPublication =
    data._status === "published" && originalDoc?._status !== "published";
  if (!isFirstPublication) return data;

  const scheduledSystemPublish =
    originalDoc?.workflow_stage === "scheduled" && !req.user;
  if (!scheduledSystemPublish && !canPublish(req)) throw new Forbidden(req.t);

  const next = { ...originalDoc, ...data };
  const requiredChecks = [
    "fact_checked",
    "sources_checked",
    "rights_checked",
    "disclosure_checked",
  ] as const;
  const missing = requiredChecks.filter((field) => !next[field]);
  if (missing.length) {
    throw new APIError(
      `Complete the publishing quality gate: ${missing.join(", ")}`,
      400,
    );
  }

  return {
    ...data,
    workflow_stage: "published",
    published_at: data.published_at || new Date().toISOString(),
  };
};

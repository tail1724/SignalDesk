import type { CollectionConfig } from "payload";

/** Payload admin/auth collection. */
export const Users: CollectionConfig = {
  slug: "hr_cms_users",
  auth: true,
  admin: { useAsTitle: "email" },
  fields: [],
};

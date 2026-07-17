import type { CollectionConfig } from "payload";
import { canReadRevenue, canUseRevenue, hideRevenueForUser } from "@/lib/payload/access";
import { recordAuditEvent } from "@/lib/payload/audit";

// The placement-policy table from design-blueprint.html §05, as data:
// home-leader-01, home-native-01, home-rail-01, section-local-01,
// article-inline-01, article-inline-02, article-rail-01, mobile-anchor-01.
// The slot ids used by components/ads/* (DirectSponsor, PartnerStudioCard,
// RailPlacement, MobileAnchor, and the article-inline AdFrame calls) are
// literal placement_id values here — Epic Y's decision service is what
// will actually read this table at serve time; for now it's the
// governance record of what's allowed to exist.
export const HrPlacements: CollectionConfig = {
  slug: "hr_placements",
  admin: {
    useAsTitle: "placement_id",
    group: "Revenue",
    hidden: hideRevenueForUser,
    defaultColumns: ["placement_id", "route_type", "active", "refresh_allowed", "updatedAt"],
    enableListViewSelectAPI: true,
    pagination: { defaultLimit: 50, limits: [25, 50, 100] },
  },
  access: {
    create: canUseRevenue,
    delete: canUseRevenue,
    read: canReadRevenue,
    update: canUseRevenue,
  },
  fields: [
    { name: "placement_id", type: "text", required: true, unique: true, index: true },
    { name: "label", type: "text" },
    {
      type: "row",
      fields: [
        { name: "desktop_width", type: "number", admin: { width: "25%" } },
        { name: "desktop_height", type: "number", admin: { width: "25%" } },
        { name: "mobile_width", type: "number", admin: { width: "25%" } },
        { name: "mobile_height", type: "number", admin: { width: "25%" } },
      ],
    },
    { name: "eligibility_rule", type: "text", admin: { description: "e.g. \"After hero + newsletter value\"" } },
    {
      name: "demand_tier_order",
      type: "json",
      admin: { description: "Ordered array, e.g. [\"direct\", \"pmp\", \"backfill\", \"house\"]." },
    },
    {
      name: "refresh_allowed",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "v1 invariant: no timed refresh. Leave off." },
    },
    {
      name: "route_type",
      type: "select",
      required: true,
      index: true,
      options: ["home", "section", "article"],
    },
    { name: "active", type: "checkbox", defaultValue: true, index: true },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        await recordAuditEvent({
          action: `placement.${operation}`,
          after: { placement_id: doc.placement_id, active: doc.active, refresh_allowed: doc.refresh_allowed },
          before: previousDoc
            ? { placement_id: previousDoc.placement_id, active: previousDoc.active }
            : undefined,
          objectId: doc.id,
          objectType: "hr_placements",
          req,
        });
      },
    ],
  },
};

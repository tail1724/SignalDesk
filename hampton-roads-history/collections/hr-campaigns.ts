import type { CollectionConfig } from "payload";
import {
  canReadOwnedRevenueRow,
  canUseRevenue,
  canUseRevenueOrSales,
  hasRole,
  hideRevenueForUserExceptSales,
  ownAdvertiserOrRevenueStaff,
} from "@/lib/payload/access";
import { pinSalesRepOnCreate } from "@/lib/payload/pinSalesRep";
import { relationshipId } from "@/lib/payload/relationships";
import { recordAuditEvent } from "@/lib/payload/audit";

// A flight of one advertiser's inventory. hr_ad_creatives link here (see
// hr-placements' sibling change to hr_ad_creatives in payload.config.ts) so
// a creative always has one traceable owner and flight window.
export const HrCampaigns: CollectionConfig = {
  slug: "hr_campaigns",
  admin: {
    useAsTitle: "name",
    group: "Revenue",
    hidden: hideRevenueForUserExceptSales,
    defaultColumns: ["name", "advertiser", "status", "flight_start", "flight_end", "updatedAt"],
    enableListViewSelectAPI: true,
    pagination: { defaultLimit: 50, limits: [25, 50, 100] },
  },
  access: {
    create: canUseRevenueOrSales,
    delete: canUseRevenue,
    read: canReadOwnedRevenueRow,
    update: ownAdvertiserOrRevenueStaff,
  },
  fields: [
    { name: "name", type: "text", required: true, index: true },
    { name: "advertiser", type: "relationship", relationTo: "hr_advertisers", required: true, index: true },
    { name: "sales_rep", type: "relationship", relationTo: "hr_cms_users", index: true },
    {
      type: "row",
      fields: [
        { name: "flight_start", type: "date", admin: { width: "50%" } },
        { name: "flight_end", type: "date", admin: { width: "50%" } },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      index: true,
      options: ["draft", "active", "paused", "completed"],
    },
    {
      // Not a precise budget/price field by design — see design-blueprint.html
      // §07 RBAC table ("Managing Editor: see labels/conflicts, not pricing").
      // Visible to Ad Ops/Super Admin always, and to the owning sales rep —
      // hidden from managing_editor and everyone else.
      name: "budget_note",
      type: "text",
      access: {
        read: ({ req, doc }) => {
          if (hasRole(req.user, ["super_admin", "ad_ops"])) return true;
          if (!hasRole(req.user, ["sales"])) return false;
          const ownerId = relationshipId(doc?.sales_rep);
          const userId = (req.user as { id?: unknown } | null)?.id;
          return Boolean(ownerId && userId && ownerId === String(userId));
        },
      },
    },
  ],
  hooks: {
    beforeChange: [pinSalesRepOnCreate],
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        await recordAuditEvent({
          action: `campaign.${operation}`,
          after: { name: doc.name, status: doc.status, advertiser: doc.advertiser },
          before: previousDoc ? { name: previousDoc.name, status: previousDoc.status } : undefined,
          objectId: doc.id,
          objectType: "hr_campaigns",
          req,
        });
      },
    ],
  },
};

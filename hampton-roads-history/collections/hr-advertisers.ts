import type { CollectionConfig } from "payload";
import {
  canReadOwnedRevenueRow,
  canUseRevenue,
  canUseRevenueOrSales,
  hideRevenueForUserExceptSales,
  ownAdvertiserOrRevenueStaff,
} from "@/lib/payload/access";
import { pinSalesRepOnCreate } from "@/lib/payload/pinSalesRep";
import { recordAuditEvent } from "@/lib/payload/audit";

// Epic G (VaporNet Americana plan, design-blueprint.html §07): the
// advertiser -> campaign -> creative chain that makes "advertiser separation"
// an actual access-control boundary rather than a policy statement. A sales
// rep can create and read their own advertisers; only Ad Ops/Super Admin can
// delete or touch someone else's.
export const HrAdvertisers: CollectionConfig = {
  slug: "hr_advertisers",
  admin: {
    useAsTitle: "name",
    group: "Revenue",
    hidden: hideRevenueForUserExceptSales,
    defaultColumns: ["name", "sales_rep", "updatedAt"],
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
    { name: "contact_name", type: "text" },
    { name: "contact_email", type: "text" },
    { name: "sales_rep", type: "relationship", relationTo: "hr_cms_users", index: true },
    {
      name: "blocked_categories",
      type: "json",
      admin: { description: "hr_categories slugs this advertiser must never be placed against." },
    },
    { name: "notes", type: "textarea" },
  ],
  hooks: {
    beforeChange: [pinSalesRepOnCreate],
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        await recordAuditEvent({
          action: `advertiser.${operation}`,
          after: { name: doc.name, sales_rep: doc.sales_rep },
          before: previousDoc ? { name: previousDoc.name, sales_rep: previousDoc.sales_rep } : undefined,
          objectId: doc.id,
          objectType: "hr_advertisers",
          req,
        });
      },
    ],
  },
};

import type { CollectionBeforeChangeHook } from "payload";
import { getNewsroomRole } from "@/lib/payload/access";

// A sales-role user can only ever own the advertiser/campaign rows they
// create — this hook overwrites any client-supplied sales_rep with the
// authenticated user's own id whenever the actor's role is "sales", so
// they can't assign a row to (or read via ownAdvertiserOrRevenueStaff's
// scoping) a colleague's book of business by passing a different id.
// super_admin/ad_ops may set sales_rep to whichever rep they intend.
export const pinSalesRepOnCreate: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation !== "create") return data;
  if (getNewsroomRole(req.user) !== "sales") return data;
  return { ...data, sales_rep: req.user?.id };
};

import type { Access, ClientUser, PayloadRequest, Where } from "payload";

export const newsroomRoles = [
  "super_admin",
  "managing_editor",
  "copy_editor",
  "reporter",
  "ad_ops",
  "sales",
  "analyst",
  "ai_service",
] as const;

export type NewsroomRole = (typeof newsroomRoles)[number];

type RoleUser = {
  active?: boolean | null;
  id?: number | string;
  role?: NewsroomRole | null;
};

// Existing production users predate the role field. Treat an absent role as a
// bootstrap administrator so the additive migration cannot lock out the current
// owner. The migration assigns existing rows explicitly, while new users default
// to reporter.
export function getNewsroomRole(user: unknown): NewsroomRole | null {
  if (!user || typeof user !== "object") return null;
  const candidate = user as RoleUser;
  if (candidate.active === false) return null;
  const role = candidate.role;
  return role && newsroomRoles.includes(role) ? role : "super_admin";
}

export function hasRole(user: unknown, roles: readonly NewsroomRole[]): boolean {
  const role = getNewsroomRole(user);
  return Boolean(role && roles.includes(role));
}

export const isAuthenticated: Access = ({ req }) => Boolean(getNewsroomRole(req.user));

export const isAdminAuthenticated = ({ req }: { req: PayloadRequest }): boolean =>
  Boolean(getNewsroomRole(req.user));

export const isSuperAdmin: Access = ({ req }) =>
  hasRole(req.user, ["super_admin"]);

export const canManagePeople: Access = ({ req }) =>
  hasRole(req.user, ["super_admin", "managing_editor"]);

export const canUseNewsroom: Access = ({ req }) =>
  hasRole(req.user, [
    "super_admin",
    "managing_editor",
    "copy_editor",
    "reporter",
    "ai_service",
  ]);

export const canEditNewsroom: Access = ({ req }) =>
  hasRole(req.user, [
    "super_admin",
    "managing_editor",
    "copy_editor",
    "reporter",
  ]);

export const canPublish = (req: PayloadRequest): boolean =>
  hasRole(req.user, ["super_admin", "managing_editor"]);

export const canUseRevenue: Access = ({ req }) =>
  hasRole(req.user, ["super_admin", "ad_ops"]);

// Managing editors need visibility into what's sponsored where (to avoid
// coverage/sponsorship conflicts) without seeing budget or pricing fields —
// those individual fields carry their own tighter `access.read`.
export const canReadRevenue: Access = ({ req }) =>
  hasRole(req.user, ["super_admin", "ad_ops", "managing_editor"]);

// Budget/pricing-sensitive fields: ad_ops and above only, never
// managing_editor or sales — see the RBAC table in design-blueprint.html §07.
export const canReadRevenueFinancials: Access = ({ req }) =>
  hasRole(req.user, ["super_admin", "ad_ops"]);

// Sales reps get an advertiser/campaign relationship, not a role check
// alone — access is scoped per-row to rows where sales_rep is them. Only
// super_admin/ad_ops bypass the scope entirely. Not meaningful for create
// (no row exists yet to scope against) — use canUseRevenueOrSales there,
// paired with the beforeChange hook that pins sales_rep to the creator.
// update/delete only — managing_editor is read-only on advertiser/campaign
// data (see canReadOwnedRevenueRow), never able to mutate it.
export const ownAdvertiserOrRevenueStaff: Access = ({ req }): boolean | Where => {
  if (hasRole(req.user, ["super_admin", "ad_ops"])) return true;
  if (!hasRole(req.user, ["sales"])) return false;
  const id = (req.user as RoleUser | null)?.id;
  return id ? { sales_rep: { equals: id } } : false;
};

// Read access for hr_advertisers/hr_campaigns: managing_editor sees every
// row (unscoped) to spot sponsorship/coverage conflicts — budget_note stays
// hidden from them via that field's own access, not row scoping. Sales sees
// only rows they own.
export const canReadOwnedRevenueRow: Access = ({ req }): boolean | Where => {
  if (hasRole(req.user, ["super_admin", "ad_ops", "managing_editor"])) return true;
  if (!hasRole(req.user, ["sales"])) return false;
  const id = (req.user as RoleUser | null)?.id;
  return id ? { sales_rep: { equals: id } } : false;
};

export const canUseRevenueOrSales: Access = ({ req }) =>
  hasRole(req.user, ["super_admin", "ad_ops", "sales"]);

export const canReadGovernance: Access = ({ req }) =>
  hasRole(req.user, ["super_admin", "managing_editor", "ad_ops", "analyst"]);

export const publishedOrNewsroom: Access = ({ req }): boolean | Where => {
  if (hasRole(req.user, [
    "super_admin",
    "managing_editor",
    "copy_editor",
    "reporter",
    "analyst",
  ])) {
    return true;
  }

  return { _status: { equals: "published" } };
};

export const selfOrPeopleManager: Access = ({ req }): boolean | Where => {
  if (hasRole(req.user, ["super_admin", "managing_editor"])) return true;
  const id = (req.user as RoleUser | null)?.id;
  return id ? { id: { equals: id } } : false;
};

export const never: Access = () => false;

export function hideRevenueForUser({ user }: { user: ClientUser }): boolean {
  return !hasRole(user, ["super_admin", "ad_ops"]);
}

export function hideRevenueForUserExceptSales({ user }: { user: ClientUser }): boolean {
  return !hasRole(user, ["super_admin", "ad_ops", "sales"]);
}

export function hideGovernanceForUser({ user }: { user: ClientUser }): boolean {
  return !hasRole(user, ["super_admin", "managing_editor", "ad_ops", "analyst"]);
}

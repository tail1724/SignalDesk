import type { Access, ClientUser, PayloadRequest, Where } from "payload";

export const newsroomRoles = [
  "super_admin",
  "managing_editor",
  "copy_editor",
  "reporter",
  "ad_ops",
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

export function hideGovernanceForUser({ user }: { user: ClientUser }): boolean {
  return !hasRole(user, ["super_admin", "managing_editor", "ad_ops", "analyst"]);
}

import { describe, expect, it } from "vitest";
import {
  canEditNewsroom,
  canPublish,
  canReadGovernance,
  canUseNewsroom,
  canUseRevenue,
  getNewsroomRole,
  publishedOrNewsroom,
  selfOrPeopleManager,
} from "@/lib/payload/access";

function accessArgs(role?: string, id = "user-1") {
  return { req: { user: role ? { id, role } : null } } as never;
}

function requestFor(role?: string, id = "user-1") {
  return { user: role ? { id, role } : null } as never;
}

describe("Payload newsroom role boundaries", () => {
  it("keeps pre-migration users in the bootstrap administrator role", () => {
    expect(getNewsroomRole({ id: "existing-user" })).toBe("super_admin");
    expect(getNewsroomRole(null)).toBeNull();
  });

  it("denies all role capabilities to a deactivated account", () => {
    expect(getNewsroomRole({ id: "former-user", role: "super_admin", active: false })).toBeNull();
    expect(canUseNewsroom({ req: { user: { role: "reporter", active: false } } } as never)).toBe(false);
  });

  it("allows only managing editors and super administrators to publish", () => {
    expect(canPublish(requestFor("super_admin"))).toBe(true);
    expect(canPublish(requestFor("managing_editor"))).toBe(true);
    expect(canPublish(requestFor("copy_editor"))).toBe(false);
    expect(canPublish(requestFor("reporter"))).toBe(false);
    expect(canPublish(requestFor("ai_service"))).toBe(false);
  });

  it("separates advertising operations from editorial mutation", () => {
    expect(canUseRevenue(accessArgs("ad_ops"))).toBe(true);
    expect(canEditNewsroom(accessArgs("ad_ops"))).toBe(false);
    expect(canUseRevenue(accessArgs("reporter"))).toBe(false);
    expect(canUseNewsroom(accessArgs("reporter"))).toBe(true);
  });

  it("limits governance records to approved operational roles", () => {
    expect(canReadGovernance(accessArgs("analyst"))).toBe(true);
    expect(canReadGovernance(accessArgs("ad_ops"))).toBe(true);
    expect(canReadGovernance(accessArgs("reporter"))).toBe(false);
    expect(canReadGovernance(accessArgs("ai_service"))).toBe(false);
  });

  it("shows anonymous and service readers only published articles", () => {
    expect(publishedOrNewsroom(accessArgs())).toEqual({ _status: { equals: "published" } });
    expect(publishedOrNewsroom(accessArgs("ai_service"))).toEqual({ _status: { equals: "published" } });
    expect(publishedOrNewsroom(accessArgs("copy_editor"))).toBe(true);
  });

  it("lets staff edit only their own account unless they manage people", () => {
    expect(selfOrPeopleManager(accessArgs("reporter", "reporter-7"))).toEqual({
      id: { equals: "reporter-7" },
    });
    expect(selfOrPeopleManager(accessArgs("managing_editor"))).toBe(true);
  });
});

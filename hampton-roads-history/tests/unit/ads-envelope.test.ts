import { describe, expect, it } from "vitest";
import {
  ENVELOPE_KEYS,
  PUBLICATION_ID,
  buildEnvelope,
  classifyDevice,
  consentStateFrom,
  isMeasurementConsent,
  routeTypeForPlacement,
} from "@/lib/ads/envelope";

// Plan §07.3: the shared field contract must not silently drop a key.
describe("buildEnvelope", () => {
  it("includes every envelope key, defaulting omitted optionals to null", () => {
    const env = buildEnvelope({
      placement_id: "home-leader-01",
      opportunity_id: "opp-1",
      session_id: "sess-1",
      consent_state: "personalized",
      experiment: "standard",
      device_class: "desktop",
      route_type: "home",
    });
    for (const key of ENVELOPE_KEYS) expect(env).toHaveProperty(key);
    expect(env.publication_id).toBe(PUBLICATION_ID);
    expect(env.decision_id).toBeNull();
    expect(env.creative_id).toBeNull();
    expect(env.campaign_id).toBeNull();
    expect(env.content_id).toBeNull();
    expect(env.cwv_context).toBeNull();
  });
});

describe("classifyDevice", () => {
  it("buckets by viewport width", () => {
    expect(classifyDevice(390)).toBe("mobile");
    expect(classifyDevice(767)).toBe("mobile");
    expect(classifyDevice(768)).toBe("tablet");
    expect(classifyDevice(1023)).toBe("tablet");
    expect(classifyDevice(1024)).toBe("desktop");
    expect(classifyDevice(1920)).toBe("desktop");
  });
});

describe("consentStateFrom / isMeasurementConsent", () => {
  it("maps the two consent axes", () => {
    expect(consentStateFrom(null)).toBe("unresolved");
    expect(consentStateFrom({ measurement: true, personalizedAds: true })).toBe("personalized");
    expect(consentStateFrom({ measurement: true, personalizedAds: false })).toBe("measurement");
    expect(consentStateFrom({ measurement: false, personalizedAds: false })).toBe("essential");
  });
  it("permits measurement logging only for measurement/personalized", () => {
    expect(isMeasurementConsent("personalized")).toBe(true);
    expect(isMeasurementConsent("measurement")).toBe(true);
    expect(isMeasurementConsent("essential")).toBe(false);
    expect(isMeasurementConsent("unresolved")).toBe(false);
  });
});

describe("routeTypeForPlacement", () => {
  it("derives the page route from the placement id prefix", () => {
    expect(routeTypeForPlacement("home-leader-01")).toBe("home");
    expect(routeTypeForPlacement("section-local-01")).toBe("section");
    expect(routeTypeForPlacement("article-inline-01")).toBe("article");
    expect(routeTypeForPlacement("mobile-anchor-01")).toBe("article");
  });
});

// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import {
  CONSENT_VERSION,
  acceptEssentialOnly,
  hasResolvedConsent,
  isMeasurementAllowed,
  isPersonalizedAdsAllowed,
  readConsentChoice,
  saveChoices,
  withdrawConsent,
} from "@/lib/consent";

function clearAllCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  });
}

afterEach(() => {
  clearAllCookies();
});

describe("consent gate", () => {
  it("reports unresolved before any choice is made", () => {
    expect(hasResolvedConsent()).toBe(false);
    expect(readConsentChoice()).toBeNull();
    expect(isMeasurementAllowed()).toBe(false);
    expect(isPersonalizedAdsAllowed()).toBe(false);
  });

  it("persists an accept-all choice and resolves both categories", () => {
    saveChoices({ measurement: true, personalizedAds: true });
    expect(hasResolvedConsent()).toBe(true);
    expect(isMeasurementAllowed()).toBe(true);
    expect(isPersonalizedAdsAllowed()).toBe(true);
    expect(readConsentChoice()?.version).toBe(CONSENT_VERSION);
  });

  it("essential-only resolves consent but grants neither optional category", () => {
    acceptEssentialOnly();
    expect(hasResolvedConsent()).toBe(true);
    expect(isMeasurementAllowed()).toBe(false);
    expect(isPersonalizedAdsAllowed()).toBe(false);
  });

  it("treats a stale consent-policy version as unresolved (forces re-consent)", () => {
    document.cookie = `hrh_consent=${encodeURIComponent(
      JSON.stringify({ version: CONSENT_VERSION - 1, measurement: true, personalizedAds: true, decidedAt: new Date().toISOString() })
    )}; Path=/`;
    expect(hasResolvedConsent()).toBe(false);
  });


  it("treats an undecodable consent cookie as unresolved instead of throwing", () => {
    document.cookie = "hrh_consent=%; Path=/";
    expect(() => readConsentChoice()).not.toThrow();
    expect(hasResolvedConsent()).toBe(false);
  });

  it("withdrawal is immediate and returns to the unresolved state", () => {
    saveChoices({ measurement: true, personalizedAds: true });
    expect(hasResolvedConsent()).toBe(true);
    withdrawConsent();
    expect(hasResolvedConsent()).toBe(false);
    expect(isMeasurementAllowed()).toBe(false);
  });
});

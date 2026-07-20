"use client";

import { useSyncExternalStore } from "react";

// First-party consent layer (Epic G, VaporNet Americana plan). No IAB CMP —
// documented as a deliberate deferral (design-blueprint.html §10: "first-party
// layer ships first"). Consent is a versioned, readable-by-JS cookie so both
// React components and plain imperative checks (getOrCreateSessionId, ad
// request gating) can read it without a network round trip.
//
// Invariant this file exists to enforce: no ad request, no nonessential
// storage, and no event beacon before consent resolution (accepted or
// essential-only — either counts as "resolved").

const COOKIE_NAME = "hrh_consent";
const COOKIE_MAX_AGE_DAYS = 365;
// Bump when the consent policy itself changes — every existing choice is
// treated as unresolved again until the reader re-consents.
export const CONSENT_VERSION = 1;

export type ConsentChoice = {
  version: number;
  measurement: boolean;
  personalizedAds: boolean;
  decidedAt: string;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string, maxAgeDays: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeDays * 86400}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

// Snapshot cache keyed by the raw cookie string. useConsent() feeds this to
// useSyncExternalStore, which compares snapshots with Object.is — so returning
// a freshly-parsed object on every call (as this did) made every render look
// like a store change, an infinite re-render loop (React error #185) that hit
// once a consent cookie existed. Returning the SAME object reference while the
// cookie is unchanged makes the snapshot stable.
let cachedRaw: string | null = null;
let cachedChoice: ConsentChoice | null = null;

export function readConsentChoice(): ConsentChoice | null {
  const raw = readCookie(COOKIE_NAME);
  if (raw === cachedRaw) return cachedChoice;
  cachedRaw = raw;
  if (!raw) {
    cachedChoice = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ConsentChoice;
    cachedChoice = parsed.version !== CONSENT_VERSION ? null : parsed;
  } catch {
    cachedChoice = null;
  }
  return cachedChoice;
}

export function hasResolvedConsent(): boolean {
  return readConsentChoice() !== null;
}

export function isMeasurementAllowed(): boolean {
  return readConsentChoice()?.measurement ?? false;
}

export function isPersonalizedAdsAllowed(): boolean {
  return readConsentChoice()?.personalizedAds ?? false;
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function commit(choice: Omit<ConsentChoice, "version" | "decidedAt">) {
  const full: ConsentChoice = { ...choice, version: CONSENT_VERSION, decidedAt: new Date().toISOString() };
  writeCookie(COOKIE_NAME, JSON.stringify(full), COOKIE_MAX_AGE_DAYS);
  notify();
}

export function saveChoices(choice: { measurement: boolean; personalizedAds: boolean }) {
  commit(choice);
}

export function acceptEssentialOnly() {
  commit({ measurement: false, personalizedAds: false });
}

/** Immediate — clears the cookie, returning to the unresolved state. */
export function withdrawConsent() {
  clearCookie(COOKIE_NAME);
  notify();
}

function getServerSnapshot(): ConsentChoice | null {
  return null;
}

/** Reactive read of the current consent choice (null = unresolved). */
export function useConsent(): ConsentChoice | null {
  return useSyncExternalStore(subscribe, readConsentChoice, getServerSnapshot);
}

// --- Global open/close state for the one <ConsentCenter /> instance
// rendered in the root layout. Any component (AdChoices, the footer link,
// the persistent consent chip) can trigger it without prop drilling.
let centerOpen = false;
const centerListeners = new Set<() => void>();
function notifyCenter() {
  centerListeners.forEach((l) => l());
}
function subscribeCenter(cb: () => void) {
  centerListeners.add(cb);
  return () => centerListeners.delete(cb);
}
function getCenterSnapshot() {
  return centerOpen;
}
function getCenterServerSnapshot() {
  return false;
}

export function openConsentCenter() {
  centerOpen = true;
  notifyCenter();
}
export function closeConsentCenter() {
  centerOpen = false;
  notifyCenter();
}
export function useConsentCenterOpen(): boolean {
  return useSyncExternalStore(subscribeCenter, getCenterSnapshot, getCenterServerSnapshot);
}

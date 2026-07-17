"use client";

import { useEffect, useRef, useState } from "react";
import {
  acceptEssentialOnly,
  closeConsentCenter,
  readConsentChoice,
  saveChoices,
  useConsentCenterOpen,
} from "@/lib/consent";

// First-party consent layer (Epic G). Matches redesign/vapornet/styles.css's
// .consent-modal: essential (always on), audience measurement, personalized
// advertising, a retention note, and two actions. Mounted once in the root
// layout; any component opens it via openConsentCenter().
export function ConsentCenter() {
  const open = useConsentCenterOpen();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const priorFocusRef = useRef<HTMLElement | null>(null);

  const existing = open ? readConsentChoice() : null;
  const [measurement, setMeasurement] = useState(existing?.measurement ?? true);
  const [personalizedAds, setPersonalizedAds] = useState(existing?.personalizedAds ?? false);

  useEffect(() => {
    if (!open) return;
    priorFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    closeConsentCenter();
    priorFocusRef.current?.focus?.();
  }

  if (!open) return null;

  function essentialOnly() {
    acceptEssentialOnly();
    close();
  }

  function save() {
    saveChoices({ measurement, personalizedAds });
    close();
  }

  return (
    <div
      className="fixed inset-0 z-[500] grid place-items-center bg-[rgba(3,12,22,.74)] p-5 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="relative w-full max-w-[520px] rounded-[4px_22px_4px_22px] border border-white/[.55] bg-base p-8 text-ink shadow-[var(--shadow-lg)]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          aria-label="Close privacy choices"
          className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full border border-line text-lg"
        >
          ×
        </button>

        <span className="font-mono text-[8px] uppercase tracking-[.09em] text-accent-soft">
          Privacy &amp; advertising
        </span>
        <h2 id="consent-title" className="mb-2 mt-3 max-w-[15ch] font-display text-[28px] font-black leading-[.98] tracking-[-0.03em]">
          Your experience, your choice.
        </h2>
        <p className="text-[11px] leading-[1.5] text-ink-2">
          Essential storage keeps the site secure. Contextual advertising uses the page you are
          reading, not a cross-site profile.
        </p>

        <div className="flex items-center justify-between gap-5 border-b border-line py-4">
          <div>
            <strong className="text-[10px]">Essential</strong>
            <p className="mt-1 text-[8px] leading-[1.4] text-ink-3">
              Security, preferences and consent record.
            </p>
          </div>
          <span className="text-[8px] font-black text-success">Always on</span>
        </div>

        <ConsentToggle
          label="Audience measurement"
          description="Aggregated page and performance events with limited retention."
          checked={measurement}
          onChange={setMeasurement}
        />
        <ConsentToggle
          label="Personalized advertising"
          description="Use consented signals for frequency and relevance."
          checked={personalizedAds}
          onChange={setPersonalizedAds}
        />

        <p className="mt-3 rounded-md bg-surface-2 p-3 text-[8px] leading-[1.45] text-ink-2">
          Raw reader events retained 30 days; aggregated reporting 13 months; withdrawal honored
          immediately — reopen this panel anytime from “Privacy &amp; ad choices.”
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={essentialOnly}
            className="min-h-9 rounded-full border border-line px-4 text-[11px] font-semibold text-ink-2"
          >
            Use essential only
          </button>
          <button
            type="button"
            onClick={save}
            className="min-h-9 rounded-full bg-accent px-4 text-[11px] font-semibold text-white hover:bg-accent-dim"
          >
            Save choices
          </button>
        </div>
      </div>
    </div>
  );
}

function ConsentToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-line py-4">
      <div>
        <strong className="text-[10px]">{label}</strong>
        <p className="mt-1 text-[8px] leading-[1.4] text-ink-3">{description}</p>
      </div>
      <label className="relative inline-flex h-[22px] w-[39px] shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-[#c4c6c3] transition-colors peer-checked:bg-success" />
        <span className="absolute left-[3px] h-4 w-4 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,.2)] transition-transform peer-checked:translate-x-[17px]" />
      </label>
    </div>
  );
}

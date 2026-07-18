"use client";

import { useState } from "react";

// Email capture. `variant="inline"` renders the prototype's .inline-form
// (input + Join free button on one row — the .morning-line band); the
// default stacked rendering serves the rail/newsletter surfaces.
export function NewsletterWidget({
  source = "rail-widget",
  variant = "stacked",
  onSuccess,
}: {
  source?: string;
  variant?: "stacked" | "inline";
  onSuccess?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) onSuccess?.();
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className={variant === "inline" ? "text-[13px] text-white/85" : "text-[13px] text-ink-2"}>
        Almost there — check your inbox and click the confirmation link.
      </p>
    );
  }

  if (variant === "inline") {
    const id = `nl-${source}`;
    return (
      <form onSubmit={submit} className="inline-form">
        <label className="sr-only" htmlFor={id}>
          Email address
        </label>
        <input
          id={id}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
        />
        <button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Join free"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
        className="bg-base border border-line-strong rounded-full px-4 py-2.5 font-mono text-[13px] outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="bg-accent text-white rounded-full py-2.5 text-[13px] font-semibold hover:bg-accent-dim transition-colors disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Subscribe free"}
      </button>
      {state === "error" && (
        <p className="text-[12px] text-accent-soft">Something went wrong — mind trying again?</p>
      )}
    </form>
  );
}

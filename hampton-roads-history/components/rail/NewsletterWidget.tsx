"use client";

import { useState } from "react";

export function NewsletterWidget({ source = "rail-widget" }: { source?: string }) {
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
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="text-[13px] text-ink-2">
        You&apos;re in — welcome aboard. Keep an eye on your inbox for our first dispatch.
      </p>
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

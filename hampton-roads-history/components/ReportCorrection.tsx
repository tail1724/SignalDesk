"use client";

import { useState } from "react";

export function ReportCorrection({ articleId }: { articleId: string }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: articleId,
          description,
          reporter_email: email || undefined,
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-mono text-[11px] text-ink-3 hover:text-ink underline"
      >
        Spot an error? Report a correction
      </button>
    );
  }

  if (state === "done") {
    return (
      <p className="text-[13px] text-ink-2">
        Thanks — our editorial team reviews every report and will post a
        correction here if warranted.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 max-w-md">
      <textarea
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What did we get wrong?"
        aria-label="Correction description"
        rows={3}
        className="bg-base border border-line-strong rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent resize-none"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email (optional, for follow-up)"
        aria-label="Your email"
        className="bg-base border border-line-strong rounded-full px-4 py-2 font-mono text-[12px] outline-none focus:border-accent"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state === "sending"}
          className="bg-accent text-white rounded-full px-4 py-2 text-[12px] font-semibold hover:bg-accent-dim transition-colors disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[12px] text-ink-3 hover:text-ink"
        >
          Cancel
        </button>
      </div>
      {state === "error" && (
        <p className="text-[12px] text-accent-soft">Something went wrong — mind trying again?</p>
      )}
    </form>
  );
}

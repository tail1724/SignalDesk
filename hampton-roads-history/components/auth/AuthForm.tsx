"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AuthMode = "sign-in" | "sign-up" | "magic-link";

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    params.get("join") === "1" ? "sign-up" : "sign-in"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Sign-up failed");
        return;
      }

      setSuccess("Account created! Check your email to confirm.");
      setEmail("");
      setPassword("");
      setTimeout(() => setMode("sign-in"), 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Sign-in failed");
        return;
      }

      setSuccess("Signed in! Redirecting...");
      setTimeout(() => router.push("/account"), 1000);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo: `${window.location.origin}/account` }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Magic link request failed");
        return;
      }

      setSuccess("Check your email for the magic link!");
      setEmail("");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = mode === "sign-up";
  const isMagicLink = mode === "magic-link";

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <form
        onSubmit={isMagicLink ? handleMagicLink : isSignUp ? handleSignUp : handleSignIn}
        className="space-y-4"
      >
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-ink mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-line-strong bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="your@email.com"
            disabled={loading}
          />
        </div>

        {!isMagicLink && (
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-ink mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-line-strong bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-dim disabled:bg-ink-3 text-white py-2.5 rounded-lg font-semibold transition-colors"
        >
          {loading ? "..." : isMagicLink ? "Send magic link" : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-ink-3">or</span>
        </div>
      </div>

      {isMagicLink ? (
        <button
          onClick={() => setMode("sign-in")}
          className="w-full text-center text-accent hover:text-accent-dim text-sm font-semibold"
        >
          Use password instead
        </button>
      ) : (
        <button
          onClick={() => setMode("magic-link")}
          className="w-full text-center text-accent hover:text-accent-dim text-sm font-semibold"
        >
          Use magic link instead
        </button>
      )}

      {!isMagicLink && (
        <button
          onClick={() => setMode(isSignUp ? "sign-in" : "sign-up")}
          className="w-full text-center text-ink-2 hover:text-ink text-sm"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Create one"}
        </button>
      )}
    </div>
  );
}

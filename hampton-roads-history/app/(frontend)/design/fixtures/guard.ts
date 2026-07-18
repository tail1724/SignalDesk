import { notFound } from "next/navigation";

// Design fixtures render deterministic prototype copy for visual-regression
// baselines (pixel-perfect plan §6). They must never be reachable in a
// production deployment — gate on an explicit opt-in env flag.
export function assertFixturesEnabled() {
  if (process.env.ALLOW_DESIGN_FIXTURES !== "1" && process.env.NODE_ENV === "production") {
    notFound();
  }
}

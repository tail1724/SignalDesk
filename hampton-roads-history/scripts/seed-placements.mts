// One-time seed for the placement table from design-blueprint.html §05.
// Idempotent (upsert on placement_id) so it's safe to run more than once —
// intended to run manually once after the Epic G migration deploys, not on
// every boot.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd(), true);

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");

const payload = await getPayload({ config, disableOnInit: true });

const PLACEMENTS = [
  {
    placement_id: "home-leader-01",
    label: "Home — premium leader",
    desktop_width: 970, desktop_height: 118, mobile_width: 358, mobile_height: 110,
    eligibility_rule: "After hero + newsletter value",
    demand_tier_order: ["direct", "pmp", "backfill"],
    route_type: "home",
  },
  {
    placement_id: "home-native-01",
    label: "Home — native partner studio",
    desktop_width: null, desktop_height: 210, mobile_width: null, mobile_height: 260,
    eligibility_rule: "After two editorial modules",
    demand_tier_order: ["direct"],
    route_type: "home",
  },
  {
    placement_id: "home-rail-01",
    label: "Home — desktop rail",
    desktop_width: 300, desktop_height: 440, mobile_width: null, mobile_height: null,
    eligibility_rule: "Desktop >= 1024px",
    demand_tier_order: ["direct", "pmp", "backfill"],
    route_type: "home",
  },
  {
    placement_id: "section-local-01",
    label: "City edition — local sponsor band",
    desktop_width: null, desktop_height: 90, mobile_width: null, mobile_height: 100,
    eligibility_rule: "City edition, after lead story",
    demand_tier_order: ["direct"],
    route_type: "section",
  },
  {
    placement_id: "article-inline-01",
    label: "Article — first inline",
    desktop_width: null, desktop_height: 135, mobile_width: null, mobile_height: 125,
    eligibility_rule: ">= 600 words and >= 35% depth",
    demand_tier_order: ["direct", "pmp", "backfill", "house"],
    route_type: "article",
  },
  {
    placement_id: "article-inline-02",
    label: "Article — second inline (revenue experiment only)",
    desktop_width: null, desktop_height: 100, mobile_width: null, mobile_height: 100,
    eligibility_rule: "Revenue variant and >= 1,400 words and >= 450 words since prior ad",
    demand_tier_order: ["direct", "pmp", "backfill", "house"],
    route_type: "article",
    active: false, // stays off until Epic G+Y both pass the launch gate
  },
  {
    placement_id: "article-rail-01",
    label: "Article — desktop attention rail",
    desktop_width: 280, desktop_height: 440, mobile_width: null, mobile_height: null,
    eligibility_rule: "Desktop, article rail exists",
    demand_tier_order: ["direct", "pmp", "backfill"],
    route_type: "article",
  },
  {
    placement_id: "mobile-anchor-01",
    label: "Article — mobile anchor",
    desktop_width: null, desktop_height: null, mobile_width: 358, mobile_height: 54,
    eligibility_rule: "After first useful screen, session cap",
    demand_tier_order: ["direct", "backfill"],
    route_type: "article",
  },
] as const;

for (const placement of PLACEMENTS) {
  const existing = await payload.find({
    collection: "hr_placements",
    where: { placement_id: { equals: placement.placement_id } },
    limit: 1,
    overrideAccess: true,
  });

  const data = {
    ...placement,
    demand_tier_order: [...placement.demand_tier_order],
    refresh_allowed: false,
    active: "active" in placement ? placement.active : true,
  };

  if (existing.docs[0]) {
    await payload.update({
      collection: "hr_placements",
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    });
  } else {
    await payload.create({ collection: "hr_placements", data, overrideAccess: true });
  }
}

// eslint-disable-next-line no-console
console.log(`Seeded ${PLACEMENTS.length} placements.`);
process.exit(0);

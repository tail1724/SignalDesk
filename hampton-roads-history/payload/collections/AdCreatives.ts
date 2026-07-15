import type { CollectionConfig } from "payload";

export const AdCreatives: CollectionConfig = {
  slug: "hr_ad_creatives",
  admin: { useAsTitle: "advertiser" },
  fields: [
    { name: "advertiser", type: "text", required: true },
    {
      name: "slot_targets",
      type: "select",
      hasMany: true,
      options: ["article-inline", "sidebar", "home-feed"],
    },
    { name: "creative_url", type: "text", required: true },
    { name: "dest_url", type: "text", required: true },
    { name: "weight", type: "number", defaultValue: 1, min: 1, max: 100 },
    { name: "flight_start", type: "date" },
    { name: "flight_end", type: "date" },
    {
      name: "is_trusted",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Only trusted creatives are served. HR_flag_ad_anomalies() (pg_cron, hourly) auto-expires flight_end for creatives whose click-through rate deviates >3 std dev from the hourly mean.",
      },
    },
  ],
};

// CI/local validator for ads.txt + sellers.json (Epic G). Validates whichever
// source is available: the ADS_TXT_CONTENT/SELLERS_JSON_CONTENT env vars if
// set (checking real configured content before a deploy), otherwise the
// checked-in fixtures at supply-chain/ads.txt and supply-chain/sellers.json
// (so CI has something to validate even without production secrets).
//
// Usage: node --import tsx scripts/validate-supply-chain.mts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseAdsTxt, parseSellersJson, reconcile } from "@/lib/supplyChain";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const adsTxtContent = process.env.ADS_TXT_CONTENT || readFileSync(path.join(root, "supply-chain/ads.txt"), "utf8");
const adsTxtSource = process.env.ADS_TXT_CONTENT ? "ADS_TXT_CONTENT env var" : "supply-chain/ads.txt fixture";

const sellersJsonContent =
  process.env.SELLERS_JSON_CONTENT || readFileSync(path.join(root, "supply-chain/sellers.json"), "utf8");
const sellersJsonSource = process.env.SELLERS_JSON_CONTENT ? "SELLERS_JSON_CONTENT env var" : "supply-chain/sellers.json fixture";

// eslint-disable-next-line no-console
console.log(`Validating ads.txt (${adsTxtSource}) and sellers.json (${sellersJsonSource})\n`);

const { entries, issues: adsTxtIssues } = parseAdsTxt(adsTxtContent);
const { doc, issues: sellersJsonIssues } = parseSellersJson(sellersJsonContent);
const reconciliationIssues = doc ? reconcile(entries, doc.sellers) : [];

const allIssues = [
  ...adsTxtIssues.map((i) => ({ ...i, source: "ads.txt" })),
  ...sellersJsonIssues.map((i) => ({ ...i, source: "sellers.json" })),
  ...reconciliationIssues.map((i) => ({ ...i, source: "reconciliation" })),
];

if (allIssues.length === 0) {
  // eslint-disable-next-line no-console
  console.log(`OK — ${entries.length} ads.txt entries, ${doc?.sellers.length ?? 0} sellers.json sellers, fully reconciled.`);
  process.exit(0);
}

for (const issue of allIssues) {
  // eslint-disable-next-line no-console
  console.error(`[${issue.source}]${issue.line ? ` line ${issue.line}:` : ""} ${issue.message}`);
}
// eslint-disable-next-line no-console
console.error(`\n${allIssues.length} issue(s) found.`);
process.exit(1);

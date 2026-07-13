import { cookies } from "next/headers";
import { ConversionBandVariant } from "@/components/ConversionBandVariant";

// A/B test (WS-15): variant is assigned per-visitor in proxy.ts and stuck
// to via the ab_variant cookie. Variant A is the long-form, duo-CTA design;
// Variant B is a tighter single-field version.
export async function ConversionBand() {
  const cookieStore = await cookies();
  const variant = cookieStore.get("ab_variant")?.value === "b" ? "b" : "a";

  return <ConversionBandVariant variant={variant} />;
}

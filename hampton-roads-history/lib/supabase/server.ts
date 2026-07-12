import { createServerClient } from "@supabase/ssr";
import { cookies as getCookies } from "next/headers";

// Server-side client with session support. Use in RSC and route handlers
// where the user's session (from cookies) should be available.
export async function createServerSupabase() {
  const cookieStore = await getCookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Setting cookies in RSC context outside route handlers is a noop
          }
        },
      },
    }
  );
}

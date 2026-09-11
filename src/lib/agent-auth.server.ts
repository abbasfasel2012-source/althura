import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function authenticatedUser(request: Request) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getClaims(value.slice(7));
  return error ? null : (data?.claims?.sub ?? null);
}

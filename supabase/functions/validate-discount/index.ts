// Validate a discount code against the database and return the
// computed discount amount in cents for a given subtotal.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, subtotalCents } = await req.json();
    if (!code || typeof code !== "string" || !Number.isFinite(subtotalCents)) {
      return jsonResponse({ error: "Invalid input" }, 400);
    }

    const normalized = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", normalized)
      .eq("is_active", true)
      .maybeSingle();

    if (error) return jsonResponse({ error: error.message }, 500);
    if (!data) return jsonResponse({ error: "Code not found" }, 404);

    const now = Date.now();
    if (data.starts_at && new Date(data.starts_at).getTime() > now) {
      return jsonResponse({ error: "This code is not active yet" }, 400);
    }
    if (data.ends_at && new Date(data.ends_at).getTime() < now) {
      return jsonResponse({ error: "This code has expired" }, 400);
    }
    if (data.max_redemptions != null && data.redemption_count >= data.max_redemptions) {
      return jsonResponse({ error: "This code has been fully redeemed" }, 400);
    }
    if (subtotalCents < (data.min_subtotal_cents ?? 0)) {
      return jsonResponse(
        { error: `Minimum order of $${((data.min_subtotal_cents ?? 0) / 100).toFixed(0)} required` },
        400,
      );
    }

    let discountCents = 0;
    if (data.percent_off) {
      discountCents = Math.round((subtotalCents * data.percent_off) / 100);
    } else if (data.amount_off_cents) {
      discountCents = Math.min(data.amount_off_cents, subtotalCents);
    }

    return jsonResponse({
      code: data.code,
      description: data.description,
      discountCents,
      percentOff: data.percent_off,
      amountOffCents: data.amount_off_cents,
    });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

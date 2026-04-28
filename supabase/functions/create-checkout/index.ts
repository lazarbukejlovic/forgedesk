// Create a Stripe Embedded Checkout session for a ForgeDesk cart.
// Server-side: rebuilds line items from authoritative product/variant prices
// in the DB (zero trust on client cart amounts), creates a `pending` order
// with order_items, then opens a Stripe session whose metadata.order_id
// the webhook uses to mark the order paid.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type StripeEnv,
  corsHeaders,
  createStripeClient,
  jsonResponse,
} from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface IncomingLine {
  productId: string;
  variantKey: string;
  variantLabel: string;
  quantity: number;
  bundleId?: string | null;
  bundleName?: string | null;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
}

const FREE_SHIPPING_THRESHOLD = 15000; // $150
const FLAT_SHIPPING = 900; // $9

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const {
      lines,
      shipping,
      discountCode,
      userId,
      environment,
      returnUrl,
    }: {
      lines: IncomingLine[];
      shipping: ShippingAddress;
      discountCode?: string;
      userId?: string;
      environment?: StripeEnv;
      returnUrl?: string;
    } = body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return jsonResponse({ error: "Cart is empty" }, 400);
    }
    if (!shipping?.email || !shipping.firstName || !shipping.lastName || !shipping.line1 ||
        !shipping.city || !shipping.postalCode || !shipping.country) {
      return jsonResponse({ error: "Shipping address is incomplete" }, 400);
    }

    // 1) Re-resolve every line server-side from the database
    const productIds = Array.from(new Set(lines.map((l) => l.productId)));
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, slug, price_cents, primary_image, product_variants(id, axis, option_key, price_delta_cents)")
      .in("id", productIds);
    if (prodErr) return jsonResponse({ error: prodErr.message }, 500);
    if (!products || products.length === 0) return jsonResponse({ error: "Products not found" }, 400);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const bundleIds = Array.from(new Set(lines.map((l) => l.bundleId).filter(Boolean))) as string[];
    const bundleMap = new Map<string, { discount_pct: number; name: string }>();
    if (bundleIds.length) {
      const { data: bundles } = await supabase
        .from("bundles")
        .select("id, name, discount_pct")
        .in("id", bundleIds);
      bundles?.forEach((b) => bundleMap.set(b.id, { discount_pct: Number(b.discount_pct), name: b.name }));
    }

    let subtotalCents = 0;
    const stripeLineItems: Array<{
      price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number };
      quantity: number;
    }> = [];
    const orderItemRows: Array<{
      product_id: string;
      product_name: string;
      variant_label: string;
      quantity: number;
      unit_price_cents: number;
      bundle_name: string | null;
    }> = [];

    for (const line of lines) {
      const product = productMap.get(line.productId);
      if (!product) return jsonResponse({ error: `Unknown product ${line.productId}` }, 400);
      const qty = Math.max(1, Math.min(99, Math.floor(line.quantity)));

      // Sum variant deltas referenced in variantKey (e.g. "Size:l|Color:graphite")
      let unit = product.price_cents;
      if (line.variantKey) {
        const parts = line.variantKey.split("|").filter(Boolean);
        for (const part of parts) {
          const [axis, optionKey] = part.split(":");
          if (axis?.startsWith("bundle")) continue;
          const v = product.product_variants?.find(
            (pv: any) => pv.axis === axis && pv.option_key === optionKey,
          );
          if (v) unit += v.price_delta_cents ?? 0;
        }
      }

      // Apply bundle discount on a per-line basis
      const bundle = line.bundleId ? bundleMap.get(line.bundleId) : null;
      if (bundle && bundle.discount_pct > 0) {
        unit = Math.round(unit * (1 - bundle.discount_pct));
      }

      subtotalCents += unit * qty;
      stripeLineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: line.variantLabel || (line.bundleName ? `Part of ${line.bundleName}` : undefined),
          },
          unit_amount: unit,
        },
        quantity: qty,
      });
      orderItemRows.push({
        product_id: product.id,
        product_name: product.name,
        variant_label: line.variantLabel ?? "",
        quantity: qty,
        unit_price_cents: unit,
        bundle_name: line.bundleName ?? null,
      });
    }

    // 2) Validate + apply discount code
    let discountCents = 0;
    let appliedCode: string | null = null;
    if (discountCode) {
      const { data: dc } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      if (dc) {
        const now = Date.now();
        const ok =
          (!dc.starts_at || new Date(dc.starts_at).getTime() <= now) &&
          (!dc.ends_at || new Date(dc.ends_at).getTime() >= now) &&
          subtotalCents >= (dc.min_subtotal_cents ?? 0) &&
          (dc.max_redemptions == null || dc.redemption_count < dc.max_redemptions);
        if (ok) {
          if (dc.percent_off) discountCents = Math.round((subtotalCents * dc.percent_off) / 100);
          else if (dc.amount_off_cents) discountCents = Math.min(dc.amount_off_cents, subtotalCents);
          appliedCode = dc.code;
        }
      }
    }

    // 3) Shipping
    const shippingCents = subtotalCents - discountCents >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
    const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;

    // 4) Add shipping as a positive line item (Stripe forbids negative unit_amount).
    //    Discounts are applied below via a one-shot Stripe coupon.
    if (shippingCents > 0) {
      stripeLineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping" },
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }

    // 5) Create the pending order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId ?? null,
        email: shipping.email,
        status: "pending",
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        discount_code: appliedCode,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        shipping_address: shipping,
      })
      .select("id")
      .single();
    if (orderErr || !order) return jsonResponse({ error: orderErr?.message ?? "Could not create order" }, 500);

    const itemsToInsert = orderItemRows.map((r) => ({ ...r, order_id: order.id }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsToInsert);
    if (itemsErr) return jsonResponse({ error: itemsErr.message }, 500);

    // 6) Create Stripe session
    const env = (environment || "sandbox") as StripeEnv;
    const stripe = createStripeClient(env);
    const origin = req.headers.get("origin") || "https://example.com";

    // If we computed a discount, mint a one-shot Stripe coupon and attach it.
    let stripeDiscounts: Array<{ coupon: string }> | undefined;
    if (discountCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: discountCents,
        currency: "usd",
        duration: "once",
        name: appliedCode ? `Discount (${appliedCode})` : "Discount",
        max_redemptions: 1,
      });
      stripeDiscounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create({
      line_items: stripeLineItems as any,
      mode: "payment",
      ui_mode: "embedded",
      ...(stripeDiscounts ? { discounts: stripeDiscounts } : {}),
      return_url:
        returnUrl ||
        `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      // We intentionally do NOT pass customer_email — Stripe applies strict
      // domain/MX validation that rejects many real addresses through the
      // gateway. The shipping email is already saved on our order row and
      // collected again inside Embedded Checkout.
      metadata: {
        order_id: order.id,
        user_id: userId ?? "",
        environment: env,
      },
      payment_intent_data: {
        metadata: { order_id: order.id, user_id: userId ?? "" },
      },
    });

    // 7) Persist Stripe session id on the order for traceability
    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return jsonResponse({
      clientSecret: session.client_secret,
      orderId: order.id,
      totals: { subtotalCents, discountCents, shippingCents, totalCents },
    });
  } catch (e) {
    console.error("create-checkout error", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

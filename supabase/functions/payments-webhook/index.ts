// Stripe webhook handler — flips orders to paid/failed and clears the user's
// cart. Idempotent: reprocessing the same event leaves the order in the same
// terminal state. The connector registers both sandbox and live webhooks pointing
// here with ?env=sandbox|live.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("[payments-webhook]", event.type, env);

    switch (event.type) {
      case "checkout.session.completed":
      case "transaction.completed":
        await markOrderPaid(event.data.object);
        break;
      case "checkout.session.async_payment_failed":
      case "payment_intent.payment_failed":
      case "transaction.payment_failed":
        await markOrderFailed(event.data.object);
        break;
      case "charge.refunded":
        await markOrderRefunded(event.data.object);
        break;
      default:
        console.log("[payments-webhook] unhandled", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[payments-webhook] error", e);
    return new Response("Webhook error", { status: 400 });
  }
});

function getOrderIdFromObject(obj: any): string | null {
  return (
    obj?.metadata?.order_id ??
    obj?.metadata?.orderId ??
    obj?.payment_intent?.metadata?.order_id ??
    null
  );
}

async function markOrderPaid(obj: any) {
  const orderId = getOrderIdFromObject(obj);
  const sessionId: string | undefined = obj?.id;
  const paymentIntent: string | undefined =
    typeof obj?.payment_intent === "string" ? obj.payment_intent : obj?.payment_intent?.id;

  let orderQuery = supabase.from("orders").select("id, user_id, status, discount_code");
  if (orderId) orderQuery = orderQuery.eq("id", orderId);
  else if (sessionId) orderQuery = orderQuery.eq("stripe_session_id", sessionId);
  else return;

  const { data: order } = await orderQuery.maybeSingle();
  if (!order) {
    console.warn("[payments-webhook] order not found for paid event", { orderId, sessionId });
    return;
  }

  // Idempotency — only transition pending → paid
  if (["paid", "fulfilled", "shipped", "delivered"].includes(order.status)) return;

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      placed_at: new Date().toISOString(),
      stripe_payment_intent: paymentIntent ?? null,
      stripe_session_id: sessionId ?? null,
    })
    .eq("id", order.id);
  if (error) {
    console.error("[payments-webhook] update error", error);
    return;
  }

  // Increment discount redemption count
  if (order.discount_code) {
    const current = await getRedemptionCount(order.discount_code);
    await supabase
      .from("discount_codes")
      .update({ redemption_count: current + 1 })
      .eq("code", order.discount_code);
  }

  // Clear that user's cart
  if (order.user_id) {
    await supabase.from("cart_items").delete().eq("user_id", order.user_id);
  }

  // Send order confirmation email — fired exactly once on pending → paid.
  // Uses idempotency key `order-confirmation-<orderId>` so retries are safe.
  await sendOrderConfirmation(order.id);
}

async function sendOrderConfirmation(orderId: string) {
  try {
    const [{ data: fullOrder }, { data: items }] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, email, status, placed_at, subtotal_cents, discount_cents, discount_code, shipping_cents, total_cents, shipping_address",
        )
        .eq("id", orderId)
        .maybeSingle(),
      supabase
        .from("order_items")
        .select("product_name, variant_label, bundle_name, quantity, unit_price_cents")
        .eq("order_id", orderId),
    ]);

    if (!fullOrder?.email) {
      console.warn("[payments-webhook] no email on order, skipping confirmation", { orderId });
      return;
    }

    const siteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "";
    const orderUrl = siteUrl ? `${siteUrl}/account/orders/${orderId}` : undefined;

    const { error: invokeError } = await supabase.functions.invoke(
      "send-transactional-email",
      {
        body: {
          templateName: "order-confirmation",
          recipientEmail: fullOrder.email,
          idempotencyKey: `order-confirmation-${orderId}`,
          templateData: {
            orderNumber: orderId.slice(0, 8).toUpperCase(),
            orderUrl,
            status: fullOrder.status,
            placedAt: fullOrder.placed_at,
            items: items ?? [],
            subtotalCents: fullOrder.subtotal_cents,
            discountCents: fullOrder.discount_cents,
            discountCode: fullOrder.discount_code,
            shippingCents: fullOrder.shipping_cents,
            totalCents: fullOrder.total_cents,
            shippingAddress: fullOrder.shipping_address,
            email: fullOrder.email,
          },
        },
      },
    );
    if (invokeError) {
      console.error("[payments-webhook] confirmation email invoke error", invokeError);
    }
  } catch (e) {
    // Never fail the webhook over email issues
    console.error("[payments-webhook] confirmation email exception", e);
  }
}

async function getRedemptionCount(code: string): Promise<number> {
  const { data } = await supabase
    .from("discount_codes")
    .select("redemption_count")
    .eq("code", code)
    .maybeSingle();
  return data?.redemption_count ?? 0;
}

async function markOrderFailed(obj: any) {
  const orderId = getOrderIdFromObject(obj);
  const sessionId: string | undefined = obj?.id;
  let q = supabase.from("orders").select("id, status");
  if (orderId) q = q.eq("id", orderId);
  else if (sessionId) q = q.eq("stripe_session_id", sessionId);
  else return;

  const { data: order } = await q.maybeSingle();
  if (!order || order.status === "paid") return;
  await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
}

async function markOrderRefunded(obj: any) {
  const paymentIntent =
    typeof obj?.payment_intent === "string" ? obj.payment_intent : obj?.payment_intent?.id;
  if (!paymentIntent) return;
  await supabase
    .from("orders")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent", paymentIntent);
}

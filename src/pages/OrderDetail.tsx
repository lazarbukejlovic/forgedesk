import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { OrderStatusChip } from "@/components/OrderStatusChip";
import { Button } from "@/components/ui/button";
import { reorderById } from "@/lib/reorder";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [reordering, setReordering] = useState(false);

  const handleReorder = async () => {
    if (!order) return;
    setReordering(true);
    const { added } = await reorderById(order.id);
    setReordering(false);
    if (added > 0) navigate("/cart");
  };

  useEffect(() => {
    if (!id || !user) return;
    Promise.all([
      supabase.from("orders").select("*").eq("id", id).maybeSingle(),
      supabase.from("order_items").select("*").eq("order_id", id),
    ]).then(([o, i]) => {
      if (!o.data) {
        setNotFound(true);
        return;
      }
      setOrder(o.data);
      setItems(i.data ?? []);
    });
  }, [id, user]);

  if (notFound) {
    return (
      <div className="container-editorial py-20">
        <h1 className="font-display text-4xl tracking-tightest">Order not found.</h1>
        <Button asChild className="mt-6">
          <Link to="/account/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }
  if (!order)
    return (
      <div className="container-editorial py-14 md:py-20">
        <div className="h-3 w-20 animate-pulse bg-surface" />
        <div className="mt-4 h-10 w-72 animate-pulse bg-surface" />
        <div className="mt-10 grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-1 w-full animate-pulse bg-surface" />
          ))}
        </div>
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 w-full animate-pulse bg-surface" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-32 w-full animate-pulse bg-surface" />
            <div className="h-32 w-full animate-pulse bg-surface" />
          </div>
        </div>
      </div>
    );

  const addr = order.shipping_address ?? {};

  return (
    <div className="container-editorial py-14 md:py-20">
      <Link to="/account/orders" className="eyebrow link-underline">
        ← All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl tracking-tightest md:text-5xl">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <div className="flex items-center gap-3">
          <OrderStatusChip status={order.status} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleReorder}
            disabled={reordering}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {reordering ? "Adding…" : "Buy again"}
          </Button>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Placed {new Date(order.placed_at ?? order.created_at).toLocaleString()}
      </p>

      <StatusTimeline status={order.status} />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.5fr,1fr]">
        {/* Items */}
        <div>
          <h2 className="font-display text-xl">Items</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between gap-4 py-4">
                <div>
                  <p className="font-display">
                    {it.quantity} × {it.product_name}
                  </p>
                  {it.bundle_name && (
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-accent">
                      {it.bundle_name}
                    </p>
                  )}
                  {it.variant_label && (
                    <p className="mt-1 text-xs text-muted-foreground">{it.variant_label}</p>
                  )}
                </div>
                <span className="font-display tabular-nums">
                  {formatPrice(it.unit_price_cents * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          <div className="border border-border bg-surface p-6">
            <h2 className="font-display text-xl">Totals</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row dt="Subtotal" dd={formatPrice(order.subtotal_cents)} />
              {order.discount_cents > 0 && (
                <Row
                  dt={`Discount${order.discount_code ? ` (${order.discount_code})` : ""}`}
                  dd={`− ${formatPrice(order.discount_cents)}`}
                />
              )}
              <Row dt="Shipping" dd={order.shipping_cents === 0 ? "Free" : formatPrice(order.shipping_cents)} />
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="font-display text-base">Total</dt>
                <dd className="font-display text-base tabular-nums">{formatPrice(order.total_cents)}</dd>
              </div>
            </dl>
          </div>

          <div className="border border-border bg-surface p-6">
            <h2 className="font-display text-xl">Shipping</h2>
            <address className="mt-4 not-italic text-sm leading-6">
              {addr.firstName} {addr.lastName}
              <br />
              {addr.line1}
              {addr.line2 && (
                <>
                  <br />
                  {addr.line2}
                </>
              )}
              <br />
              {addr.city}
              {addr.region && `, ${addr.region}`} {addr.postalCode}
              <br />
              {addr.country}
            </address>
            <p className="mt-3 text-xs text-muted-foreground">{order.email}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const STATUS_STEPS = ["pending", "paid", "fulfilled", "shipped", "delivered"] as const;

const StatusTimeline = ({ status }: { status: string }) => {
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className="mt-8 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        This order is {status}.
      </div>
    );
  }
  const idx = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
  return (
    <ol className="mt-10 grid grid-cols-5 gap-2">
      {STATUS_STEPS.map((s, i) => (
        <li key={s} className="flex flex-col gap-2">
          <div
            className={`h-1 w-full ${
              i <= idx ? "bg-foreground" : "bg-border"
            }`}
          />
          <span
            className={`text-[11px] uppercase tracking-[0.14em] ${
              i <= idx ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {s}
          </span>
        </li>
      ))}
    </ol>
  );
};

const Row = ({ dt, dd }: { dt: string; dd: string }) => (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">{dt}</dt>
    <dd className="tabular-nums">{dd}</dd>
  </div>
);

export default OrderDetail;

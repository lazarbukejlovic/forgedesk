import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { OrderStatusChip } from "@/components/OrderStatusChip";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type OrderStatus = Enums<"order_status">;
const STATUS_FLOW: OrderStatus[] = ["pending", "paid", "fulfilled", "shipped", "delivered"];
const TERMINAL: OrderStatus[] = ["cancelled", "refunded"];

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Tables<"orders"> | null>(null);
  const [items, setItems] = useState<Tables<"order_items">[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    const [{ data: o }, { data: i }] = await Promise.all([
      supabase.from("orders").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
    ]);
    setOrder(o);
    setItems(i ?? []);
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: OrderStatus) => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Order marked ${status}`);
    load();
  };

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="h-3 w-24 animate-pulse bg-surface" />
        <div className="h-8 w-72 animate-pulse bg-surface" />
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="h-64 w-full animate-pulse bg-surface" />
          <div className="h-64 w-full animate-pulse bg-surface" />
        </div>
      </div>
    );
  }

  const ship: ShippingAddress = (order.shipping_address as ShippingAddress | null) ?? {};

  return (
    <>
      <Link
        to="/admin/orders"
        className="mb-4 inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-muted-foreground link-underline"
      >
        <ArrowLeft className="h-3 w-3" /> All orders
      </Link>

      <AdminPageHeader
        eyebrow={`Order ${order.id.slice(0, 8).toUpperCase()}`}
        title={`${order.email}`}
        description={`Placed ${new Date(order.placed_at ?? order.created_at).toLocaleString()}`}
        actions={<OrderStatusChip status={order.status} />}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section>
            <h2 className="eyebrow mb-3">Items</h2>
            <div className="border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Variant</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <p className="font-medium">{it.product_name}</p>
                        {it.bundle_name && (
                          <p className="text-xs text-muted-foreground">Part of {it.bundle_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{it.variant_label || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{it.quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPrice(it.unit_price_cents)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPrice(it.unit_price_cents * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="eyebrow mb-3">Shipping address</h2>
            <div className="border border-border bg-surface/40 p-5 text-sm">
              <p className="font-medium">
                {ship.firstName} {ship.lastName}
              </p>
              <p className="mt-1 text-muted-foreground">{ship.email}</p>
              {ship.phone && <p className="text-muted-foreground">{ship.phone}</p>}
              <p className="mt-3">
                {ship.line1}
                {ship.line2 ? `, ${ship.line2}` : ""}
              </p>
              <p>
                {ship.city}
                {ship.region ? `, ${ship.region}` : ""} {ship.postalCode}
              </p>
              <p>{ship.country}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="border border-border bg-surface/40 p-5">
            <h2 className="eyebrow mb-3">Totals</h2>
            <Row label="Subtotal" value={formatPrice(order.subtotal_cents)} />
            {order.discount_cents > 0 && (
              <Row
                label={`Discount${order.discount_code ? ` (${order.discount_code})` : ""}`}
                value={`- ${formatPrice(order.discount_cents)}`}
              />
            )}
            <Row label="Shipping" value={formatPrice(order.shipping_cents)} />
            <div className="mt-3 border-t border-border pt-3">
              <Row label="Total" value={formatPrice(order.total_cents)} bold />
            </div>
          </div>

          <div className="border border-border bg-surface/40 p-5">
            <h2 className="eyebrow mb-3">Update status</h2>
            <div className="flex flex-col gap-2">
              {STATUS_FLOW.map((s) => (
                <Button
                  key={s}
                  variant={order.status === s ? "default" : "outline"}
                  size="sm"
                  disabled={saving || order.status === s}
                  onClick={() => updateStatus(s)}
                  className="justify-start"
                >
                  Mark as {s}
                </Button>
              ))}
              <div className="my-1 border-t border-border" />
              {TERMINAL.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  disabled={saving || order.status === s}
                  onClick={() => updateStatus(s)}
                  className="justify-start text-destructive hover:text-destructive"
                >
                  Mark as {s}
                </Button>
              ))}
            </div>
          </div>

          {order.stripe_payment_intent && (
            <div className="border border-border bg-surface/40 p-5 text-xs">
              <h2 className="eyebrow mb-2">Stripe</h2>
              <p className="break-all font-mono text-muted-foreground">
                {order.stripe_payment_intent}
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
};

const Row = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <div className={`flex items-center justify-between py-1 text-sm ${bold ? "font-medium" : ""}`}>
    <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
);

export default AdminOrderDetail;

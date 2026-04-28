import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { OrderStatusChip } from "@/components/OrderStatusChip";
import { Button } from "@/components/ui/button";
import { reorderById } from "@/lib/reorder";

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  placed_at: string | null;
  discount_code: string | null;
  order_items: { product_name: string; quantity: number }[];
}

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    const { added } = await reorderById(orderId);
    setReorderingId(null);
    if (added > 0) navigate("/cart");
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, status, total_cents, created_at, placed_at, discount_code, order_items(product_name, quantity)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as OrderRow[] | null) ?? []));
  }, [user]);

  return (
    <div className="container-editorial py-14 md:py-20">
      <span className="eyebrow">Account</span>
      <div className="mt-3 flex items-end justify-between gap-6">
        <h1 className="font-display text-4xl tracking-tightest md:text-5xl">Orders.</h1>
        <Link to="/account" className="text-sm link-underline text-muted-foreground">
          ← Account overview
        </Link>
      </div>

      {orders === null ? (
        <ul className="mt-12 divide-y divide-border border-y border-border">
          {[0, 1, 2].map((i) => (
            <li key={i} className="grid gap-4 py-6 md:grid-cols-[1.4fr,1fr,auto,auto]">
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse bg-surface" />
                <div className="h-4 w-2/3 animate-pulse bg-surface" />
              </div>
              <div className="h-3 w-20 animate-pulse bg-surface" />
              <div className="h-5 w-16 animate-pulse bg-surface md:justify-self-end" />
              <div className="h-3 w-20 animate-pulse bg-surface" />
            </li>
          ))}
        </ul>
      ) : orders.length === 0 ? (
        <div className="mt-12 border border-border bg-surface p-12">
          <p className="font-display text-xl">No orders yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Place your first order — it'll appear here with status updates.
          </p>
          <Button asChild className="mt-6">
            <Link to="/shop">Browse the shop</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-12 divide-y divide-border border-y border-border">
          {orders.map((o) => {
            const itemCount = o.order_items.reduce((n, i) => n + i.quantity, 0);
            const titles = o.order_items.slice(0, 3).map((i) => i.product_name).join(" · ");
            return (
              <li key={o.id} className="grid gap-4 py-6 md:grid-cols-[1.4fr,1fr,auto,auto] md:items-center">
                <Link to={`/account/orders/${o.id}`} className="group block">
                  <div className="flex items-center gap-3">
                    <OrderStatusChip status={o.status} />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 font-display group-hover:underline">
                    {titles || "Order"}
                    {o.order_items.length > 3 && ` · +${o.order_items.length - 3} more`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                    {o.discount_code && ` · code ${o.discount_code}`}
                  </p>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.placed_at ?? o.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="font-display text-lg tabular-nums md:text-right">
                  {formatPrice(o.total_cents)}
                </p>
                <button
                  type="button"
                  onClick={() => handleReorder(o.id)}
                  disabled={reorderingId === o.id}
                  className="inline-flex items-center gap-1.5 self-start text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground disabled:opacity-50 md:self-center"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {reorderingId === o.id ? "Adding…" : "Buy again"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Orders;

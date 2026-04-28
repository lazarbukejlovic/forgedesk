import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { OrderStatusChip } from "@/components/OrderStatusChip";
import { formatPrice } from "@/lib/format";

interface Stats {
  pending: number;
  paid: number;
  shipped: number;
  revenueCents: number;
  products: number;
  outOfStock: number;
}

interface RecentOrder {
  id: string;
  email: string;
  status: string;
  total_cents: number;
  placed_at: string | null;
  created_at: string;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: orders }, { data: products }] = await Promise.all([
        supabase
          .from("orders")
          .select("id, email, status, total_cents, placed_at, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("products").select("id, stock_count, is_active"),
      ]);

      const o = orders ?? [];
      const p = products ?? [];
      setStats({
        pending: o.filter((x) => x.status === "pending").length,
        paid: o.filter((x) => ["paid", "fulfilled"].includes(x.status)).length,
        shipped: o.filter((x) => ["shipped", "delivered"].includes(x.status)).length,
        revenueCents: o
          .filter((x) => !["pending", "cancelled", "refunded"].includes(x.status))
          .reduce((sum, x) => sum + (x.total_cents ?? 0), 0),
        products: p.filter((x) => x.is_active).length,
        outOfStock: p.filter((x) => (x.stock_count ?? 0) === 0).length,
      });
      setRecent(o.slice(0, 8));
    })();
  }, []);

  return (
    <>
      <AdminPageHeader
        eyebrow="Overview"
        title="At a glance."
        description="A snapshot of where the store stands right now."
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Pending" value={stats?.pending ?? "—"} />
        <Stat label="Paid" value={stats?.paid ?? "—"} />
        <Stat label="Shipped / delivered" value={stats?.shipped ?? "—"} />
        <Stat label="Revenue" value={stats ? formatPrice(stats.revenueCents) : "—"} />
        <Stat label="Active products" value={stats?.products ?? "—"} />
        <Stat label="Out of stock" value={stats?.outOfStock ?? "—"} highlight={!!stats?.outOfStock} />
      </div>

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-tight">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm link-underline">
            See all
          </Link>
        </div>
        <div className="overflow-hidden border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              )}
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to={`/admin/orders/${o.id}`} className="link-underline">
                      {o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-3 truncate">{o.email}</td>
                  <td className="px-4 py-3">
                    <OrderStatusChip status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatPrice(o.total_cents)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(o.placed_at ?? o.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

const Stat = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) => (
  <div className="bg-background p-5">
    <p className="eyebrow">{label}</p>
    <p
      className={`mt-2 font-display text-2xl tabular-nums tracking-tight ${
        highlight ? "text-destructive" : ""
      }`}
    >
      {value}
    </p>
  </div>
);

export default AdminOverview;

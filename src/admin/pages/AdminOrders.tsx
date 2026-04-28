import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { OrderStatusChip } from "@/components/OrderStatusChip";
import { formatPrice } from "@/lib/format";
import { Input } from "@/components/ui/input";

const STATUSES = ["all", "pending", "paid", "fulfilled", "shipped", "delivered", "cancelled", "refunded"];

interface Order {
  id: string;
  email: string;
  status: string;
  total_cents: number;
  placed_at: string | null;
  created_at: string;
  user_id: string | null;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, email, status, total_cents, placed_at, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(500);
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!o.email.toLowerCase().includes(q) && !o.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, filter, query]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Orders"
        title="All orders."
        description="Filter, search, and step through the order lifecycle."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors ${
                filter === s
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto w-full max-w-xs">
          <Input
            placeholder="Search email or order id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
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
            {loading &&
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3"><div className="h-3 w-20 animate-pulse bg-surface" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-40 animate-pulse bg-surface" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 animate-pulse bg-surface" /></td>
                  <td className="px-4 py-3"><div className="ml-auto h-3 w-12 animate-pulse bg-surface" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-32 animate-pulse bg-surface" /></td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No orders match.
                </td>
              </tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link to={`/admin/orders/${o.id}`} className="link-underline">
                    {o.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.email}</td>
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
    </>
  );
};

export default AdminOrders;

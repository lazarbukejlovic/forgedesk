import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { formatPrice, slugify } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { resolveImage } from "@/data/imageMap";

interface Product {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  stock_count: number;
  is_active: boolean;
  is_featured: boolean;
  primary_image: string;
  category_id: string | null;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "out" | "low">("all");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, slug, price_cents, stock_count, is_active, is_featured, primary_image, category_id")
        .order("name"),
      supabase.from("categories").select("id, name").order("name"),
    ]);
    setProducts((p as Product[]) ?? []);
    setCategories(c ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
      if (stockFilter === "out" && p.stock_count > 0) return false;
      if (stockFilter === "low" && (p.stock_count === 0 || p.stock_count > 5)) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [products, query, categoryFilter, stockFilter]);

  const createDraft = async () => {
    const name = "Untitled product";
    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
        price_cents: 0,
        primary_image: "/placeholder.svg",
        is_active: false,
      })
      .select("id")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Couldn't create product");
      return;
    }
    navigate(`/admin/products/${data.id}`);
  };

  const toggleActive = async (id: string, value: boolean) => {
    await supabase.from("products").update({ is_active: value }).eq("id", id);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: value } : p)));
  };

  const updateStock = async (id: string, value: number) => {
    await supabase.from("products").update({ stock_count: value }).eq("id", id);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock_count: value } : p)));
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Products"
        title="Catalog."
        description="Edit pricing, inventory, variants and imagery."
        actions={
          <Button onClick={createDraft}>
            <Plus className="mr-1.5 h-4 w-4" /> New product
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className="rounded-sm border border-border bg-background px-2 py-1.5 text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStockFilter(f)}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.14em] ${
                stockFilter === f
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All stock" : f === "low" ? "Low stock" : "Out"}
            </button>
          ))}
        </div>
        <div className="ml-auto w-full max-w-xs">
          <Input
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No products match.
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveImage(p.primary_image)}
                      alt=""
                      className="h-10 w-10 rounded-sm border border-border object-cover"
                    />
                    <div className="min-w-0">
                      <Link to={`/admin/products/${p.id}`} className="font-medium link-underline">
                        {p.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPrice(p.price_cents)}</td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    min={0}
                    value={p.stock_count}
                    onChange={(e) => updateStock(p.id, Math.max(0, Number(e.target.value)))}
                    className={`w-20 rounded-sm border border-border bg-background px-2 py-1 text-right text-sm ${
                      p.stock_count === 0 ? "text-destructive" : ""
                    }`}
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(p.id, !p.is_active)}
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${
                      p.is_active
                        ? "bg-foreground text-background"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {p.is_active ? "Live" : "Draft"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/admin/products/${p.id}`}
                    className="text-xs uppercase tracking-[0.14em] link-underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminProducts;

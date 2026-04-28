import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { slugify } from "@/lib/format";
import { resolveImage } from "@/data/imageMap";

type Bundle = Omit<Tables<"bundles">, "discount_pct"> & { discount_pct: number | string };
type BundleProduct = Tables<"bundle_products">;

const AdminBundles = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = useState<Record<string, BundleProduct[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    const [{ data: b }, { data: p }, { data: bp }] = await Promise.all([
      supabase.from("bundles").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name").eq("is_active", true).order("name"),
      supabase.from("bundle_products").select("*").order("sort_order"),
    ]);
    setBundles((b ?? []) as Bundle[]);
    setProducts(p ?? []);
    const grouped: Record<string, BundleProduct[]> = {};
    (bp ?? []).forEach((row) => {
      (grouped[row.bundle_id] ??= []).push(row);
    });
    setItems(grouped);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const name = "New bundle";
    const { data, error } = await supabase
      .from("bundles")
      .insert({
        name,
        slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 5)}`,
        image: "/placeholder.svg",
        discount_pct: 0.1,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setBundles((b) => [data as Bundle, ...b]);
    setExpanded(data.id);
  };

  const update = (id: string, patch: Partial<Bundle>) =>
    setBundles((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const save = async (b: Bundle) => {
    const { error } = await supabase
      .from("bundles")
      .update({
        name: b.name,
        slug: b.slug,
        image: b.image,
        tagline: b.tagline,
        discount_pct: Number(b.discount_pct) || 0,
        is_active: b.is_active,
        is_featured: b.is_featured,
      })
      .eq("id", b.id);
    if (error) toast.error(error.message);
    else toast.success("Bundle saved");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete bundle?")) return;
    await supabase.from("bundles").delete().eq("id", id);
    setBundles((b) => b.filter((x) => x.id !== id));
  };

  const addProduct = async (bundleId: string, productId: string) => {
    const sortOrder = (items[bundleId] ?? []).length;
    const { data } = await supabase
      .from("bundle_products")
      .insert({ bundle_id: bundleId, product_id: productId, sort_order: sortOrder })
      .select()
      .single();
    if (data)
      setItems((prev) => ({ ...prev, [bundleId]: [...(prev[bundleId] ?? []), data as BundleProduct] }));
  };

  const removeProduct = async (bundleId: string, rowId: string) => {
    await supabase.from("bundle_products").delete().eq("id", rowId);
    setItems((prev) => ({
      ...prev,
      [bundleId]: (prev[bundleId] ?? []).filter((r) => r.id !== rowId),
    }));
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Bundles"
        title="Curated sets."
        description="Group products into a discounted bundle."
        actions={
          <Button onClick={create}>
            <Plus className="mr-1.5 h-4 w-4" /> New bundle
          </Button>
        }
      />

      <div className="space-y-3">
        {bundles.map((b) => (
          <div key={b.id} className="border border-border bg-background">
            <button
              onClick={() => setExpanded(expanded === b.id ? null : b.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <img
                  src={resolveImage(b.image)}
                  alt=""
                  className="h-10 w-14 rounded-sm border border-border object-cover"
                />
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{b.slug} · {Math.round(Number(b.discount_pct) * 100)}% off ·{" "}
                    {(items[b.id] ?? []).length} products
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em]">
                {b.is_featured && <span className="text-accent">Featured</span>}
                {!b.is_active && <span className="text-muted-foreground">Hidden</span>}
              </div>
            </button>

            {expanded === b.id && (
              <div className="grid gap-4 border-t border-border p-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Input
                    value={b.name}
                    onChange={(e) => update(b.id, { name: e.target.value })}
                    placeholder="Name"
                  />
                  <Input
                    value={b.slug}
                    onChange={(e) => update(b.id, { slug: e.target.value })}
                    placeholder="Slug"
                  />
                  <Input
                    value={b.image}
                    onChange={(e) => update(b.id, { image: e.target.value })}
                    placeholder="Image URL"
                  />
                  <Textarea
                    rows={2}
                    value={b.tagline ?? ""}
                    onChange={(e) => update(b.id, { tagline: e.target.value })}
                    placeholder="Tagline"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <label className="text-xs">
                      <span className="mb-1 block uppercase tracking-[0.14em] text-muted-foreground">
                        Discount %
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={b.discount_pct}
                        onChange={(e) => update(b.id, { discount_pct: e.target.value })}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={b.is_active}
                        onChange={(e) => update(b.id, { is_active: e.target.checked })}
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={b.is_featured}
                        onChange={(e) => update(b.id, { is_featured: e.target.checked })}
                      />
                      Featured
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => save(b)}>Save</Button>
                    <Button variant="outline" onClick={() => remove(b.id)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="eyebrow mb-2">Products in this bundle</p>
                  <div className="space-y-1.5">
                    {(items[b.id] ?? []).map((row) => {
                      const p = products.find((x) => x.id === row.product_id);
                      return (
                        <div
                          key={row.id}
                          className="flex items-center justify-between border border-border px-3 py-2 text-sm"
                        >
                          <span>{p?.name ?? row.product_id}</span>
                          <button
                            onClick={() => removeProduct(b.id, row.id)}
                            className="text-xs text-destructive link-underline"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <select
                    className="mt-3 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        addProduct(b.id, e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">+ Add a product…</option>
                    {products
                      .filter((p) => !(items[b.id] ?? []).some((r) => r.product_id === p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
        {bundles.length === 0 && (
          <p className="text-sm text-muted-foreground">No bundles yet.</p>
        )}
      </div>
    </>
  );
};

export default AdminBundles;

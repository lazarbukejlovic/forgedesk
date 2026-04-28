import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { resolveImage } from "@/data/imageMap";
import { toast } from "sonner";

const AdminFeatured = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);

  const load = async () => {
    const [{ data: p }, { data: b }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, primary_image, is_featured, is_active")
        .order("name"),
      supabase
        .from("bundles")
        .select("id, name, image, is_featured, is_active")
        .order("name"),
    ]);
    setProducts(p ?? []);
    setBundles(b ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleProduct = async (id: string, value: boolean) => {
    const { error } = await supabase.from("products").update({ is_featured: value }).eq("id", id);
    if (error) return toast.error(error.message);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_featured: value } : p)));
  };

  const toggleBundle = async (id: string, value: boolean) => {
    const { error } = await supabase.from("bundles").update({ is_featured: value }).eq("id", id);
    if (error) return toast.error(error.message);
    setBundles((prev) => prev.map((b) => (b.id === id ? { ...b, is_featured: value } : b)));
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Homepage"
        title="What's featured."
        description="Toggle which products and bundles appear in the homepage spotlight."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <FeatureColumn
          title="Featured products"
          rows={products.map((p) => ({
            id: p.id,
            name: p.name,
            image: resolveImage(p.primary_image),
            checked: p.is_featured,
            disabled: !p.is_active,
            onChange: (v: boolean) => toggleProduct(p.id, v),
          }))}
        />
        <FeatureColumn
          title="Featured bundles"
          rows={bundles.map((b) => ({
            id: b.id,
            name: b.name,
            image: resolveImage(b.image),
            checked: b.is_featured,
            disabled: !b.is_active,
            onChange: (v: boolean) => toggleBundle(b.id, v),
          }))}
        />
      </div>
    </>
  );
};

const FeatureColumn = ({
  title,
  rows,
}: {
  title: string;
  rows: {
    id: string;
    name: string;
    image: string;
    checked: boolean;
    disabled: boolean;
    onChange: (v: boolean) => void;
  }[];
}) => (
  <section>
    <h2 className="eyebrow mb-3">{title}</h2>
    <div className="overflow-hidden border border-border">
      {rows.map((r) => (
        <label
          key={r.id}
          className={`flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 ${
            r.disabled ? "opacity-50" : "hover:bg-muted/30"
          }`}
        >
          <img
            src={r.image || "/placeholder.svg"}
            alt=""
            className="h-10 w-10 rounded-sm border border-border object-cover"
          />
          <span className="flex-1 text-sm">{r.name}</span>
          {r.disabled && (
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Hidden
            </span>
          )}
          <input
            type="checkbox"
            checked={r.checked}
            onChange={(e) => r.onChange(e.target.checked)}
            disabled={r.disabled}
            className="h-4 w-4 accent-foreground"
          />
        </label>
      ))}
      {rows.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing here.</p>
      )}
    </div>
  </section>
);

export default AdminFeatured;

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Upload, Plus } from "lucide-react";

type ProductRow = Tables<"products">;
type ProductImage = Tables<"product_images">;
type ProductSpec = Tables<"product_specs">;
type ProductVariant = Tables<"product_variants">;
// Numeric inputs may temporarily hold "" while editing.
type VariantDraft = Omit<ProductVariant, "price_delta_cents" | "stock_count"> & {
  price_delta_cents: number | string;
  stock_count: number | string;
};
type SetupGroup = Enums<"setup_group">;

const SETUP_GROUPS: SetupGroup[] = ["surface", "stands", "lighting", "organization", "accessories"];

const AdminProductEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [specs, setSpecs] = useState<ProductSpec[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!id) return;
    const [{ data: p }, { data: c }, { data: v }, { data: img }, { data: sp }] = await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order"),
      supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
      supabase.from("product_specs").select("*").eq("product_id", id).order("sort_order"),
    ]);
    setProduct(p);
    setCategories(c ?? []);
    setVariants((v ?? []) as VariantDraft[]);
    setImages(img ?? []);
    setSpecs(sp ?? []);
  };

  useEffect(() => {
    load();
  }, [id]);

  const update = (patch: Partial<ProductRow>) => setProduct((p) => (p ? { ...p, ...patch } : p));

  const save = async () => {
    if (!product) return;
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        name: product.name,
        slug: product.slug,
        description: product.description,
        short_description: product.short_description,
        price_cents: product.price_cents,
        compare_at_cents: product.compare_at_cents,
        primary_image: product.primary_image,
        stock_count: product.stock_count,
        is_active: product.is_active,
        is_featured: product.is_featured,
        bundle_savings_eligible: product.bundle_savings_eligible,
        category_id: product.category_id,
        setup_group: product.setup_group,
        badges: product.badges,
      })
      .eq("id", product.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product saved");
  };

  const remove = async () => {
    if (!product) return;
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product deleted");
    navigate("/admin/products");
  };

  // ─── Images ──────────────────────────────────────────────────
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${product.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    });
    if (upErr) {
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    const url = pub.publicUrl;
    const { data: row } = await supabase
      .from("product_images")
      .insert({
        product_id: product.id,
        url,
        sort_order: images.length,
      })
      .select()
      .single();
    if (row) setImages((prev) => [...prev, row]);
    if (!product.primary_image || product.primary_image === "/placeholder.svg") {
      await supabase.from("products").update({ primary_image: url }).eq("id", product.id);
      update({ primary_image: url });
    }
    if (fileRef.current) fileRef.current.value = "";
    toast.success("Image uploaded");
  };

  const setPrimary = async (url: string) => {
    if (!product) return;
    await supabase.from("products").update({ primary_image: url }).eq("id", product.id);
    update({ primary_image: url });
    toast.success("Primary image updated");
  };

  const deleteImage = async (img: ProductImage) => {
    await supabase.from("product_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((x) => x.id !== img.id));
  };

  // ─── Variants ────────────────────────────────────────────────
  const addVariant = async () => {
    if (!product) return;
    const { data } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        axis: "Color",
        option_key: `opt-${Date.now()}`,
        option_label: "New option",
        price_delta_cents: 0,
        stock_count: 0,
        sort_order: variants.length,
      })
      .select()
      .single();
    if (data) setVariants((v) => [...v, data as VariantDraft]);
  };

  const updateVariant = (vid: string, patch: Partial<VariantDraft>) =>
    setVariants((prev) => prev.map((v) => (v.id === vid ? { ...v, ...patch } : v)));

  const saveVariant = async (v: VariantDraft) => {
    const { error } = await supabase
      .from("product_variants")
      .update({
        axis: v.axis,
        option_key: v.option_key,
        option_label: v.option_label,
        swatch: v.swatch,
        price_delta_cents: Number(v.price_delta_cents) || 0,
        stock_count: Number(v.stock_count) || 0,
      })
      .eq("id", v.id);
    if (error) toast.error(error.message);
    else toast.success("Variant saved");
  };

  const deleteVariant = async (vid: string) => {
    await supabase.from("product_variants").delete().eq("id", vid);
    setVariants((prev) => prev.filter((v) => v.id !== vid));
  };

  // ─── Specs ───────────────────────────────────────────────────
  const addSpec = async () => {
    if (!product) return;
    const { data } = await supabase
      .from("product_specs")
      .insert({
        product_id: product.id,
        label: "Label",
        value: "Value",
        sort_order: specs.length,
      })
      .select()
      .single();
    if (data) setSpecs((s) => [...s, data]);
  };

  const updateSpec = (sid: string, patch: Partial<ProductSpec>) =>
    setSpecs((prev) => prev.map((s) => (s.id === sid ? { ...s, ...patch } : s)));

  const saveSpec = async (s: ProductSpec) => {
    await supabase
      .from("product_specs")
      .update({ label: s.label, value: s.value })
      .eq("id", s.id);
  };

  const deleteSpec = async (sid: string) => {
    await supabase.from("product_specs").delete().eq("id", sid);
    setSpecs((prev) => prev.filter((s) => s.id !== sid));
  };

  if (!product) return <p className="text-sm text-muted-foreground">Loading product…</p>;

  return (
    <>
      <Link
        to="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-muted-foreground link-underline"
      >
        <ArrowLeft className="h-3 w-3" /> All products
      </Link>

      <AdminPageHeader
        eyebrow="Edit product"
        title={product.name || "Untitled"}
        description={product.is_active ? "Live on storefront." : "Draft — not yet published."}
        actions={
          <>
            <Button variant="outline" onClick={remove}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* Basics */}
          <Section title="Basics">
            <Field label="Name">
              <Input value={product.name} onChange={(e) => update({ name: e.target.value })} />
            </Field>
            <Field label="Slug">
              <Input value={product.slug} onChange={(e) => update({ slug: e.target.value })} />
            </Field>
            <Field label="Short description">
              <Textarea
                rows={2}
                value={product.short_description ?? ""}
                onChange={(e) => update({ short_description: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={6}
                value={product.description ?? ""}
                onChange={(e) => update({ description: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                  value={product.category_id ?? ""}
                  onChange={(e) => update({ category_id: e.target.value || null })}
                >
                  <option value="">— None —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Setup group">
                <select
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                  value={product.setup_group}
                  onChange={(e) => update({ setup_group: e.target.value as SetupGroup })}
                >
                  {SETUP_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Badges (comma separated)">
              <Input
                value={product.badges.join(", ")}
                onChange={(e) =>
                  update({ badges: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })
                }
              />
            </Field>
          </Section>

          {/* Images */}
          <Section title="Images">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img) => (
                <div key={img.id} className="group relative">
                  <img
                    src={img.url}
                    alt=""
                    className={`aspect-square w-full rounded-sm border object-cover ${
                      product.primary_image === img.url
                        ? "border-foreground"
                        : "border-border"
                    }`}
                  />
                  <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setPrimary(img.url)}
                      className="rounded-sm bg-background/95 px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
                    >
                      {product.primary_image === img.url ? "Primary" : "Set primary"}
                    </button>
                    <button
                      onClick={() => deleteImage(img)}
                      className="rounded-sm bg-destructive p-1.5 text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-border text-xs text-muted-foreground hover:bg-muted/30">
                <Upload className="h-4 w-4" />
                Upload
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onUpload}
                />
              </label>
            </div>
            <Field label="Primary image URL (manual)">
              <Input
                value={product.primary_image}
                onChange={(e) => update({ primary_image: e.target.value })}
              />
            </Field>
          </Section>

          {/* Variants */}
          <Section
            title="Variants"
            action={
              <Button variant="outline" size="sm" onClick={addVariant}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add variant
              </Button>
            }
          >
            {variants.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No variants. The product will be sold as-is.
              </p>
            )}
            {variants.length > 0 && (
              <div className="hidden grid-cols-[80px_1fr_100px_90px_70px_auto] items-center gap-2 px-3 pb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:grid">
                <span>Axis</span>
                <span>Label</span>
                <span>Key</span>
                <span>Δ price ¢</span>
                <span>Stock</span>
                <span />
              </div>
            )}
            <div className="space-y-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="grid grid-cols-2 items-center gap-2 border border-border bg-surface/40 p-3 text-sm sm:grid-cols-[80px_1fr_100px_90px_70px_auto]"
                >
                  <LabeledMobile label="Axis">
                    <Input
                      value={v.axis}
                      onChange={(e) => updateVariant(v.id, { axis: e.target.value })}
                      placeholder="Color"
                    />
                  </LabeledMobile>
                  <LabeledMobile label="Label" className="col-span-2 sm:col-span-1">
                    <Input
                      value={v.option_label}
                      onChange={(e) => updateVariant(v.id, { option_label: e.target.value })}
                      placeholder="Graphite"
                    />
                  </LabeledMobile>
                  <LabeledMobile label="Key">
                    <Input
                      value={v.option_key}
                      onChange={(e) => updateVariant(v.id, { option_key: e.target.value })}
                      placeholder="graphite"
                    />
                  </LabeledMobile>
                  <LabeledMobile label="Δ ¢">
                    <Input
                      type="number"
                      value={v.price_delta_cents}
                      onChange={(e) => updateVariant(v.id, { price_delta_cents: e.target.value })}
                      placeholder="0"
                    />
                  </LabeledMobile>
                  <LabeledMobile label="Stock">
                    <Input
                      type="number"
                      value={v.stock_count}
                      onChange={(e) => updateVariant(v.id, { stock_count: e.target.value })}
                      placeholder="0"
                    />
                  </LabeledMobile>
                  <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
                    <Button size="sm" variant="outline" onClick={() => saveVariant(v)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteVariant(v.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Specs */}
          <Section
            title="Specs"
            action={
              <Button variant="outline" size="sm" onClick={addSpec}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add spec
              </Button>
            }
          >
            {specs.length === 0 && (
              <p className="text-sm text-muted-foreground">No technical specs added.</p>
            )}
            <div className="space-y-2">
              {specs.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-1 items-center gap-2 border border-border bg-surface/40 p-3 text-sm sm:grid-cols-[160px_1fr_auto]"
                >
                  <LabeledMobile label="Label">
                    <Input
                      value={s.label}
                      onChange={(e) => updateSpec(s.id, { label: e.target.value })}
                      placeholder="Material"
                    />
                  </LabeledMobile>
                  <LabeledMobile label="Value">
                    <Input
                      value={s.value}
                      onChange={(e) => updateSpec(s.id, { value: e.target.value })}
                      placeholder="Anodized aluminum"
                    />
                  </LabeledMobile>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => saveSpec(s)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteSpec(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Section title="Pricing & stock">
            <Field label="Price (cents)">
              <Input
                type="number"
                value={product.price_cents}
                onChange={(e) => update({ price_cents: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Compare at (cents)">
              <Input
                type="number"
                value={product.compare_at_cents ?? ""}
                onChange={(e) =>
                  update({
                    compare_at_cents: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Stock">
              <Input
                type="number"
                value={product.stock_count}
                onChange={(e) => update({ stock_count: Math.max(0, Number(e.target.value) || 0) })}
              />
            </Field>
          </Section>

          <Section title="Visibility">
            <Toggle
              label="Active (visible on storefront)"
              checked={product.is_active}
              onChange={(v) => update({ is_active: v })}
            />
            <Toggle
              label="Featured on homepage"
              checked={product.is_featured}
              onChange={(v) => update({ is_featured: v })}
            />
            <Toggle
              label="Eligible for bundle savings"
              checked={product.bundle_savings_eligible}
              onChange={(v) => update({ bundle_savings_eligible: v })}
            />
          </Section>

          <Section title="Reputation">
            <p className="text-sm text-muted-foreground">
              {product.review_count} review{product.review_count === 1 ? "" : "s"} · avg{" "}
              {Number(product.rating).toFixed(1)} / 5
            </p>
          </Section>
        </aside>
      </div>
    </>
  );
};

const Section = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="border border-border bg-background p-5">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="eyebrow">{title}</h2>
      {action}
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </span>
    {children}
  </label>
);

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between border border-border bg-surface/40 px-3 py-2 text-left text-sm"
  >
    <span>{label}</span>
    <span
      className={`inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-foreground" : "bg-border"
      }`}
    >
      <span
        className={`h-4 w-4 transform rounded-full bg-background transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </span>
  </button>
);

const LabeledMobile = ({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={className}>
    <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:hidden">
      {label}
    </span>
    {children}
  </div>
);

export default AdminProductEditor;

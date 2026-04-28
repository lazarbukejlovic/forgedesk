import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "./imageMap";
import type { Bundle, Category, Product, ProductVariantAxis, SetupGroup } from "./types";

// ---------- DB row → domain object mappers ----------

interface DbProductRow {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  setup_group: SetupGroup;
  price_cents: number;
  compare_at_cents: number | null;
  primary_image: string;
  badges: string[] | null;
  compatibility: string[] | null;
  bundle_savings_eligible: boolean;
  stock_count: number;
  rating: number;
  review_count: number;
  is_featured: boolean;
  category: { slug: string; name: string } | null;
  product_variants: {
    id: string;
    axis: string;
    option_key: string;
    option_label: string;
    swatch: string | null;
    price_delta_cents: number;
    stock_count: number;
    sort_order: number;
  }[];
  product_specs: { label: string; value: string; sort_order: number }[];
}

const toProduct = (row: DbProductRow): Product => {
  // Group variants by axis, preserving sort_order
  const axesMap = new Map<string, ProductVariantAxis>();
  for (const v of [...row.product_variants].sort((a, b) => a.sort_order - b.sort_order)) {
    if (!axesMap.has(v.axis)) axesMap.set(v.axis, { name: v.axis, options: [] });
    axesMap.get(v.axis)!.options.push({
      id: v.id,
      optionKey: v.option_key,
      label: v.option_label,
      swatch: v.swatch ?? undefined,
      priceDeltaCents: v.price_delta_cents,
      stockCount: v.stock_count,
    });
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    categorySlug: row.category?.slug ?? null,
    categoryName: row.category?.name ?? null,
    setupGroup: row.setup_group,
    priceCents: row.price_cents,
    compareAtCents: row.compare_at_cents,
    image: resolveImage(row.primary_image),
    primaryImageKey: row.primary_image,
    variants: Array.from(axesMap.values()),
    specs: [...row.product_specs]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({ label: s.label, value: s.value })),
    inStock: row.stock_count > 0,
    stockCount: row.stock_count,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    badges: row.badges ?? [],
    bundleSavingsEligible: row.bundle_savings_eligible,
    compatibility: row.compatibility ?? [],
    isFeatured: row.is_featured,
  };
};

const PRODUCT_SELECT = `
  id, slug, name, short_description, description, setup_group, price_cents, compare_at_cents,
  primary_image, badges, compatibility, bundle_savings_eligible, stock_count, rating, review_count,
  is_featured,
  category:categories ( slug, name ),
  product_variants ( id, axis, option_key, option_label, swatch, price_delta_cents, stock_count, sort_order ),
  product_specs ( label, value, sort_order )
`;

// ---------- Hooks ----------

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name, tagline, sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline ?? "",
        sortOrder: c.sort_order,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return ((data as unknown as DbProductRow[]) ?? []).map(toProduct);
    },
    staleTime: 60 * 1000,
  });

export const useProductBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ["product", slug],
    enabled: !!slug,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data ? toProduct(data as unknown as DbProductRow) : null;
    },
  });

interface DbBundleRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  image: string;
  discount_pct: number;
  is_featured: boolean;
  bundle_products: { product_id: string; sort_order: number }[];
}

const toBundle = (row: DbBundleRow): Bundle => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  tagline: row.tagline ?? "",
  image: resolveImage(row.image),
  bundleDiscountPct: Number(row.discount_pct),
  isFeatured: row.is_featured,
  productIds: [...row.bundle_products]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((bp) => bp.product_id),
});

export const useBundles = () =>
  useQuery({
    queryKey: ["bundles"],
    queryFn: async (): Promise<Bundle[]> => {
      const { data, error } = await supabase
        .from("bundles")
        .select("id, slug, name, tagline, image, discount_pct, is_featured, bundle_products(product_id, sort_order)")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return ((data as unknown as DbBundleRow[]) ?? []).map(toBundle);
    },
    staleTime: 5 * 60 * 1000,
  });

export const useBundleBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ["bundle", slug],
    enabled: !!slug,
    queryFn: async (): Promise<Bundle | null> => {
      const { data, error } = await supabase
        .from("bundles")
        .select("id, slug, name, tagline, image, discount_pct, is_featured, bundle_products(product_id, sort_order)")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data ? toBundle(data as unknown as DbBundleRow) : null;
    },
  });


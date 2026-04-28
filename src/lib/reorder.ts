import { supabase } from "@/integrations/supabase/client";
import { useCart, type CartLine } from "@/stores/cart";
import { toast } from "sonner";

interface OrderItemRow {
  product_id: string | null;
  product_name: string;
  variant_label: string;
  quantity: number;
  bundle_name: string | null;
}

interface ReorderOutcome {
  added: number;
  skipped: { name: string; reason: string }[];
}

/**
 * Re-add the items of a past order to the active cart.
 * - Skips items whose product was deleted, deactivated, or out of stock.
 * - Re-resolves the variant by matching on variant_label (best-effort).
 * - Uses current product price (not historical) so stock & pricing stay correct.
 */
export const reorderById = async (orderId: string): Promise<ReorderOutcome> => {
  const { data: items, error } = await supabase
    .from("order_items")
    .select("product_id, product_name, variant_label, quantity, bundle_name")
    .eq("order_id", orderId);

  if (error || !items?.length) {
    toast.error("Could not load order items");
    return { added: 0, skipped: [] };
  }

  const productIds = Array.from(
    new Set(items.map((i) => i.product_id).filter((id): id is string => !!id)),
  );

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, price_cents, stock_count, is_active, product_variants(id, axis, option_key, option_label, price_delta_cents, stock_count)",
    )
    .in("id", productIds);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const linesToAdd: CartLine[] = [];
  const skipped: ReorderOutcome["skipped"] = [];

  for (const it of items as OrderItemRow[]) {
    if (!it.product_id) {
      skipped.push({ name: it.product_name, reason: "no longer available" });
      continue;
    }
    const product = productMap.get(it.product_id);
    if (!product || !product.is_active) {
      skipped.push({ name: it.product_name, reason: "no longer available" });
      continue;
    }
    if ((product.stock_count ?? 0) <= 0) {
      skipped.push({ name: product.name, reason: "out of stock" });
      continue;
    }

    // Match variant by label, e.g. "Size: Large · Color: Graphite"
    let variantKey = "";
    let variantLabel = it.variant_label ?? "";
    let priceDelta = 0;

    if (it.variant_label) {
      const segments = it.variant_label.split("·").map((s) => s.trim());
      const matchedKeys: string[] = [];
      const matchedLabels: string[] = [];
      for (const seg of segments) {
        const [axisRaw, valueRaw] = seg.split(":").map((s) => s.trim());
        if (!axisRaw || !valueRaw) continue;
        const opt = product.product_variants?.find(
          (v) =>
            v.axis.toLowerCase() === axisRaw.toLowerCase() &&
            v.option_label.toLowerCase() === valueRaw.toLowerCase(),
        );
        if (opt) {
          matchedKeys.push(`${opt.axis}:${opt.option_key}`);
          matchedLabels.push(`${opt.axis}: ${opt.option_label}`);
          priceDelta += opt.price_delta_cents ?? 0;
        }
      }
      if (matchedKeys.length) {
        variantKey = matchedKeys.join("|");
        variantLabel = matchedLabels.join(" · ");
      }
    }

    linesToAdd.push({
      productId: it.product_id,
      variantKey,
      variantLabel,
      quantity: Math.min(it.quantity, product.stock_count),
      unitPriceCents: (product.price_cents ?? 0) + priceDelta,
      bundleId: null,
      bundleName: it.bundle_name ?? null,
    });
  }

  if (linesToAdd.length) {
    await useCart.getState().addMany(linesToAdd);
  }

  if (linesToAdd.length && skipped.length === 0) {
    toast.success(`Added ${linesToAdd.length} ${linesToAdd.length === 1 ? "item" : "items"} to cart`);
  } else if (linesToAdd.length && skipped.length) {
    toast.success(`Added ${linesToAdd.length} to cart`, {
      description: `${skipped.length} item${skipped.length === 1 ? "" : "s"} skipped: ${skipped
        .map((s) => `${s.name} (${s.reason})`)
        .join(", ")}`,
    });
  } else {
    toast.error("Nothing could be re-added", {
      description: skipped.map((s) => `${s.name} — ${s.reason}`).join(", "),
    });
  }

  return { added: linesToAdd.length, skipped };
};

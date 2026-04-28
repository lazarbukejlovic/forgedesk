import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Plus, Save, Trash2 } from "lucide-react";
import { useProducts } from "@/data/catalog";
import type { Product, SetupGroup } from "@/data/types";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const groupConfig: { key: SetupGroup; label: string; description: string; required?: boolean }[] = [
  { key: "surface", label: "Surface", description: "The foundation. A grounded surface for the work.", required: true },
  { key: "stands", label: "Stands & risers", description: "Lift the screen. Lower the strain." },
  { key: "lighting", label: "Lighting", description: "Light that doesn't compete." },
  { key: "organization", label: "Organization", description: "A place for the small things." },
  { key: "accessories", label: "Accessories", description: "The details that finish it." },
];

const tieredDiscount = (count: number) => {
  if (count >= 5) return 0.15;
  if (count >= 4) return 0.12;
  if (count >= 3) return 0.1;
  if (count >= 2) return 0.05;
  return 0;
};

interface SavedSetup {
  id: string;
  name: string;
  items: { product_id: string }[];
}

const Build = () => {
  const { data: products = [] } = useProducts();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [savedSetups, setSavedSetups] = useState<SavedSetup[]>([]);
  const [setupName, setSetupName] = useState("My Setup");
  const addMany = useCart((s) => s.addMany);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const selectedProducts = useMemo(
    () => products.filter((p) => selected[p.id] && p.inStock),
    [products, selected],
  );
  const subtotal = selectedProducts.reduce((s, p) => s + p.priceCents, 0);
  const discountPct = tieredDiscount(selectedProducts.length);
  const discount = Math.round(subtotal * discountPct);
  const total = subtotal - discount;

  // Load user's saved setups
  useEffect(() => {
    if (!user) {
      setSavedSetups([]);
      return;
    }
    supabase
      .from("saved_setups")
      .select("id, name, saved_setup_items(product_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSavedSetups(
          (data ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            items: (s.saved_setup_items ?? []) as { product_id: string }[],
          })),
        );
      });
  }, [user]);

  const saveSetup = async () => {
    if (!user) {
      toast({ title: "Sign in to save your setup", description: "Create an account to keep your builds." });
      return;
    }
    if (selectedProducts.length === 0) return;
    const { data: setup, error } = await supabase
      .from("saved_setups")
      .insert({ user_id: user.id, name: setupName || "My Setup" })
      .select()
      .single();
    if (error || !setup) {
      toast({ title: "Could not save", description: error?.message, variant: "destructive" });
      return;
    }
    const items = selectedProducts.map((p) => ({ setup_id: setup.id, product_id: p.id }));
    await supabase.from("saved_setup_items").insert(items);
    toast({ title: "Setup saved", description: `"${setup.name}" added to your account.` });
    // Refresh
    const { data } = await supabase
      .from("saved_setups")
      .select("id, name, saved_setup_items(product_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSavedSetups(
      (data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        items: (s.saved_setup_items ?? []) as { product_id: string }[],
      })),
    );
  };

  const loadSetup = (setup: SavedSetup) => {
    const next: Record<string, boolean> = {};
    setup.items.forEach((i) => (next[i.product_id] = true));
    setSelected(next);
    setSetupName(setup.name);
  };

  const deleteSetup = async (id: string) => {
    const target = savedSetups.find((x) => x.id === id);
    if (!confirm(`Delete "${target?.name ?? "setup"}"?`)) return;
    const { error } = await supabase.from("saved_setups").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    setSavedSetups((s) => s.filter((x) => x.id !== id));
    toast({ title: "Setup deleted" });
  };

  const addToCart = () => {
    if (selectedProducts.length === 0) return;
    const lines = selectedProducts.map((p) => {
      const variantKey =
        p.variants.map((v) => `${v.name}:${v.options[0].optionKey}`).join("|") || "default";
      const variantLabel = p.variants.map((v) => v.options[0].label).join(" · ");
      const discountedUnit = Math.round(p.priceCents * (1 - discountPct));
      return {
        productId: p.id,
        variantKey: `setup|${variantKey}`,
        variantLabel,
        quantity: 1,
        unitPriceCents: discountedUnit,
        bundleName: `Custom Setup · ${selectedProducts.length} pieces`,
      };
    });
    addMany(lines);
  };

  return (
    <div>
      <header className="border-b border-border bg-surface py-16 md:py-24">
        <div className="container-editorial">
          <span className="eyebrow">Build Your Setup</span>
          <h1 className="mt-3 font-display text-4xl font-medium leading-[1] tracking-tightest md:text-6xl">
            Compose your desk,
            <br />
            piece by piece.
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Start with a surface. Add what you need. We'll calculate your bundle savings as you go —
            up to 15% on five or more pieces.
          </p>
        </div>
      </header>

      <div className="container-editorial grid gap-12 py-12 lg:grid-cols-[1fr,360px]">
        <div className="space-y-16">
          {groupConfig.map((group) => {
            const groupProducts = products.filter((p) => p.setupGroup === group.key);
            if (groupProducts.length === 0) return null;
            return (
              <section key={group.key}>
                <div className="mb-6 flex items-end justify-between gap-6 border-b border-border pb-3">
                  <div>
                    <span className="eyebrow">
                      {group.label}
                      {group.required && " · Recommended"}
                    </span>
                    <h2 className="mt-1 font-display text-2xl tracking-tightest md:text-3xl">
                      {group.description}
                    </h2>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {groupProducts.map((p) => (
                    <SetupCard
                      key={p.id}
                      product={p}
                      selected={!!selected[p.id]}
                      onToggle={() => toggle(p.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start space-y-6">
          <div className="border border-border bg-surface p-6">
            <span className="eyebrow">Your setup</span>
            <input
              type="text"
              value={setupName}
              onChange={(e) => setSetupName(e.target.value)}
              className="mt-2 w-full border-b border-border bg-transparent pb-1 font-display text-2xl tracking-tightest focus:border-foreground focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedProducts.length === 0
                ? "Nothing selected"
                : `${selectedProducts.length} ${selectedProducts.length === 1 ? "piece" : "pieces"}`}
            </p>

            {selectedProducts.length > 0 && (
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {selectedProducts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden bg-background">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-display">{p.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatPrice(p.priceCents)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Bundle savings {discountPct > 0 && `(${(discountPct * 100).toFixed(0)}%)`}
                </dt>
                <dd className="tabular-nums text-accent">−{formatPrice(discount)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="font-display text-base">Setup total</dt>
                <dd className="font-display text-base tabular-nums">{formatPrice(total)}</dd>
              </div>
            </dl>

            <div className="mt-3 grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((tier) => (
                <div
                  key={tier}
                  className={cn(
                    "h-1 transition-colors",
                    selectedProducts.length >= tier ? "bg-foreground" : "bg-border",
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedProducts.length < 5
                ? `Add ${5 - selectedProducts.length} more for max 15% off`
                : "Maximum bundle discount unlocked."}
            </p>

            <Button size="lg" className="mt-6 w-full" disabled={selectedProducts.length === 0} onClick={addToCart}>
              Add setup to cart
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              disabled={selectedProducts.length === 0}
              onClick={saveSetup}
            >
              <Save className="h-3.5 w-3.5" /> Save setup
            </Button>
            <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
              <Link to="/cart">View cart</Link>
            </Button>
          </div>

          {user && savedSetups.length > 0 && (
            <div className="border border-border bg-surface p-6">
              <span className="eyebrow">Saved setups</span>
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {savedSetups.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => loadSetup(s)}
                      className="text-left hover:text-foreground"
                    >
                      <span className="font-display">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {s.items.length} {s.items.length === 1 ? "piece" : "pieces"}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete setup"
                      onClick={() => deleteSetup(s.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

const SetupCard = ({
  product,
  selected,
  onToggle,
}: {
  product: Product;
  selected: boolean;
  onToggle: () => void;
}) => (
  <motion.button
    type="button"
    onClick={onToggle}
    disabled={!product.inStock}
    whileTap={{ scale: 0.99 }}
    className={cn(
      "group relative flex flex-col text-left transition-colors",
      "border bg-background",
      selected ? "border-foreground" : "border-border hover:border-foreground/40",
      !product.inStock && "opacity-50 cursor-not-allowed",
    )}
  >
    <div className="aspect-[4/3] w-full overflow-hidden bg-surface">
      <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
    </div>
    <div className="flex flex-1 flex-col gap-1.5 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-display text-base">{product.name}</h4>
        <span className="text-sm tabular-nums">{formatPrice(product.priceCents)}</span>
      </div>
      <p className="text-xs text-muted-foreground">{product.shortDescription}</p>
    </div>
    <span
      className={cn(
        "absolute right-3 top-3 flex h-8 w-8 items-center justify-center transition-colors",
        selected ? "bg-foreground text-background" : "bg-background text-foreground border border-border",
      )}
    >
      {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
    </span>
  </motion.button>
);

export default Build;

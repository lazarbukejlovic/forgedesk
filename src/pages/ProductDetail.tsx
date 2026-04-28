import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, Minus, Plus, Truck, RotateCcw, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useProductBySlug, useProducts } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/Rating";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReviewsSection } from "@/components/ReviewsSection";
import NotFound from "./NotFound";

const ProductDetail = () => {
  const { slug } = useParams();
  const { data: product, isLoading } = useProductBySlug(slug);
  const { data: products = [] } = useProducts();

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const wishlisted = useWishlist((s) => s.productIds.includes(product?.id ?? ""));
  const toggleWishlist = useWishlist((s) => s.toggle);
  const add = useCart((s) => s.add);

  // Initialize variant selection once product loads
  useMemo(() => {
    if (product && Object.keys(selected).length === 0 && product.variants.length > 0) {
      const initial: Record<string, string> = {};
      product.variants.forEach((v) => {
        initial[v.name] = v.options[0].optionKey;
      });
      setSelected(initial);
    }
  }, [product, selected]);

  const variantPriceDelta = useMemo(
    () =>
      (product?.variants ?? []).reduce((sum, v) => {
        const opt = v.options.find((o) => o.optionKey === selected[v.name]);
        return sum + (opt?.priceDeltaCents ?? 0);
      }, 0),
    [product?.variants, selected],
  );

  if (isLoading) {
    return (
      <div className="container-editorial py-32 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!product) return <NotFound />;

  const unitPrice = product.priceCents + variantPriceDelta;
  const variantKey = Object.entries(selected)
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  const variantLabel = product.variants
    .map((v) => v.options.find((o) => o.optionKey === selected[v.name])?.label)
    .filter(Boolean)
    .join(" · ");

  const handleAdd = () => {
    add({
      productId: product.id,
      variantKey,
      variantLabel,
      quantity,
      unitPriceCents: unitPrice,
    });
  };

  const related = products
    .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
    .slice(0, 4);

  return (
    <div>
      <div className="container-editorial pt-8 text-xs text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">
          Shop
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </div>

      <section className="container-editorial grid gap-12 py-10 lg:grid-cols-[1.2fr,1fr] lg:gap-20 lg:py-14">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-surface"
        >
          <div className="aspect-square w-full overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
              width={1024}
              height={1024}
            />
          </div>
        </motion.div>

        <div className="flex flex-col">
          {product.badges.length > 0 && (
            <div className="mb-3 flex gap-2">
              {product.badges.map((b) => (
                <span
                  key={b}
                  className="bg-foreground px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-background"
                >
                  {b}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-display text-4xl font-medium leading-[1] tracking-tightest md:text-5xl">
            {product.name}
          </h1>
          <Rating value={product.rating} count={product.reviewCount} className="mt-4" />

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-3xl tabular-nums">{formatPrice(unitPrice)}</span>
            {product.compareAtCents && (
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                {formatPrice(product.compareAtCents)}
              </span>
            )}
          </div>

          {product.variants.map((v) => (
            <div key={v.name} className="mt-8">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="eyebrow">{v.name}</span>
                <span className="text-sm">
                  {v.options.find((o) => o.optionKey === selected[v.name])?.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {v.options.map((o) => {
                  const isActive = selected[v.name] === o.optionKey;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelected((s) => ({ ...s, [v.name]: o.optionKey }))}
                      className={cn(
                        "border px-4 py-2 text-sm transition-colors",
                        isActive
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground hover:border-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {o.swatch && (
                          <span
                            className="inline-block h-3 w-3 border border-border"
                            style={{ backgroundColor: o.swatch }}
                          />
                        )}
                        {o.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-8 flex items-center gap-2 text-sm">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5",
                product.inStock ? "bg-foreground" : "bg-destructive",
              )}
            />
            <span className="text-muted-foreground">
              {product.inStock
                ? `In stock · ${product.stockCount} ready to ship`
                : "Currently sold out"}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-stretch gap-3">
            <div className="inline-flex items-center border border-border">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-12 w-12 items-center justify-center hover:bg-surface"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(product.stockCount || 99, q + 1))}
                className="flex h-12 w-12 items-center justify-center hover:bg-surface"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <Button
              size="lg"
              disabled={!product.inStock}
              onClick={handleAdd}
              className="flex-1 min-w-[200px]"
            >
              {product.inStock ? "Add to cart" : "Sold out"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              aria-label="Wishlist"
              onClick={() => toggleWishlist(product.id)}
              className="px-5"
            >
              <Heart className={cn("h-4 w-4", wishlisted && "fill-current")} />
            </Button>
          </div>

          <div className="mt-8 grid gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-foreground" /> Free worldwide shipping over $200
            </span>
            <span className="flex items-center gap-3">
              <RotateCcw className="h-4 w-4 text-foreground" /> 30-day no-questions returns
            </span>
            <span className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-foreground" /> Lifetime craftsmanship guarantee
            </span>
          </div>

          {product.compatibility.length > 0 && (
            <div className="mt-6 border border-border bg-surface p-4 text-xs">
              <p className="eyebrow mb-2">Pairs with</p>
              <ul className="space-y-1 text-muted-foreground">
                {product.compatibility.map((c) => (
                  <li key={c}>— {c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* SPECS */}
      {product.specs.length > 0 && (
        <section className="border-y border-border bg-surface py-16">
          <div className="container-editorial grid gap-12 lg:grid-cols-2">
            <div>
              <span className="eyebrow">Specifications</span>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tightest md:text-4xl">
                The detail.
              </h2>
            </div>
            <dl className="divide-y divide-border border-y border-border">
              {product.specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[140px,1fr] gap-6 py-4 text-sm">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* REVIEWS */}
      <ReviewsSection productId={product.id} />

      {/* RELATED */}
      {related.length > 0 && (
        <section className="container-editorial pb-20">
          <span className="eyebrow">Complete the setup</span>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tightest md:text-4xl">
            You may also consider.
          </h2>
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;

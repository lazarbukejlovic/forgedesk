import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useBundleBySlug, useProducts } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/stores/cart";
import NotFound from "./NotFound";

const BundleDetail = () => {
  const { slug } = useParams();
  const { data: bundle, isLoading } = useBundleBySlug(slug);
  const { data: products = [] } = useProducts();
  const addMany = useCart((s) => s.addMany);

  if (isLoading) {
    return (
      <div className="container-editorial py-32 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!bundle) return <NotFound />;

  const items = bundle.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const total = items.reduce((s, p) => s + p.priceCents, 0);
  const final = Math.round(total * (1 - bundle.bundleDiscountPct));
  const savings = total - final;

  const addBundle = () => {
    addMany(
      items.map((p) => {
        const variantKey =
          p.variants.map((v) => `${v.name}:${v.options[0].optionKey}`).join("|") || "default";
        const variantLabel = p.variants.map((v) => v.options[0].label).join(" · ");
        const discounted = Math.round(p.priceCents * (1 - bundle.bundleDiscountPct));
        return {
          productId: p.id,
          variantKey: `bundle:${bundle.id}|${variantKey}`,
          variantLabel,
          quantity: 1,
          unitPriceCents: discounted,
          bundleId: bundle.id,
          bundleName: bundle.name,
        };
      }),
    );
  };

  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="container-editorial grid gap-10 py-14 lg:grid-cols-[1.1fr,1fr] lg:items-center lg:py-20">
          <div className="aspect-[5/4] overflow-hidden bg-background">
            <img src={bundle.image} alt={bundle.name} className="h-full w-full object-cover" />
          </div>
          <div>
            <span className="eyebrow">Bundle</span>
            <h1 className="mt-3 font-display text-5xl font-medium leading-[1] tracking-tightest md:text-7xl">
              {bundle.name}
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">{bundle.tagline}</p>

            <div className="mt-8 flex items-baseline gap-3">
              <span className="font-display text-3xl tabular-nums">{formatPrice(final)}</span>
              <span className="text-base text-muted-foreground line-through tabular-nums">
                {formatPrice(total)}
              </span>
              <span className="text-xs uppercase tracking-[0.16em] text-accent">
                Save {formatPrice(savings)}
              </span>
            </div>

            <Button size="lg" className="mt-8" onClick={addBundle} disabled={items.length === 0}>
              Add bundle to cart <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="container-editorial py-16">
        <span className="eyebrow">Inside the bundle</span>
        <h2 className="mt-3 font-display text-3xl tracking-tightest md:text-4xl">
          Each piece, on its own terms.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <Link key={p.id} to={`/product/${p.slug}`} className="group block">
              <div className="aspect-[4/5] overflow-hidden bg-surface">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <h3 className="font-display text-base">{p.name}</h3>
                <span className="text-sm tabular-nums">{formatPrice(p.priceCents)}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.shortDescription}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BundleDetail;

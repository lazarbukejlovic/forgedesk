import { Link } from "react-router-dom";
import { useBundles, useProducts } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";

const Bundles = () => {
  const { data: bundles = [], isLoading } = useBundles();
  const { data: products = [] } = useProducts();

  return (
    <div>
      <header className="border-b border-border bg-surface py-16 md:py-24">
        <div className="container-editorial">
          <span className="eyebrow">Curated bundles</span>
          <h1 className="mt-3 font-display text-4xl font-medium leading-[1] tracking-tightest md:text-6xl">
            Three setups,
            <br />
            ready to ship.
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Our most-loved combinations, assembled by the studio and priced to reward the
            commitment.
          </p>
        </div>
      </header>

      <div className="container-editorial grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[420px] animate-pulse bg-surface" />
            ))
          : bundles.map((b) => {
              const items = b.productIds
                .map((id) => products.find((p) => p.id === id))
                .filter((p): p is NonNullable<typeof p> => Boolean(p));
              const total = items.reduce((s, p) => s + p.priceCents, 0);
              const final = Math.round(total * (1 - b.bundleDiscountPct));
              return (
                <article key={b.id} className="flex flex-col border border-border bg-surface">
                  <Link to={`/bundles/${b.slug}`} className="aspect-[4/3] overflow-hidden">
                    <img
                      src={b.image}
                      alt={b.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display text-xl">{b.name}</h3>
                      <span className="text-xs uppercase tracking-[0.16em] text-accent">
                        Save {(b.bundleDiscountPct * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{b.tagline}</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {items.map((p) => (
                        <li key={p.id}>— {p.name}</li>
                      ))}
                    </ul>
                    <div className="mt-auto flex items-baseline justify-between border-t border-border pt-4">
                      <div>
                        <span className="font-display text-lg tabular-nums">
                          {formatPrice(final)}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground line-through tabular-nums">
                          {formatPrice(total)}
                        </span>
                      </div>
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/bundles/${b.slug}`}>View →</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
      </div>
    </div>
  );
};

export default Bundles;

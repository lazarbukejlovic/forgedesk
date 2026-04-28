import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-desk.jpg";
import lifestyle from "@/assets/lifestyle-workspace.jpg";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { SectionHeader } from "@/components/SectionHeader";
import { useBundles, useCategories, useProducts } from "@/data/catalog";
import { formatPrice } from "@/lib/format";

const Index = () => {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: bundles = [], isLoading: bundlesLoading } = useBundles();
  const { data: categories = [] } = useCategories();

  const featured = products.filter((p) => p.isFeatured).slice(0, 4);
  const newArrivals = [...products]
    .sort((a, b) => Number(b.badges.includes("New")) - Number(a.badges.includes("New")))
    .slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="container-editorial grid gap-10 py-16 md:py-24 lg:grid-cols-[1fr,1.15fr] lg:items-end lg:gap-16 lg:py-32">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="eyebrow"
            >
              Vol. 04 · Winter Collection
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 font-display text-5xl font-medium leading-[0.95] tracking-tightest text-foreground md:text-7xl lg:text-[5.5rem]"
            >
              The desk,
              <br />
              <span className="italic font-normal text-foreground/70">considered.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground"
            >
              Premium objects for the workspace, designed to be used every day for the next ten
              years. No fads. No filler. Just the essentials, made well.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Button asChild size="lg">
                <Link to="/shop">
                  Shop the collection <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/build">Build your setup</Link>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/3] w-full overflow-hidden bg-background"
          >
            <img
              src={heroImg}
              alt="A premium minimalist desk setup with walnut desk, charcoal felt mat, aluminum laptop stand and matte black task lamp"
              className="h-full w-full object-cover"
              width={1920}
              height={1080}
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 bg-gradient-to-t from-foreground/40 to-transparent p-6 text-background">
              <p className="font-display text-sm">The Studio Bundle</p>
              <Link to="/bundles/the-studio" className="text-xs link-underline">
                See the build →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-border py-4">
        <div className="container-editorial flex flex-wrap items-center gap-x-8 gap-y-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-foreground">Shop by category:</span>
          {categories.map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="hover:text-foreground">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-editorial py-20 md:py-28">
        <SectionHeader
          eyebrow="Featured"
          title={
            <>
              Objects that earn
              <br />
              their place.
            </>
          }
          description="The four pieces we'd put on our own desk first. Each one builds on the last."
          action={
            <Button asChild variant="ghost">
              <Link to="/shop">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {productsLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* BUILD YOUR SETUP */}
      <section className="border-y border-border bg-surface py-20 md:py-28">
        <div className="container-editorial grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="aspect-[5/4] overflow-hidden bg-background">
            <img
              src={lifestyle}
              alt="Walnut desk with monitor riser, charcoal mat, and task lamp at golden hour"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <span className="eyebrow">Build Your Setup</span>
            <h2 className="mt-4 font-display text-4xl font-medium leading-[1] tracking-tightest md:text-6xl">
              Your desk, assembled
              <br />
              piece by piece.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Choose a surface, a stand, lighting, and the small things that hold it together.
              We'll calculate your bundle savings and ship it as a single, considered package.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Up to 15% off when you build a complete setup",
                "Compatibility notes for every component",
                "Save your setup to your account",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-2 h-px w-6 bg-foreground" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Button asChild size="lg">
                <Link to="/build">
                  Start building <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* BUNDLES */}
      <section className="container-editorial py-20 md:py-28">
        <SectionHeader
          eyebrow="Curated bundles"
          title="Three setups, ready to ship."
          description="Our most-loved combinations, priced to reward the commitment."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {bundlesLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[420px] animate-pulse bg-surface" />
              ))
            : bundles.map((b, i) => {
                const items = b.productIds
                  .map((id) => products.find((p) => p.id === id))
                  .filter((p): p is NonNullable<typeof p> => Boolean(p));
                const total = items.reduce((s, p) => s + p.priceCents, 0);
                const final = Math.round(total * (1 - b.bundleDiscountPct));
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex flex-col border border-border bg-surface"
                  >
                    <Link to={`/bundles/${b.slug}`} className="aspect-[4/3] overflow-hidden">
                      <img
                        src={b.image}
                        alt={b.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div className="flex items-baseline justify-between gap-3">
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
                        <Link to={`/bundles/${b.slug}`} className="text-sm link-underline">
                          View bundle →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="container-editorial pb-20 md:pb-28">
        <SectionHeader
          eyebrow="New & noted"
          title="Recent additions."
          action={
            <Button asChild variant="ghost">
              <Link to="/shop">
                Browse all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {productsLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : newArrivals.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* VALUES */}
      <section className="border-y border-border bg-foreground py-20 text-background md:py-28">
        <div className="container-editorial grid gap-12 lg:grid-cols-3">
          {[
            {
              title: "Made to outlast.",
              body: "Solid materials, hand-finished joinery, parts you can replace. Designed to age, not expire.",
            },
            {
              title: "Quietly designed.",
              body: "We believe the best objects disappear into the work. Nothing shouts. Nothing distracts.",
            },
            {
              title: "Small batches.",
              body: "We make less, more carefully. Restocks are slow on purpose. Limited runs aren't a marketing tactic.",
            },
          ].map((v) => (
            <div key={v.title}>
              <h3 className="font-display text-2xl md:text-3xl">{v.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-background/70">{v.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;

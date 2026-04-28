import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { useCategories, useProducts } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const Shop = () => {
  const params = useParams();
  const initialCategory = params.slug ?? "all";
  const [category, setCategory] = useState<string>(initialCategory);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [maxPrice, setMaxPrice] = useState(300);
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  const filtered = useMemo(() => {
    let list = products.slice();
    if (category !== "all") list = list.filter((p) => p.categorySlug === category);
    if (query.trim())
      list = list.filter((p) =>
        (p.name + " " + p.shortDescription).toLowerCase().includes(query.toLowerCase()),
      );
    list = list.filter((p) => p.priceCents / 100 <= maxPrice);
    if (inStockOnly) list = list.filter((p) => p.inStock);
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.priceCents - b.priceCents);
        break;
      case "price-desc":
        list.sort((a, b) => b.priceCents - a.priceCents);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "featured":
        list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
        break;
    }
    return list;
  }, [products, category, query, sort, maxPrice, inStockOnly]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div>
      <header className="border-b border-border bg-surface py-16 md:py-20">
        <div className="container-editorial">
          <span className="eyebrow">{activeCategory ? "Category" : "Shop"}</span>
          <h1 className="mt-3 font-display text-4xl font-medium leading-[1] tracking-tightest md:text-6xl">
            {activeCategory ? activeCategory.name : "The full collection."}
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            {activeCategory
              ? activeCategory.tagline
              : "Every object we make, in one place. Filter by category, sort by what matters."}
          </p>
        </div>
      </header>

      <div className="container-editorial grid gap-10 py-12 lg:grid-cols-[240px,1fr]">
        <aside className="space-y-8">
          <div>
            <h3 className="eyebrow mb-3">Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border border-border bg-transparent py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
            </div>
          </div>

          <div>
            <h3 className="eyebrow mb-3">Category</h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <button
                  className={cn(
                    "text-left hover:text-foreground",
                    category === "all" ? "text-foreground" : "text-muted-foreground",
                  )}
                  onClick={() => setCategory("all")}
                >
                  All products
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <button
                    className={cn(
                      "text-left hover:text-foreground",
                      category === c.slug ? "text-foreground" : "text-muted-foreground",
                    )}
                    onClick={() => setCategory(c.slug)}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow mb-3">Max price</h3>
            <input
              type="range"
              min={20}
              max={300}
              step={5}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">Up to ${maxPrice}</p>
          </div>

          <div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 accent-foreground"
              />
              In stock only
            </label>
          </div>
        </aside>

        <div>
          <div className="mb-8 flex items-center justify-between border-b border-border pb-4 text-sm">
            <span className="text-muted-foreground">{filtered.length} products</span>
            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="border-none bg-transparent text-foreground focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 border border-border bg-surface px-8 py-20 text-center">
              <p className="font-display text-xl">No products match.</p>
              <p className="text-sm text-muted-foreground">
                Try widening the price range or clearing your search.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setMaxPrice(300);
                  setInStockOnly(false);
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;

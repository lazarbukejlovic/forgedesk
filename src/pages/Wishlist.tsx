import { Link } from "react-router-dom";
import { useWishlist } from "@/stores/wishlist";
import { useProducts } from "@/data/catalog";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

const Wishlist = () => {
  const ids = useWishlist((s) => s.productIds);
  const { data: products = [], isLoading } = useProducts();
  const items = products.filter((p) => ids.includes(p.id));

  return (
    <div className="container-editorial py-14 md:py-20">
      <span className="eyebrow">Saved</span>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-tightest md:text-5xl">
        Wishlist.
      </h1>

      {isLoading ? (
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/5] w-full animate-pulse bg-surface" />
              <div className="h-4 w-3/4 animate-pulse bg-surface" />
              <div className="h-3 w-1/2 animate-pulse bg-surface" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-12 flex flex-col items-start gap-4 border border-border bg-surface p-12">
          <p className="font-display text-xl">Nothing saved yet.</p>
          <p className="text-sm text-muted-foreground">
            Tap the heart on any product to keep it for later.
          </p>
          <Button asChild>
            <Link to="/shop">Browse the shop</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;

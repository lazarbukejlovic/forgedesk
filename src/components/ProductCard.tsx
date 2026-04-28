import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/data/types";
import { formatPrice } from "@/lib/format";
import { Rating } from "./Rating";
import { useWishlist } from "@/stores/wishlist";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: Props) => {
  const wishlisted = useWishlist((s) => s.productIds.includes(product.id));
  const toggleWishlist = useWishlist((s) => s.toggle);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.24), ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col"
    >
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden bg-surface">
        <div className="aspect-[4/5] w-full overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </div>

        {product.badges && product.badges.length > 0 && (
          <div className="absolute left-3 top-3 flex gap-1.5">
            {product.badges.map((b) => (
              <span
                key={b}
                className="bg-background/90 backdrop-blur px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="bg-foreground px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-background">
              Sold out
            </span>
          </div>
        )}
      </Link>

      <button
        type="button"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
        }}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-background/90 backdrop-blur text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        <Heart className={cn("h-4 w-4", wishlisted && "fill-current")} />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-base font-medium text-foreground">
            <Link to={`/product/${product.slug}`} className="link-underline">
              {product.name}
            </Link>
          </h3>
          <span className="font-display text-base text-foreground tabular-nums">
            {formatPrice(product.priceCents)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{product.shortDescription}</p>
        <Rating value={product.rating} count={product.reviewCount} className="mt-1" />
      </div>
    </motion.article>
  );
};

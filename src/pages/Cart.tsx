import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/data/catalog";
import { formatPrice } from "@/lib/format";

const Cart = () => {
  const { lines, setQuantity, remove, subtotalCents, isHydrating } = useCart();
  const { data: products = [] } = useProducts();
  const subtotal = subtotalCents();
  const shipping = subtotal === 0 ? 0 : subtotal >= 15000 ? 0 : 900;
  const total = subtotal + shipping;

  return (
    <div className="container-editorial py-14 md:py-20">
      <h1 className="font-display text-4xl font-medium tracking-tightest md:text-5xl">Cart.</h1>

      {isHydrating && lines.length === 0 ? (
        <div className="mt-12 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-6 border-b border-border py-6">
              <div className="h-28 w-28 shrink-0 animate-pulse bg-surface" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-48 animate-pulse bg-surface" />
                <div className="h-3 w-24 animate-pulse bg-surface" />
              </div>
            </div>
          ))}
        </div>
      ) : lines.length === 0 ? (
        <div className="mt-12 flex flex-col items-start gap-4 border border-border bg-surface p-12">
          <p className="font-display text-xl">Your cart is empty.</p>
          <p className="text-sm text-muted-foreground">
            Considered objects, made in small batches.
          </p>
          <Button asChild className="mt-2">
            <Link to="/shop">Browse the shop</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr,1fr]">
          <ul className="divide-y divide-border border-y border-border">
            {lines.map((line) => {
              const product = products.find((p) => p.id === line.productId);
              if (!product) return null;
              return (
                <li key={line.productId + line.variantKey} className="flex gap-6 py-6">
                  <Link
                    to={`/product/${product.slug}`}
                    className="block h-28 w-28 shrink-0 overflow-hidden bg-surface"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <div>
                        <Link to={`/product/${product.slug}`} className="font-display text-base">
                          {product.name}
                        </Link>
                        {line.bundleName && (
                          <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-accent">
                            {line.bundleName}
                          </p>
                        )}
                        {line.variantLabel && (
                          <p className="mt-1 text-xs text-muted-foreground">{line.variantLabel}</p>
                        )}
                      </div>
                      <span className="font-display text-base tabular-nums">
                        {formatPrice(line.unitPriceCents * line.quantity)}
                      </span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="inline-flex items-center border border-border">
                        <button
                          aria-label="Decrease"
                          onClick={() =>
                            setQuantity(line.productId, line.variantKey, line.quantity - 1)
                          }
                          className="flex h-9 w-9 items-center justify-center hover:bg-surface"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-10 text-center text-sm tabular-nums">{line.quantity}</span>
                        <button
                          aria-label="Increase"
                          onClick={() =>
                            setQuantity(line.productId, line.variantKey, line.quantity + 1)
                          }
                          className="flex h-9 w-9 items-center justify-center hover:bg-surface"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(line.productId, line.variantKey)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="self-start border border-border bg-surface p-6">
            <h2 className="font-display text-xl">Order summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="font-display text-base">Estimated total</dt>
                <dd className="font-display text-base tabular-nums">{formatPrice(total)}</dd>
              </div>
            </dl>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link to="/checkout">Checkout</Link>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Free shipping on orders over $150 · Secure payment by Stripe
            </p>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;

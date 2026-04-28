import { Link } from "react-router-dom";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useProducts } from "@/data/catalog";

export const CartDrawer = () => {
  const { isOpen, close, lines, setQuantity, remove, subtotalCents, isHydrating } = useCart();
  const { data: products = [] } = useProducts();
  const subtotal = subtotalCents();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="font-display text-lg">Your Cart</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="text-foreground/70 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isHydrating && lines.length === 0 ? (
              <div className="flex-1 space-y-4 px-6 py-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 animate-pulse bg-surface" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 animate-pulse bg-surface" />
                      <div className="h-3 w-1/3 animate-pulse bg-surface" />
                    </div>
                  </div>
                ))}
              </div>
            ) : lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="font-display text-xl">Your cart is empty.</p>
                <p className="text-sm text-muted-foreground">
                  Considered objects, made in small batches.
                </p>
                <Button onClick={close} asChild className="mt-2">
                  <Link to="/shop">Browse the shop</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <ul className="divide-y divide-border">
                    {lines.map((line) => {
                      const product = products.find((p) => p.id === line.productId);
                      if (!product) return null;
                      return (
                        <li key={line.productId + line.variantKey} className="flex gap-4 py-5">
                          <Link
                            to={`/product/${product.slug}`}
                            onClick={close}
                            className="block h-20 w-20 shrink-0 overflow-hidden bg-surface"
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
                                <Link
                                  to={`/product/${product.slug}`}
                                  onClick={close}
                                  className="font-display text-sm"
                                >
                                  {product.name}
                                </Link>
                                {line.bundleName && (
                                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-accent">
                                    {line.bundleName}
                                  </p>
                                )}
                                {line.variantLabel && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {line.variantLabel}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm tabular-nums">
                                {formatPrice(line.unitPriceCents * line.quantity)}
                              </span>
                            </div>
                            <div className="mt-auto flex items-center justify-between pt-3">
                              <div className="inline-flex items-center border border-border">
                                <button
                                  aria-label="Decrease"
                                  onClick={() =>
                                    setQuantity(line.productId, line.variantKey, line.quantity - 1)
                                  }
                                  className="flex h-8 w-8 items-center justify-center hover:bg-surface"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-8 text-center text-sm tabular-nums">
                                  {line.quantity}
                                </span>
                                <button
                                  aria-label="Increase"
                                  onClick={() =>
                                    setQuantity(line.productId, line.variantKey, line.quantity + 1)
                                  }
                                  className="flex h-8 w-8 items-center justify-center hover:bg-surface"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                aria-label="Remove"
                                onClick={() => remove(line.productId, line.variantKey)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="border-t border-border px-6 py-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-display text-lg tabular-nums">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <div className="mt-5 grid gap-2">
                    <Button asChild size="lg">
                      <Link to="/checkout" onClick={close}>
                        Checkout
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" onClick={close}>
                      <Link to="/cart">View cart</Link>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

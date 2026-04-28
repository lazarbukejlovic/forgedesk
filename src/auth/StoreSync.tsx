import { useEffect, useRef } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";

/**
 * Bridges auth state with our local stores:
 * - On sign-in: merge any guest local items into the user's DB cart/wishlist, then hydrate.
 * - On sign-out: reset local stores.
 */
export const StoreSync = () => {
  const { user, isLoading } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const newId = user?.id ?? null;
    if (newId === lastUserId.current) return;

    if (newId) {
      // Logged in — merge guest state and hydrate from DB
      const hasGuestCart = cart.lines.length > 0;
      const hasGuestWishlist = wishlist.productIds.length > 0;
      if (hasGuestCart) cart.mergeGuestIntoDb(newId);
      else cart.hydrateFromDb(newId);
      if (hasGuestWishlist) wishlist.mergeGuestIntoDb(newId);
      else wishlist.hydrateFromDb(newId);
    } else if (lastUserId.current) {
      // Was logged in, now logged out
      cart.resetToLocal();
      wishlist.resetToLocal();
    }
    lastUserId.current = newId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isLoading]);

  return null;
};

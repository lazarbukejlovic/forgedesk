import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

interface WishlistState {
  productIds: string[];
  isHydrating: boolean;
  toggle: (id: string) => Promise<void>;
  has: (id: string) => boolean;
  clear: () => Promise<void>;
  hydrateFromDb: (userId: string) => Promise<void>;
  mergeGuestIntoDb: (userId: string) => Promise<void>;
  resetToLocal: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => {
      let currentUserId: string | null = null;

      return {
        productIds: [],
        isHydrating: false,

        toggle: async (id) => {
          const has = get().productIds.includes(id);
          set((s) => ({
            productIds: has
              ? s.productIds.filter((x) => x !== id)
              : [...s.productIds, id],
          }));
          if (currentUserId) {
            if (has) {
              await supabase
                .from("wishlist_items")
                .delete()
                .eq("user_id", currentUserId)
                .eq("product_id", id);
            } else {
              await supabase
                .from("wishlist_items")
                .insert({ user_id: currentUserId, product_id: id });
            }
          }
        },

        has: (id) => get().productIds.includes(id),

        clear: async () => {
          set({ productIds: [] });
          if (currentUserId) {
            await supabase.from("wishlist_items").delete().eq("user_id", currentUserId);
          }
        },

        hydrateFromDb: async (userId) => {
          currentUserId = userId;
          set({ isHydrating: true });
          const { data } = await supabase
            .from("wishlist_items")
            .select("product_id")
            .eq("user_id", userId);
          set({
            productIds: data?.map((r) => r.product_id) ?? [],
            isHydrating: false,
          });
        },

        mergeGuestIntoDb: async (userId) => {
          currentUserId = userId;
          const guestIds = get().productIds;
          if (guestIds.length > 0) {
            await supabase
              .from("wishlist_items")
              .upsert(
                guestIds.map((product_id) => ({ user_id: userId, product_id })),
                { onConflict: "user_id,product_id" },
              );
          }
          await get().hydrateFromDb(userId);
        },

        resetToLocal: () => {
          currentUserId = null;
          set({ productIds: [] });
        },
      };
    },
    {
      name: "forgedesk.wishlist.guest",
      partialize: (state) => ({ productIds: state.productIds }),
    },
  ),
);

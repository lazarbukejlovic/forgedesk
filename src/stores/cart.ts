import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

export interface CartLine {
  productId: string;       // uuid
  variantKey: string;      // 'Size:l|Color:graphite' or '' or 'bundle:<id>|...'
  variantLabel: string;
  quantity: number;
  unitPriceCents: number;
  bundleId?: string | null;
  bundleName?: string | null;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  isHydrating: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (line: CartLine) => Promise<void>;
  addMany: (lines: CartLine[]) => Promise<void>;
  setQuantity: (productId: string, variantKey: string, quantity: number) => Promise<void>;
  remove: (productId: string, variantKey: string) => Promise<void>;
  clear: () => Promise<void>;
  subtotalCents: () => number;
  itemCount: () => number;

  // Internal — wired by AuthProvider/CartSync
  hydrateFromDb: (userId: string) => Promise<void>;
  mergeGuestIntoDb: (userId: string) => Promise<void>;
  resetToLocal: () => void;
}

const sameLine = (a: CartLine, productId: string, variantKey: string) =>
  a.productId === productId && a.variantKey === variantKey;

export const useCart = create<CartState>()(
  persist(
    (set, get) => {
      // Track current authed user inside the store so writes know whether to hit DB
      let currentUserId: string | null = null;

      const writeLineToDb = async (line: CartLine) => {
        if (!currentUserId) return;
        // Upsert by (user, product, variant_key, bundle_id) — matched by partial unique index
        const filter = supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", currentUserId)
          .eq("product_id", line.productId)
          .eq("variant_key", line.variantKey);
        const filtered = line.bundleId
          ? filter.eq("bundle_id", line.bundleId)
          : filter.is("bundle_id", null);
        const { data: existing } = await filtered.maybeSingle();
        if (existing) {
          await supabase
            .from("cart_items")
            .update({
              quantity: line.quantity,
              unit_price_cents: line.unitPriceCents,
              variant_label: line.variantLabel,
              bundle_name: line.bundleName ?? null,
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: currentUserId,
            product_id: line.productId,
            variant_key: line.variantKey,
            variant_label: line.variantLabel,
            quantity: line.quantity,
            unit_price_cents: line.unitPriceCents,
            bundle_id: line.bundleId ?? null,
            bundle_name: line.bundleName ?? null,
          });
        }
      };

      const removeFromDb = async (productId: string, variantKey: string) => {
        if (!currentUserId) return;
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", currentUserId)
          .eq("product_id", productId)
          .eq("variant_key", variantKey);
      };

      return {
        lines: [],
        isOpen: false,
        isHydrating: false,
        open: () => set({ isOpen: true }),
        close: () => set({ isOpen: false }),
        toggle: () => set((s) => ({ isOpen: !s.isOpen })),

        add: async (line) => {
          set((s) => {
            const existing = s.lines.find((l) => sameLine(l, line.productId, line.variantKey));
            const lines = existing
              ? s.lines.map((l) =>
                  sameLine(l, line.productId, line.variantKey)
                    ? { ...l, quantity: l.quantity + line.quantity }
                    : l,
                )
              : [...s.lines, line];
            return { lines, isOpen: true };
          });
          const updated = get().lines.find((l) => sameLine(l, line.productId, line.variantKey));
          if (updated) await writeLineToDb(updated);
        },

        addMany: async (newLines) => {
          set((s) => {
            const lines = [...s.lines];
            for (const line of newLines) {
              const i = lines.findIndex((l) => sameLine(l, line.productId, line.variantKey));
              if (i >= 0) lines[i] = { ...lines[i], quantity: lines[i].quantity + line.quantity };
              else lines.push(line);
            }
            return { lines, isOpen: true };
          });
          for (const line of newLines) {
            const updated = get().lines.find((l) => sameLine(l, line.productId, line.variantKey));
            if (updated) await writeLineToDb(updated);
          }
        },

        setQuantity: async (productId, variantKey, quantity) => {
          if (quantity <= 0) {
            set((s) => ({ lines: s.lines.filter((l) => !sameLine(l, productId, variantKey)) }));
            await removeFromDb(productId, variantKey);
            return;
          }
          set((s) => ({
            lines: s.lines.map((l) =>
              sameLine(l, productId, variantKey) ? { ...l, quantity } : l,
            ),
          }));
          const updated = get().lines.find((l) => sameLine(l, productId, variantKey));
          if (updated) await writeLineToDb(updated);
        },

        remove: async (productId, variantKey) => {
          set((s) => ({ lines: s.lines.filter((l) => !sameLine(l, productId, variantKey)) }));
          await removeFromDb(productId, variantKey);
        },

        clear: async () => {
          set({ lines: [] });
          if (currentUserId) {
            await supabase.from("cart_items").delete().eq("user_id", currentUserId);
          }
        },

        subtotalCents: () =>
          get().lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0),
        itemCount: () => get().lines.reduce((n, l) => n + l.quantity, 0),

        hydrateFromDb: async (userId) => {
          currentUserId = userId;
          set({ isHydrating: true });
          const { data } = await supabase
            .from("cart_items")
            .select("*")
            .eq("user_id", userId);
          const lines: CartLine[] =
            data?.map((r) => ({
              productId: r.product_id,
              variantKey: r.variant_key ?? "",
              variantLabel: r.variant_label ?? "",
              quantity: r.quantity,
              unitPriceCents: r.unit_price_cents,
              bundleId: r.bundle_id,
              bundleName: r.bundle_name,
            })) ?? [];
          set({ lines, isHydrating: false });
        },

        mergeGuestIntoDb: async (userId) => {
          currentUserId = userId;
          const guestLines = get().lines;
          // Pull DB cart, then add guest lines on top, then re-hydrate
          for (const line of guestLines) {
            await writeLineToDb(line);
          }
          await get().hydrateFromDb(userId);
        },

        resetToLocal: () => {
          currentUserId = null;
          set({ lines: [] });
        },
      };
    },
    {
      name: "forgedesk.cart.guest",
      // Persist only when we don't have an authed user. We keep all lines locally
      // for guests; once authed, cart is the source of truth.
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

// Resolves the value stored in `products.primary_image` / `bundles.image` to a
// browser-loadable URL. Storage uploads (full URLs) and absolute paths pass
// through; legacy seeded filenames map to bundled Vite assets; anything else
// (or null) falls back to the workspace placeholder.
import deskmat from "@/assets/product-deskmat.jpg";
import stand from "@/assets/product-stand.jpg";
import lamp from "@/assets/product-lamp.jpg";
import riser from "@/assets/product-riser.jpg";
import cables from "@/assets/product-cables.jpg";
import pouch from "@/assets/product-pouch.jpg";
import organizer from "@/assets/product-organizer.jpg";
import keycaps from "@/assets/product-keycaps.jpg";
import bundleFlatlay from "@/assets/bundle-flatlay.jpg";
import placeholder from "@/assets/lifestyle-workspace.jpg";

const map: Record<string, string> = {
  "product-deskmat.jpg": deskmat,
  "product-stand.jpg": stand,
  "product-lamp.jpg": lamp,
  "product-riser.jpg": riser,
  "product-cables.jpg": cables,
  "product-pouch.jpg": pouch,
  "product-organizer.jpg": organizer,
  "product-keycaps.jpg": keycaps,
  "bundle-flatlay.jpg": bundleFlatlay,
};

export const resolveImage = (key: string | null | undefined): string => {
  if (!key) return placeholder;
  if (key.startsWith("http") || key.startsWith("/")) return key;
  return map[key] ?? placeholder;
};

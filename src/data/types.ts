export type SetupGroup =
  | "surface"
  | "stands"
  | "lighting"
  | "organization"
  | "accessories";

export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  sortOrder: number;
}

export interface ProductVariantOption {
  id: string;          // DB row id (uuid)
  optionKey: string;   // 'l', 'graphite'
  label: string;       // 'Large · 110 × 50 cm'
  swatch?: string;
  priceDeltaCents: number;
  stockCount: number;
}

export interface ProductVariantAxis {
  name: string; // 'Size', 'Color', 'Finish'
  options: ProductVariantOption[];
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;                      // uuid
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categorySlug: string | null;
  categoryName: string | null;
  setupGroup: SetupGroup;
  priceCents: number;
  compareAtCents?: number | null;
  image: string;                   // resolved bundled asset URL
  primaryImageKey: string;         // raw filename stored in DB
  variants: ProductVariantAxis[];
  specs: ProductSpec[];
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviewCount: number;
  badges: string[];
  bundleSavingsEligible: boolean;
  compatibility: string[];
  isFeatured: boolean;
}

export interface Bundle {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  productIds: string[];
  image: string;
  bundleDiscountPct: number;
  isFeatured: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

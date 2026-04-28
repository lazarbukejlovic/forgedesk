export const ProductCardSkeleton = () => (
  <div className="flex flex-col">
    <div className="aspect-[4/5] w-full animate-pulse bg-surface" />
    <div className="pt-4 space-y-2">
      <div className="h-4 w-3/4 animate-pulse bg-surface" />
      <div className="h-3 w-1/2 animate-pulse bg-surface" />
    </div>
  </div>
);

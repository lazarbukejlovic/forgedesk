import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const Rating = ({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
    <div className="flex items-center" aria-label={`Rated ${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.round(value) ? "fill-foreground stroke-foreground" : "stroke-muted-foreground",
          )}
        />
      ))}
    </div>
    <span>
      {value.toFixed(1)}
      {count !== undefined && ` · ${count} reviews`}
    </span>
  </div>
);

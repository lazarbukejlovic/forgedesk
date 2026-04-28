import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
}

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
}: Props) => (
  <div
    className={cn(
      "flex flex-col gap-3",
      align === "center" && "items-center text-center",
      action && "md:flex-row md:items-end md:justify-between md:gap-10",
      className,
    )}
  >
    <div className={cn("flex flex-col gap-3", align === "center" && "items-center")}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="font-display text-3xl font-medium leading-[1.05] tracking-tightest md:text-5xl">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-xl text-base text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

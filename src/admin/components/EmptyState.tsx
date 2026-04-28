import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: Props) => (
  <div className="grid place-items-center border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
    <div className="max-w-sm">
      <h3 className="font-display text-xl tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  </div>
);

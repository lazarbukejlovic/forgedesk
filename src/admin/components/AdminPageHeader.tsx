import { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const AdminPageHeader = ({ eyebrow, title, description, actions }: Props) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-2 font-display text-3xl tracking-tightest md:text-4xl">{title}</h1>
      {description && (
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

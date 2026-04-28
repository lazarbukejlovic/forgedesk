interface Props {
  status: string;
}

const STYLES: Record<string, string> = {
  pending: "border-border bg-surface text-muted-foreground",
  paid: "border-foreground/20 bg-foreground text-background",
  fulfilled: "border-foreground/20 bg-foreground text-background",
  shipped: "border-accent/40 bg-accent/10 text-accent",
  delivered: "border-accent bg-accent text-accent-foreground",
  cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
  refunded: "border-destructive/40 bg-destructive/10 text-destructive",
};

export const OrderStatusChip = ({ status }: Props) => (
  <span
    className={`inline-flex items-center border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
      STYLES[status] ?? STYLES.pending
    }`}
  >
    {status}
  </span>
);

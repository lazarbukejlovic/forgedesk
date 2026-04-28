import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

type DiscountRow = Tables<"discount_codes">;
// Numeric inputs may temporarily hold "" while editing.
type DiscountDraft = Omit<
  DiscountRow,
  "percent_off" | "amount_off_cents" | "min_subtotal_cents" | "max_redemptions"
> & {
  percent_off: number | string | null;
  amount_off_cents: number | string | null;
  min_subtotal_cents: number | string;
  max_redemptions: number | string | null;
};

const numOrNull = (v: number | string | null): number | null => {
  if (v === "" || v == null) return null;
  return Number(v);
};

const AdminDiscounts = () => {
  const [rows, setRows] = useState<DiscountDraft[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as DiscountDraft[]);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const code = `NEW${Math.floor(Math.random() * 9000 + 1000)}`;
    const { data, error } = await supabase
      .from("discount_codes")
      .insert({ code, percent_off: 10, is_active: true })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows((r) => [data as DiscountDraft, ...r]);
  };

  const update = (id: string, patch: Partial<DiscountDraft>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = async (r: DiscountDraft) => {
    const { error } = await supabase
      .from("discount_codes")
      .update({
        code: r.code?.trim().toUpperCase(),
        description: r.description,
        percent_off: numOrNull(r.percent_off),
        amount_off_cents: numOrNull(r.amount_off_cents),
        min_subtotal_cents: Number(r.min_subtotal_cents) || 0,
        max_redemptions: numOrNull(r.max_redemptions),
        is_active: r.is_active,
      })
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else toast.success("Code saved");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete code?")) return;
    await supabase.from("discount_codes").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Discounts"
        title="Codes & promotions."
        description="Percent or flat-amount off, with optional minimum and redemption cap."
        actions={
          <Button onClick={create}>
            <Plus className="mr-1.5 h-4 w-4" /> New code
          </Button>
        }
      />

      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="border border-border bg-background p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="Code">
                <Input
                  value={r.code}
                  onChange={(e) => update(r.id, { code: e.target.value })}
                  placeholder="CODE"
                />
              </LabeledField>
              <LabeledField label="Description">
                <Input
                  value={r.description ?? ""}
                  onChange={(e) => update(r.id, { description: e.target.value })}
                  placeholder="What customers see at checkout"
                />
              </LabeledField>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <LabeledField label="% off" hint="Leave blank for flat amount">
                <Input
                  type="number"
                  value={r.percent_off ?? ""}
                  onChange={(e) => update(r.id, { percent_off: e.target.value })}
                  placeholder="10"
                />
              </LabeledField>
              <LabeledField label="Amount off (¢)" hint="Leave blank for percent">
                <Input
                  type="number"
                  value={r.amount_off_cents ?? ""}
                  onChange={(e) => update(r.id, { amount_off_cents: e.target.value })}
                  placeholder="500"
                />
              </LabeledField>
              <LabeledField label="Min subtotal (¢)">
                <Input
                  type="number"
                  value={r.min_subtotal_cents ?? 0}
                  onChange={(e) => update(r.id, { min_subtotal_cents: e.target.value })}
                  placeholder="0"
                />
              </LabeledField>
              <LabeledField label="Max redemptions" hint="Blank = unlimited">
                <Input
                  type="number"
                  value={r.max_redemptions ?? ""}
                  onChange={(e) => update(r.id, { max_redemptions: e.target.value })}
                  placeholder="∞"
                />
              </LabeledField>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-muted-foreground">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={r.is_active}
                    onChange={(e) => update(r.id, { is_active: e.target.checked })}
                  />
                  Active
                </label>
                <span>
                  Redeemed {r.redemption_count}
                  {r.max_redemptions ? ` / ${r.max_redemptions}` : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => save(r)}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No discount codes.</p>
        )}
      </div>
    </>
  );
};

const LabeledField = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {hint && <span className="text-[10px] text-muted-foreground/70">{hint}</span>}
    </div>
    {children}
  </div>
);

export default AdminDiscounts;

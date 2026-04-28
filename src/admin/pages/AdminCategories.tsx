import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { slugify } from "@/lib/format";

type Category = Tables<"categories">;
type CategoryDraft = Omit<Category, "sort_order"> & { sort_order: number | string };

const AdminCategories = () => {
  const [rows, setRows] = useState<CategoryDraft[]>([]);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setRows((data ?? []) as CategoryDraft[]);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const name = "New category";
    const { data, error } = await supabase
      .from("categories")
      .insert({ name, slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 5)}` })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((r) => [...r, data as CategoryDraft]);
  };

  const update = (id: string, patch: Partial<CategoryDraft>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = async (row: CategoryDraft) => {
    const { error } = await supabase
      .from("categories")
      .update({
        name: row.name,
        slug: row.slug,
        tagline: row.tagline,
        sort_order: Number(row.sort_order) || 0,
      })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else toast.success("Category saved");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category? Products will be uncategorized.")) return;
    await supabase.from("categories").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Categories"
        title="How the catalog is organized."
        actions={
          <Button onClick={create}>
            <Plus className="mr-1.5 h-4 w-4" /> New category
          </Button>
        }
      />

      <div className="hidden grid-cols-[1.4fr_1.2fr_2fr_70px_140px] items-center gap-3 px-4 pb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:grid">
        <span>Name</span>
        <span>Slug</span>
        <span>Tagline</span>
        <span>Order</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-1 items-center gap-3 border border-border bg-surface/40 p-3 text-sm md:grid-cols-[1.4fr_1.2fr_2fr_70px_140px]"
          >
            <Input
              value={r.name}
              onChange={(e) => update(r.id, { name: e.target.value })}
              placeholder="Name"
            />
            <Input
              value={r.slug}
              onChange={(e) => update(r.id, { slug: e.target.value })}
              placeholder="slug"
            />
            <Input
              value={r.tagline ?? ""}
              onChange={(e) => update(r.id, { tagline: e.target.value })}
              placeholder="Tagline (optional)"
            />
            <Input
              type="number"
              value={r.sort_order ?? 0}
              onChange={(e) => update(r.id, { sort_order: e.target.value })}
            />
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="outline" onClick={() => save(r)}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        )}
      </div>
    </>
  );
};

export default AdminCategories;

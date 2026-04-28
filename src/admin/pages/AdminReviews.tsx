import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Review = Pick<
  Tables<"reviews">,
  "id" | "product_id" | "rating" | "title" | "body" | "user_id" | "created_at"
>;
type RatingFilter = "all" | "1" | "2" | "3" | "4" | "5";
const RATING_OPTIONS: RatingFilter[] = ["all", "5", "4", "3", "2", "1"];

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productNameById, setProductNameById] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<RatingFilter>("all");
  const [query, setQuery] = useState("");

  const load = async () => {
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase
        .from("reviews")
        .select("id, product_id, rating, title, body, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("products").select("id, name"),
    ]);
    setReviews((r ?? []) as Review[]);
    setProductNameById(Object.fromEntries((p ?? []).map((x) => [x.id, x.name])));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      reviews.filter((r) => {
        if (filter !== "all" && r.rating !== Number(filter)) return false;
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.body.toLowerCase().includes(q) ||
          (productNameById[r.product_id] ?? "").toLowerCase().includes(q)
        );
      }),
    [reviews, filter, query, productNameById],
  );

  const remove = async (id: string) => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setReviews((r) => r.filter((x) => x.id !== id));
    toast.success("Review removed");
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Reviews"
        title="Moderation."
        description="Browse customer reviews and remove anything abusive or off-topic."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {RATING_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.14em] ${
                filter === s
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : `${s}★`}
            </button>
          ))}
        </div>
        <div className="ml-auto w-full max-w-xs">
          <Input
            placeholder="Search reviews…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {productNameById[r.product_id] ?? "Unknown product"}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                  <span>·</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-medium">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No reviews match.</p>
        )}
      </div>
    </>
  );
};

export default AdminReviews;

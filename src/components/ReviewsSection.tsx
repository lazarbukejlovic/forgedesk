import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Rating } from "@/components/Rating";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ReviewRow {
  id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  user_id: string;
}

interface Props {
  productId: string;
}

export const ReviewsSection = ({ productId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async (): Promise<ReviewRow[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, title, body, created_at, user_id")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch profile display names for the review authors
  useEffect(() => {
    const ids = Array.from(new Set(reviews.map((r) => r.user_id)));
    if (ids.length === 0) return;
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ids)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data ?? []).forEach((p) => {
          if (p.display_name) map[p.id] = p.display_name;
        });
        setAuthorNames(map);
      });
  }, [reviews]);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").upsert(
      {
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim().slice(0, 120),
        body: body.trim().slice(0, 2000),
      },
      { onConflict: "product_id,user_id" },
    );
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    setTitle("");
    setBody("");
    setRating(5);
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
    toast({ title: "Review submitted", description: "Thank you for the note." });
  };

  return (
    <section className="container-editorial py-16">
      <span className="eyebrow">Reviews</span>
      <h2 className="mt-3 font-display text-3xl font-medium tracking-tightest md:text-4xl">
        What owners say.
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No reviews yet — be the first to write one.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <article key={r.id} className="border border-border p-6">
              <Rating value={r.rating} />
              <h3 className="mt-3 font-display text-lg">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {authorNames[r.user_id] ?? "An owner"}
              </p>
            </article>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={submit} className="mt-10 max-w-xl border border-border bg-surface p-6">
          <h3 className="font-display text-xl">Write a review</h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rating</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`text-lg ${n <= rating ? "text-foreground" : "text-muted-foreground"}`}
                aria-label={`${n} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline"
            maxLength={120}
            required
            className="mt-4 w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What stood out?"
            maxLength={2000}
            required
            rows={4}
            className="mt-3 w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          />
          <Button type="submit" className="mt-4" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit review"}
          </Button>
        </form>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          <a href="/auth" className="link-underline">Sign in</a> to write a review.
        </p>
      )}
    </section>
  );
};

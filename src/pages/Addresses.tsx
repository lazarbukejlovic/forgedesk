import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Address {
  id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

const Addresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Partial<Address>>({ country: "United States" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAddresses((data ?? []) as Address[]));
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      label: draft.label ?? null,
      first_name: draft.first_name ?? "",
      last_name: draft.last_name ?? "",
      line1: draft.line1 ?? "",
      line2: draft.line2 ?? null,
      city: draft.city ?? "",
      region: draft.region ?? null,
      postal_code: draft.postal_code ?? "",
      country: draft.country ?? "United States",
      phone: draft.phone ?? null,
    });
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setAddresses((data ?? []) as Address[]);
    setShowForm(false);
    setDraft({ country: "United States" });
  };

  const removeAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses((s) => s.filter((a) => a.id !== id));
  };

  return (
    <div className="container-editorial py-14 md:py-20">
      <Link to="/account" className="text-xs text-muted-foreground hover:text-foreground">← Account</Link>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-tightest md:text-5xl">Addresses.</h1>

      {addresses.length === 0 && !showForm ? (
        <div className="mt-10 flex flex-col items-start gap-4 border border-border bg-surface p-12">
          <p className="font-display text-xl">No saved addresses.</p>
          <p className="text-sm text-muted-foreground">
            Save an address to skip the form at checkout next time.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <article key={a.id} className="border border-border bg-surface p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-base">
                    {a.first_name} {a.last_name}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
                    {a.city}{a.region ? `, ${a.region}` : ""} {a.postal_code}<br />
                    {a.country}
                  </p>
                  {a.phone && <p className="mt-2 text-xs text-muted-foreground">{a.phone}</p>}
                </div>
                <button
                  aria-label="Delete"
                  onClick={() => removeAddress(a.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!showForm ? (
        <Button className="mt-8" onClick={() => setShowForm(true)}>Add address</Button>
      ) : (
        <form onSubmit={submit} className="mt-10 max-w-xl border border-border bg-surface p-6 space-y-4">
          <h2 className="font-display text-xl">New address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" value={draft.first_name ?? ""} onChange={(v) => setDraft({ ...draft, first_name: v })} required />
            <Field label="Last name" value={draft.last_name ?? ""} onChange={(v) => setDraft({ ...draft, last_name: v })} required />
          </div>
          <Field label="Address line 1" value={draft.line1 ?? ""} onChange={(v) => setDraft({ ...draft, line1: v })} required />
          <Field label="Address line 2" value={draft.line2 ?? ""} onChange={(v) => setDraft({ ...draft, line2: v })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" value={draft.city ?? ""} onChange={(v) => setDraft({ ...draft, city: v })} required />
            <Field label="Postal code" value={draft.postal_code ?? ""} onChange={(v) => setDraft({ ...draft, postal_code: v })} required />
            <Field label="Country" value={draft.country ?? ""} onChange={(v) => setDraft({ ...draft, country: v })} required />
          </div>
          <Field label="Phone (optional)" value={draft.phone ?? ""} onChange={(v) => setDraft({ ...draft, phone: v })} />
          <div className="flex gap-2 pt-2">
            <Button type="submit">Save address</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) => (
  <label className="block">
    <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-border bg-background px-3 py-2.5 text-sm focus:border-foreground focus:outline-none"
    />
  </label>
);

export default Addresses;

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Account = () => {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [orderCount, setOrderCount] = useState(0);
  const [savedSetupCount, setSavedSetupCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setDisplayName(data?.display_name ?? "");
    });
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setOrderCount(count ?? 0));
    supabase.from("saved_setups").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setSavedSetupCount(count ?? 0));
    supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setAddressCount(count ?? 0));
  }, [user]);

  if (!user) return null;

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim().slice(0, 80) })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: "Profile updated." });
  };

  return (
    <div className="container-editorial grid gap-10 py-14 md:py-20 lg:grid-cols-[260px,1fr]">
      <aside>
        <span className="eyebrow">Account</span>
        <h1 className="mt-3 font-display text-3xl tracking-tightest">
          {displayName || "Welcome"}
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">{user.email}</p>
        <nav className="mt-8 flex flex-col gap-1 text-sm">
          <Link to="/account" className="border-l-2 border-foreground pl-3">Overview</Link>
          <Link to="/account/orders" className="border-l-2 border-transparent pl-3 text-muted-foreground hover:text-foreground">Orders</Link>
          <Link to="/account/addresses" className="border-l-2 border-transparent pl-3 text-muted-foreground hover:text-foreground">Addresses</Link>
          <Link to="/build" className="border-l-2 border-transparent pl-3 text-muted-foreground hover:text-foreground">Saved setups</Link>
          <Link to="/wishlist" className="border-l-2 border-transparent pl-3 text-muted-foreground hover:text-foreground">Wishlist</Link>
        </nav>
        <Button variant="outline" size="sm" className="mt-8" onClick={signOut}>
          Sign out
        </Button>
      </aside>

      <div className="space-y-10">
        <section className="border border-border bg-surface p-8">
          <h2 className="font-display text-2xl">Profile</h2>
          <label className="mt-6 block">
            <span className="eyebrow">Display name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              className="mt-2 w-full max-w-md border border-border bg-background px-3 py-2.5 text-sm focus:border-foreground focus:outline-none"
            />
          </label>
          <Button className="mt-4" onClick={saveProfile} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Stat label="Orders" value={orderCount} link="/account/orders" />
          <Stat label="Saved setups" value={savedSetupCount} link="/build" />
          <Stat label="Addresses" value={addressCount} link="/account/addresses" />
        </section>
      </div>
    </div>
  );
};

const Stat = ({ label, value, link }: { label: string; value: string | number; link?: string }) => {
  const inner = (
    <div className="border border-border bg-surface p-6">
      <span className="eyebrow">{label}</span>
      <p className="mt-2 font-display text-2xl tracking-tightest truncate">{value}</p>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
};

export default Account;

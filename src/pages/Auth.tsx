import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") ?? "/account";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isLoading && user) {
    return <Navigate to={redirect} replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirect}`,
          data: { display_name: displayName || email.split("@")[0] },
        },
      });
      setBusy(false);
      if (error) {
        toast({ title: "Could not sign up", description: error.message, variant: "destructive" });
        return;
      }
      if (data.session) {
        toast({ title: "Welcome to ForgeDesk", description: "Your account is ready." });
        navigate(redirect);
      } else {
        toast({
          title: "Check your inbox",
          description: "We sent a confirmation link to verify your email before you can sign in.",
        });
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        toast({ title: "Could not sign in", description: error.message, variant: "destructive" });
        return;
      }
      navigate(redirect);
    }
  };

  return (
    <div className="container-editorial grid gap-16 py-20 lg:grid-cols-2 lg:py-28">
      <div>
        <span className="eyebrow">{mode === "signin" ? "Sign in" : "Create account"}</span>
        <h1 className="mt-3 font-display text-5xl font-medium leading-[1] tracking-tightest md:text-6xl">
          {mode === "signin" ? "Welcome back." : "Make it yours."}
        </h1>
        <p className="mt-5 max-w-md text-muted-foreground">
          Save setups, keep your wishlist across devices, and track every order from a single
          considered place.
        </p>
      </div>

      <form onSubmit={submit} className="max-w-md self-center border border-border bg-surface p-8">
        <div className="mb-6 flex gap-1 border-b border-border text-sm">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`px-3 py-2 ${mode === "signin" ? "border-b-2 border-foreground -mb-px text-foreground" : "text-muted-foreground"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`px-3 py-2 ${mode === "signup" ? "border-b-2 border-foreground -mb-px text-foreground" : "text-muted-foreground"}`}
          >
            Create account
          </button>
        </div>

        {mode === "signup" && (
          <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Your name" />
        )}
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          minLength={6}
        />
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>New here? <button type="button" className="link-underline text-foreground" onClick={() => setMode("signup")}>Create an account</button></>
          ) : (
            <>Already have one? <button type="button" className="link-underline text-foreground" onClick={() => setMode("signin")}>Sign in</button></>
          )}
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link to="/" className="link-underline">← Back to ForgeDesk</Link>
        </p>
      </form>
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
  <label className="mb-4 block">
    <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </span>
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-border bg-background px-3 py-2.5 text-sm focus:border-foreground focus:outline-none"
    />
  </label>
);

export default Auth;

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type State = "loading" | "valid" | "already" | "invalid" | "unsubscribing" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (res.status === 404) {
          setState("invalid");
          return;
        }
        if (data.valid === true) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token, supabaseUrl, anonKey]);

  const confirm = async () => {
    if (!token) return;
    setState("unsubscribing");
    const { data, error } = await supabase.functions.invoke<{
      success?: boolean;
      reason?: string;
    }>("handle-email-unsubscribe", {
      body: { token },
    });
    if (error) setState("error");
    else if (data?.success) setState("done");
    else if (data?.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center">
        <p className="eyebrow">ForgeDesk</p>

        {state === "loading" && (
          <>
            <Loader2 className="mx-auto mt-8 h-7 w-7 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Checking your link…</p>
          </>
        )}

        {state === "valid" && (
          <>
            <h1 className="mt-4 font-display text-3xl tracking-tightest">Unsubscribe?</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              You'll stop receiving emails from us. Order receipts may still be sent for purchases you make.
            </p>
            <Button className="mt-8" onClick={confirm}>
              Confirm unsubscribe
            </Button>
          </>
        )}

        {state === "unsubscribing" && (
          <>
            <Loader2 className="mx-auto mt-8 h-7 w-7 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Processing…</p>
          </>
        )}

        {(state === "done" || state === "already") && (
          <>
            <CheckCircle2 className="mx-auto mt-6 h-9 w-9 text-accent" />
            <h1 className="mt-4 font-display text-3xl tracking-tightest">
              {state === "done" ? "You're unsubscribed." : "Already unsubscribed."}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We've removed your email from our list. Sorry to see you go.
            </p>
            <Button asChild variant="outline" className="mt-8">
              <Link to="/">Back to ForgeDesk</Link>
            </Button>
          </>
        )}

        {state === "invalid" && (
          <>
            <AlertCircle className="mx-auto mt-6 h-9 w-9 text-destructive" />
            <h1 className="mt-4 font-display text-3xl tracking-tightest">Link not valid.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This unsubscribe link is invalid or has expired.
            </p>
            <Button asChild variant="outline" className="mt-8">
              <Link to="/">Back to ForgeDesk</Link>
            </Button>
          </>
        )}

        {state === "error" && (
          <>
            <AlertCircle className="mx-auto mt-6 h-9 w-9 text-destructive" />
            <h1 className="mt-4 font-display text-3xl tracking-tightest">Something went wrong.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Please try again in a moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;

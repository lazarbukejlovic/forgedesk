import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Status = "loading" | "paid" | "pending" | "failed";

const CheckoutReturn = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<Status>("loading");
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("failed");
      return;
    }
    let attempts = 0;
    let cancelled = false;

    const poll = async () => {
      while (!cancelled && attempts < 12) {
        attempts++;
        const { data } = await supabase
          .from("orders")
          .select("id, status, total_cents, email, placed_at")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();
        if (data) {
          setOrder(data);
          if (data.status === "paid" || data.status === "fulfilled") {
            setStatus("paid");
            return;
          }
          if (data.status === "cancelled" || data.status === "refunded") {
            setStatus("failed");
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) setStatus(order?.status === "pending" ? "pending" : "failed");
    };
    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="container-editorial py-24 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 eyebrow">Confirming payment</p>
          <h1 className="mt-3 font-display text-4xl tracking-tightest">One moment.</h1>
        </>
      )}
      {status === "paid" && (
        <>
          <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
          <span className="mt-4 inline-block eyebrow">Order placed</span>
          <h1 className="mt-3 font-display text-5xl tracking-tightest">Thank you.</h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            We sent a confirmation to <span className="text-foreground">{order?.email}</span>.
            Your order total was{" "}
            <span className="text-foreground tabular-nums">{formatPrice(order?.total_cents ?? 0)}</span>.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link to={`/account/orders/${order?.id}`}>View order</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/shop">Continue shopping</Link>
            </Button>
          </div>
        </>
      )}
      {status === "pending" && (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
          <span className="mt-4 inline-block eyebrow">Pending</span>
          <h1 className="mt-3 font-display text-4xl tracking-tightest">Almost there.</h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Your bank is still confirming the payment. We'll email you the moment it clears.
          </p>
          <Button asChild className="mt-8">
            <Link to="/account/orders">View orders</Link>
          </Button>
        </>
      )}
      {status === "failed" && (
        <>
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <span className="mt-4 inline-block eyebrow">Payment unsuccessful</span>
          <h1 className="mt-3 font-display text-4xl tracking-tightest">Let's try again.</h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            The payment didn't go through. Your cart is still saved — try a different card or method.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link to="/checkout">Back to checkout</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/cart">Review cart</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutReturn;

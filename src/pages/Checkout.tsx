import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { getStripe, getStripeEnvironment, hasStripeKey } from "@/lib/stripe";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { toast } from "@/hooks/use-toast";

const FREE_SHIPPING_THRESHOLD = 15000;
const FLAT_SHIPPING = 900;

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

const empty: ShippingForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "United States",
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lines, subtotalCents } = useCart();
  const { data: products = [] } = useProducts();

  const [form, setForm] = useState<ShippingForm>(empty);
  const [savedAddressId, setSavedAddressId] = useState<string>("");
  const [savedAddresses, setSavedAddresses] = useState<Tables<"addresses">[]>([]);
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<{ code: string; discountCents: number } | null>(null);
  const [discountChecking, setDiscountChecking] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = subtotalCents();
  const discount = appliedCode?.discountCents ?? 0;
  const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : subtotal === 0 ? 0 : FLAT_SHIPPING;
  const total = Math.max(0, subtotal - discount) + shipping;

  // Hydrate from auth + saved addresses
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, email: f.email || user.email || "" }));
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setSavedAddresses(data);
        const def = data.find((a) => a.is_default) ?? data[0];
        if (def && !savedAddressId) {
          setSavedAddressId(def.id);
          applyAddress(def);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const applyAddress = (a: Tables<"addresses">) => {
    setForm({
      firstName: a.first_name ?? "",
      lastName: a.last_name ?? "",
      email: form.email || user?.email || "",
      phone: a.phone ?? "",
      line1: a.line1 ?? "",
      line2: a.line2 ?? "",
      city: a.city ?? "",
      region: a.region ?? "",
      postalCode: a.postal_code ?? "",
      country: a.country ?? "United States",
    });
  };

  const validateForm = (): string | null => {
    if (!form.email || !/.+@.+\..+/.test(form.email)) return "A valid email is required";
    if (!form.firstName || !form.lastName) return "Please enter your full name";
    if (!form.line1 || !form.city || !form.postalCode || !form.country) return "Shipping address is incomplete";
    return null;
  };

  const applyDiscount = async () => {
    if (!code.trim()) return;
    setDiscountChecking(true);
    const { data, error } = await supabase.functions.invoke<{
      code?: string;
      discountCents?: number;
      error?: string;
    }>("validate-discount", {
      body: { code, subtotalCents: subtotal },
    });
    setDiscountChecking(false);
    if (error || data?.error || !data?.code || data.discountCents == null) {
      toast({
        title: "Code rejected",
        description: data?.error || error?.message || "Invalid code",
        variant: "destructive",
      });
      setAppliedCode(null);
      return;
    }
    setAppliedCode({ code: data.code, discountCents: data.discountCents });
    toast({
      title: "Discount applied",
      description: `${data.code} — ${formatPrice(data.discountCents)} off`,
    });
  };

  const startPayment = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validateForm();
    if (v) {
      setError(v);
      return;
    }
    if (lines.length === 0) {
      setError("Your cart is empty");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke<{
      clientSecret?: string;
      error?: string;
    }>("create-checkout", {
      body: {
        lines: lines.map((l) => ({
          productId: l.productId,
          variantKey: l.variantKey,
          variantLabel: l.variantLabel,
          quantity: l.quantity,
          bundleId: l.bundleId ?? null,
          bundleName: l.bundleName ?? null,
        })),
        shipping: form,
        discountCode: appliedCode?.code,
        userId: user?.id,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    setBusy(false);
    if (error || data?.error || !data?.clientSecret) {
      setError(data?.error || error?.message || "Could not start payment");
      return;
    }
    setClientSecret(data.clientSecret);
  };

  const stripeOptions = useMemo(() => (clientSecret ? { clientSecret } : null), [clientSecret]);

  if (lines.length === 0 && !clientSecret) {
    return (
      <div className="container-editorial py-20">
        <span className="eyebrow">Checkout</span>
        <h1 className="mt-3 font-display text-5xl tracking-tightest">Your cart is empty.</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Add a few considered objects, then return to complete the order.
        </p>
        <Button asChild className="mt-8">
          <Link to="/shop">Browse the shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PaymentTestModeBanner />
      <div className="container-editorial py-14 md:py-20">
        <span className="eyebrow">Checkout</span>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tightest md:text-5xl">
          Complete your order.
        </h1>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr,1fr]">
          {/* Left: form OR Stripe */}
          <div className="space-y-10">
            {!clientSecret ? (
              <form onSubmit={startPayment} className="space-y-10">
                <Section title="Contact">
                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    required
                  />
                </Section>

                <Section title="Shipping address">
                  {savedAddresses.length > 0 && (
                    <div className="mb-6 border border-border bg-surface p-4">
                      <span className="eyebrow">Saved addresses</span>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {savedAddresses.map((a) => (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => {
                              setSavedAddressId(a.id);
                              applyAddress(a);
                            }}
                            className={`border p-3 text-left text-xs ${
                              savedAddressId === a.id
                                ? "border-foreground bg-background"
                                : "border-border hover:border-foreground/40"
                            }`}
                          >
                            <p className="font-display text-sm">
                              {a.label || `${a.first_name} ${a.last_name}`}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {a.line1}, {a.city} {a.postal_code}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="First name"
                      value={form.firstName}
                      onChange={(v) => setForm({ ...form, firstName: v })}
                      required
                    />
                    <Field
                      label="Last name"
                      value={form.lastName}
                      onChange={(v) => setForm({ ...form, lastName: v })}
                      required
                    />
                  </div>
                  <Field
                    label="Address"
                    value={form.line1}
                    onChange={(v) => setForm({ ...form, line1: v })}
                    required
                  />
                  <Field
                    label="Apartment, suite (optional)"
                    value={form.line2}
                    onChange={(v) => setForm({ ...form, line2: v })}
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field
                      label="City"
                      value={form.city}
                      onChange={(v) => setForm({ ...form, city: v })}
                      required
                    />
                    <Field
                      label="State / Region"
                      value={form.region}
                      onChange={(v) => setForm({ ...form, region: v })}
                    />
                    <Field
                      label="Postal code"
                      value={form.postalCode}
                      onChange={(v) => setForm({ ...form, postalCode: v })}
                      required
                    />
                  </div>
                  <Field
                    label="Country"
                    value={form.country}
                    onChange={(v) => setForm({ ...form, country: v })}
                    required
                  />
                  <Field
                    label="Phone (optional)"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                  />
                </Section>

                {error && (
                  <div className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Preparing payment…" : "Continue to payment"}
                </Button>
              </form>
            ) : (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-xl">Payment</h2>
                  <button
                    type="button"
                    onClick={() => setClientSecret(null)}
                    className="text-xs text-muted-foreground link-underline"
                  >
                    ← Edit shipping
                  </button>
                </div>
                {(() => {
                  const stripe = hasStripeKey() ? getStripe() : null;
                  if (!stripe || !stripeOptions) {
                    return (
                      <div className="border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
                        Payments are not configured for this environment. Please
                        contact support.
                      </div>
                    );
                  }
                  return (
                    <EmbeddedCheckoutProvider stripe={stripe} options={stripeOptions}>
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right: order summary */}
          <aside className="self-start border border-border bg-surface p-6">
            <h2 className="font-display text-xl">Order summary</h2>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {lines.map((l) => {
                const product = products.find((p) => p.id === l.productId);
                return (
                  <li key={l.productId + l.variantKey} className="flex gap-3 py-3 text-sm">
                    <div className="h-14 w-14 shrink-0 overflow-hidden bg-background">
                      {product?.image && (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-3">
                        <span className="font-display">
                          {l.quantity} × {product?.name ?? "Item"}
                        </span>
                        <span className="tabular-nums">{formatPrice(l.unitPriceCents * l.quantity)}</span>
                      </div>
                      {l.bundleName && (
                        <span className="text-[11px] uppercase tracking-[0.14em] text-accent">{l.bundleName}</span>
                      )}
                      {l.variantLabel && <span className="text-xs text-muted-foreground">{l.variantLabel}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5">
              <span className="eyebrow">Discount code</span>
              <div className="mt-2 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="FORGE10"
                  className="flex-1 border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
                  disabled={!!clientSecret}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyDiscount}
                  disabled={discountChecking || !!clientSecret}
                >
                  {discountChecking ? "…" : "Apply"}
                </Button>
              </div>
              {appliedCode && (
                <p className="mt-2 text-xs text-accent">
                  {appliedCode.code} — {formatPrice(appliedCode.discountCents)} off
                </p>
              )}
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <Row dt="Subtotal" dd={formatPrice(subtotal)} />
              {discount > 0 && <Row dt="Discount" dd={`− ${formatPrice(discount)}`} />}
              <Row dt="Shipping" dd={shipping === 0 ? "Free" : formatPrice(shipping)} />
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="font-display text-base">Total</dt>
                <dd className="font-display text-base tabular-nums">{formatPrice(total)}</dd>
              </div>
            </dl>

            <p className="mt-4 text-xs text-muted-foreground">
              Free shipping on orders over $150. Secure payment via Stripe.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="font-display text-xl">{title}</h2>
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

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
    <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </span>
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-border bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
    />
  </label>
);

const Row = ({ dt, dd }: { dt: string; dd: string }) => (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">{dt}</dt>
    <dd className="tabular-nums">{dd}</dd>
  </div>
);

export default Checkout;

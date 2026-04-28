import { isTestMode } from "@/lib/stripe";

export function PaymentTestModeBanner() {
  if (!isTestMode()) return null;
  return (
    <div className="w-full border-b border-accent/40 bg-accent/10 px-4 py-2 text-center text-xs uppercase tracking-[0.14em] text-accent">
      Test mode · use card{" "}
      <span className="font-semibold">4242 4242 4242 4242</span>, any future
      expiry, any CVC.
    </div>
  );
}

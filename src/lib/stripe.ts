import { loadStripe, type Stripe } from "@stripe/stripe-js";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
const environment: "sandbox" | "live" =
  clientToken?.startsWith("pk_live_") ? "live" : "sandbox";

let stripePromise: Promise<Stripe | null> | null = null;

/** Returns the Stripe promise, or null if the publishable key is not configured. */
export function getStripe(): Promise<Stripe | null> | null {
  if (!clientToken) return null;
  if (!stripePromise) stripePromise = loadStripe(clientToken);
  return stripePromise;
}

export function hasStripeKey() {
  return !!clientToken;
}

export function getStripeEnvironment() {
  return environment;
}

export function isTestMode() {
  return !!clientToken && environment === "sandbox";
}

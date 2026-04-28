import { Link, NavLink } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X, User, Shield } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { useAuth } from "@/auth/AuthProvider";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/shop", label: "Shop" },
  { to: "/build", label: "Build Your Setup" },
  { to: "/bundles", label: "Bundles" },
  { to: "/about", label: "Story" },
];

export const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const openCart = useCart((s) => s.open);
  const wishlistCount = useWishlist((s) => s.productIds.length);
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-editorial flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Link to="/" className="font-display text-lg font-semibold tracking-tight">
            ForgeDesk<span className="text-accent">.</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-sm tracking-wide text-muted-foreground transition-colors hover:text-foreground",
                    isActive && "text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Link
            to="/shop"
            aria-label="Search shop"
            className="hidden h-10 w-10 items-center justify-center text-foreground/80 hover:text-foreground md:inline-flex"
          >
            <Search className="h-4 w-4" />
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              aria-label="Admin"
              className="hidden h-10 w-10 items-center justify-center text-accent hover:text-foreground md:inline-flex"
            >
              <Shield className="h-4 w-4" />
            </Link>
          )}
          <Link
            to={user ? "/account" : "/auth"}
            aria-label={user ? "Account" : "Sign in"}
            className="hidden h-10 w-10 items-center justify-center text-foreground/80 hover:text-foreground md:inline-flex"
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative inline-flex h-10 w-10 items-center justify-center text-foreground/80 hover:text-foreground"
          >
            <Heart className="h-4 w-4" />
            {wishlistCount > 0 && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label="Open cart"
            className="relative inline-flex h-10 w-10 items-center justify-center text-foreground/80 hover:text-foreground"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center bg-foreground px-1 text-[10px] font-medium text-background">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
            className="inline-flex h-10 w-10 items-center justify-center text-foreground md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border md:hidden">
          <nav className="container-editorial flex flex-col py-4">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-base text-foreground"
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to={user ? "/account" : "/auth"}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-base text-foreground"
            >
              {user ? "Account" : "Sign in"}
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
};

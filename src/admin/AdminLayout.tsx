import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  MessagesSquare,
  Package,
  Receipt,
  Sparkles,
  Tags,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Orders", icon: Receipt },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/bundles", label: "Bundles", icon: Boxes },
  { to: "/admin/discounts", label: "Discounts", icon: Tags },
  { to: "/admin/featured", label: "Featured", icon: Sparkles },
  { to: "/admin/reviews", label: "Reviews", icon: MessagesSquare },
];

export const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <NavLink to="/admin" className="font-display text-lg tracking-tightest">
            ForgeDesk<span className="text-accent">.</span>
          </NavLink>
          <span className="ml-2 mt-1 eyebrow">Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-foreground/80 hover:bg-muted/60"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-border p-4 text-xs text-muted-foreground">
          <p className="truncate">{user?.email}</p>
          <NavLink to="/" className="mt-2 inline-flex items-center gap-1 link-underline">
            View storefront <ArrowUpRight className="h-3 w-3" />
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="eyebrow">{crumbFor(location.pathname)}</span>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <select
              value={location.pathname}
              onChange={(e) => navigate(e.target.value)}
              className="rounded-sm border border-border bg-background px-2 py-1 text-sm"
            >
              {NAV.map((n) => (
                <option key={n.to} value={n.to}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function crumbFor(path: string): string {
  const item = NAV.slice().reverse().find((n) => path === n.to || path.startsWith(n.to + "/"));
  return item?.label ?? "Admin";
}

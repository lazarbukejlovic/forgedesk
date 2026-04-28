import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="mt-32 border-t border-border bg-surface">
      <div className="container-editorial py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr,1fr,1fr,1fr]">
          <div>
            <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
              ForgeDesk<span className="text-accent">.</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Considered desk objects for people who work with intent. Designed in Copenhagen,
              made in small batches across Portugal, Germany, and Vietnam.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 flex max-w-sm border border-foreground/20"
            >
              <input
                type="email"
                required
                placeholder="Email address"
                className="flex-1 bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              <Button type="submit" size="sm" className="rounded-none px-5">
                Join
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              Quiet emails. New objects, restocks, occasional essays.
            </p>
          </div>

          <FooterCol
            title="Shop"
            links={[
              { to: "/shop", label: "All products" },
              { to: "/category/desk-mats", label: "Desk mats" },
              { to: "/category/stands", label: "Stands" },
              { to: "/category/lighting", label: "Lighting" },
              { to: "/bundles", label: "Bundles" },
            ]}
          />
          <FooterCol
            title="Studio"
            links={[
              { to: "/about", label: "Our story" },
              { to: "/build", label: "Build your setup" },
              { to: "/faq", label: "Materials" },
              { to: "/faq", label: "Sustainability" },
            ]}
          />
          <FooterCol
            title="Help"
            links={[
              { to: "/faq", label: "Shipping" },
              { to: "/faq", label: "Returns" },
              { to: "/faq", label: "Warranty" },
              { to: "/faq", label: "Contact" },
            ]}
          />
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ForgeDesk Studio. All rights reserved.</p>
          <p>Built in small batches. Shipped worldwide.</p>
        </div>
      </div>
    </footer>
  );
};

const FooterCol = ({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) => (
  <div>
    <h4 className="eyebrow mb-5">{title}</h4>
    <ul className="space-y-3">
      {links.map((l) => (
        <li key={l.label}>
          <Link to={l.to} className="text-sm text-foreground/80 link-underline">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

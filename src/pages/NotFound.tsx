import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="container-editorial flex min-h-[60vh] flex-col items-center justify-center text-center">
    <span className="eyebrow">404</span>
    <h1 className="mt-3 font-display text-6xl font-medium tracking-tightest md:text-8xl">
      Not here.
    </h1>
    <p className="mt-4 max-w-sm text-muted-foreground">
      That page doesn't exist — or it's been quietly retired. Try the shop instead.
    </p>
    <div className="mt-8 flex gap-3">
      <Button asChild>
        <Link to="/">Home</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/shop">Shop</Link>
      </Button>
    </div>
  </div>
);

export default NotFound;

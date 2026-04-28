import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "@/components/CartDrawer";

export const SiteLayout = () => (
  <div className="flex min-h-dvh flex-col bg-background">
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <CartDrawer />
  </div>
);

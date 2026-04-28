import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { AuthProvider } from "@/auth/AuthProvider";
import { StoreSync } from "@/auth/StoreSync";
import { RequireAuth } from "@/auth/RequireAuth";
import { RequireAdmin } from "@/auth/RequireAdmin";
import { AdminLayout } from "@/admin/AdminLayout";
import AdminOverview from "@/admin/pages/AdminOverview";
import AdminOrders from "@/admin/pages/AdminOrders";
import AdminOrderDetail from "@/admin/pages/AdminOrderDetail";
import AdminProducts from "@/admin/pages/AdminProducts";
import AdminProductEditor from "@/admin/pages/AdminProductEditor";
import AdminCategories from "@/admin/pages/AdminCategories";
import AdminBundles from "@/admin/pages/AdminBundles";
import AdminDiscounts from "@/admin/pages/AdminDiscounts";
import AdminFeatured from "@/admin/pages/AdminFeatured";
import AdminReviews from "@/admin/pages/AdminReviews";

import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Build from "./pages/Build";
import Bundles from "./pages/Bundles";
import BundleDetail from "./pages/BundleDetail";
import Checkout from "./pages/Checkout";
import CheckoutReturn from "./pages/CheckoutReturn";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import Addresses from "./pages/Addresses";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StoreSync />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/:id" element={<AdminProductEditor />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="bundles" element={<AdminBundles />} />
              <Route path="discounts" element={<AdminDiscounts />} />
              <Route path="featured" element={<AdminFeatured />} />
              <Route path="reviews" element={<AdminReviews />} />
            </Route>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/category/:slug" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/build" element={<Build />} />
              <Route path="/bundles" element={<Bundles />} />
              <Route path="/bundles/:slug" element={<BundleDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/return" element={<CheckoutReturn />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <Account />
                  </RequireAuth>
                }
              />
              <Route
                path="/account/addresses"
                element={
                  <RequireAuth>
                    <Addresses />
                  </RequireAuth>
                }
              />
              <Route
                path="/account/orders"
                element={
                  <RequireAuth>
                    <Orders />
                  </RequireAuth>
                }
              />
              <Route
                path="/account/orders/:id"
                element={
                  <RequireAuth>
                    <OrderDetail />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

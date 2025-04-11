import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import CompanyProfile from "./pages/CompanyProfile";
import Products from "./pages/Products";
import ShippingTerms from "./pages/ShippingTerms";
import InvoiceGenerator from "./pages/InvoiceGenerator";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            }
          />
          <Route
            path="/company"
            element={
              <AdminLayout>
                <CompanyProfile />
              </AdminLayout>
            }
          />
          {/* <Route
            path="/clients"
            element={
              <AdminLayout>
                <Clients />
              </AdminLayout>
            }
          /> */}
          <Route
            path="/products"
            element={
              <AdminLayout>
                <Products />
              </AdminLayout>
            }
          />
          <Route
            path="/shipping"
            element={
              <AdminLayout>
                <ShippingTerms />
              </AdminLayout>
            }
          />
          <Route
            path="/invoice"
            element={
              <AdminLayout>
                <InvoiceGenerator />
              </AdminLayout>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminLayout>
                <AdminPanel />
              </AdminLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import CompanyProfile from "./pages/CompanyProfile";
import Products from "./pages/Products";
import ShippingTerms from "./pages/ShippingTerms";
import InvoiceGenerator from "./pages/InvoiceGenerator";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import NextForm from "./pages/NextForm"; // Import the new component

const queryClient = new QueryClient();

// Create a wrapper for NextForm that loads data from localStorage
const NextFormWrapper = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    // Retrieve data from localStorage
    const storedData = localStorage.getItem('invoiceFormData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setFormData(parsedData);
      } catch (e) {
        console.error("Error parsing invoice form data", e);
        navigate('/');
      }
    } else {
      // If no data is found, go back to the invoice page
      navigate('/');
    }
  }, [navigate]);

  if (!formData) {
    return <div>Loading...</div>;
  }

  return (
    <NextForm 
      onBack={() => navigate('/')}
      importedSections={formData.sections}
      markNumber={formData.markNumber}
      readOnly={formData.readOnly}
      invoiceHeader={formData.invoiceHeader} // Pass invoice header information
      buyerInfo={formData.buyerInfo} // Pass buyer information
      shippingInfo={formData.shippingInfo} // Pass shipping information
    />
  );
};

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
          <Route
            path="/next-form" // Updated path to match the navigate call in InvoiceGenerator
            element={
              <AdminLayout>
                <NextFormWrapper />
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
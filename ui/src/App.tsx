import React, { useState, useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";

import { AdminLayout } from "@/components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import CompanyProfile from "./pages/CompanyProfile";
import Products from "./pages/Products";
import ShippingTerms from "./pages/ShippingTerms";
import InvoiceGenerator from "./pages/InvoiceGenerator";
import AdminPanel from "./pages/AdminPanel2";
import NotFound from "./pages/NotFound";
import PackagingList from "./pages/PackagingList";
import Annexure from "./pages/Annexure";
import VgmForm from "./pages/VgmForm";
import InvoiceEditor from "./pages/InvoiceEditor";
import AddClient from "./pages/AddClient";
import ClientList from "./pages/ClientList";
import AddExporter from "./pages/AddExporter";
import ExporterList from "./pages/ExporterList";
import { QueryProvider } from "./providers/query-provider";
import TestPage from "./pages/TestPage";

const queryClient = new QueryClient();

// Create a wrapper for PackagingList that loads data from localStorage
const PackagingListWrapper = () => {
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
    <PackagingList 
      onBack={() => navigate('/invoice')}
      importedSections={formData.sections}
      markNumber={formData.markNumber}
      readOnly={formData.readOnly}
      invoiceHeader={formData.invoiceHeader} // Pass invoice header information
      buyerInfo={formData.buyerInfo} // Pass buyer information
      shippingInfo={formData.shippingInfo} // Pass shipping information
    />
  );
};

// Create a wrapper for Annexure that loads data from localStorage
const AnnexureWrapper = () => {
  const navigate = useNavigate();
  const [annexureData, setAnnexureData] = useState<any>(null);

  useEffect(() => {
    // Retrieve data from localStorage
    const storedData = localStorage.getItem('annexureData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setAnnexureData(parsedData);
      } catch (e) {
        console.error("Error parsing annexure data", e);
        navigate('/');
      }
    } else {
      // If no data is found, go back to the packaging list page
      navigate('/packaging-list');
    }
  }, [navigate]);

  if (!annexureData) {
    return <div>Loading...</div>;
  }

  return (
    <Annexure 
      onBack={() => navigate('/packaging-list')}
      importedSections={annexureData.sections}
      markNumber={annexureData.markNumber}
      invoiceHeader={annexureData.invoiceHeader}
      buyerInfo={annexureData.buyerInfo}
      shippingInfo={annexureData.shippingInfo}
      containerInfo={{
        containerRows: annexureData.containerRows,
        totalPalletCount: annexureData.totalPalletCount
      }}
    />
  );
};

// Create a wrapper for VgmForm that loads data from localStorage
const VgmFormWrapper = () => {
  const navigate = useNavigate();
  const [vgmData, setVgmData] = useState<any>(null);

  useEffect(() => {
    // Retrieve data from localStorage
    const storedData = localStorage.getItem('vgmData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setVgmData(parsedData);
      } catch (e) {
        console.error("Error parsing VGM data", e);
        navigate('/');
      }
    } else {
      // If no data is found, go back to the annexure page
      navigate('/annexure');
    }
  }, [navigate]);

  if (!vgmData) {
    return <div>Loading...</div>;
  }

  return (
    <VgmForm 
      onBack={() => navigate('/annexure')}
      containerInfo={vgmData.containerInfo}
      invoiceHeader={vgmData.invoiceHeader}
    />
  );
};

const App = () => (
  <QueryProvider>
    <TooltipProvider>
      <Toaster />
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
            path="/next-form"
            element={<Navigate to="/packaging-list" replace />}
          />
          <Route
            path="/packaging-list"
            element={
              <AdminLayout>
                <PackagingListWrapper />
              </AdminLayout>
            }
          />
          <Route
            path="/annexure"
            element={
              <AdminLayout>
                <AnnexureWrapper />
              </AdminLayout>
            }
          />
          <Route
            path="/invoice-editor/:id"
            element={
              <AdminLayout>
                <InvoiceEditor />
              </AdminLayout>
            }
          />
          <Route
            path="/add-client"
            element={
              <AdminLayout>
                <AddClient />
              </AdminLayout>
            }
          />
          <Route
            path="/client-list"
            element={
              <AdminLayout>
                <ClientList />
              </AdminLayout>
            }
          />
          <Route
            path="/add-exporter"
            element={
              <AdminLayout>
                <AddExporter />
              </AdminLayout>
            }
          />
          <Route
            path="/exporter-list"
            element={
              <AdminLayout>
                <ExporterList />
              </AdminLayout>
            }
          />
          <Route
            path="/vgm-form"
            element={
              <AdminLayout>
                <VgmFormWrapper />
              </AdminLayout>
            }
          />
          <Route
            path="/test"
            element={
              <AdminLayout>
                <TestPage />
              </AdminLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryProvider>
);

export default App;
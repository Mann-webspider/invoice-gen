import React, { useState, useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";

import { AdminLayout } from "@/components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";

import InvoiceGenerator from "./pages/InvoiceGenerator";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import PackagingList from "./pages/PackagingList";
import Annexure from "./pages/Annexure";
import VgmForm from "./pages/VgmForm";
import ProcessQueue from "./components/ProcessQueue";
import { QueryProvider } from "./providers/query-provider";

import { FormProvider } from "./context/FormContext";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import { Controller, useForm as rhf,FormProvider as FP  } from "react-hook-form";
// QueryClient is handled by QueryProvider

// Create a wrapper for PackagingList that loads data from localStorage
const PackagingListWrapper = ({form}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Retrieve data from localStorage
    const storedData = localStorage.getItem("invoiceFormData");
    // Retrieved localStorage data

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Parsed data from localStorage

        // Ensure sections are properly formatted
        if (!parsedData.sections || !Array.isArray(parsedData.sections)) {
          // Creating default sections
          parsedData.sections = [
            {
              id: "1",
              title: "Glazed porcelain Floor Tiles",
              items: [],
            },
            {
              id: "2",
              title: "Mann",
              items: [],
            },
          ];
        }

        setFormData(parsedData);
        setLoading(false);
      } catch (e) {
        // Error parsing invoice data - handled silently
        setError("Could not parse invoice data. Please try again.");
        setLoading(false);
        // Don't navigate away immediately to show the error
        setTimeout(() => navigate("/"), 3000);
      }
    } else {
      // If no data is found, go back to the invoice page
      setError("No invoice data found.");
      setLoading(false);
      setTimeout(() => navigate("/"), 3000);
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-6 bg-white shadow-md rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-4">
            Loading Packaging List...
          </h2>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-6 bg-white shadow-md rounded-lg text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to home page...
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Home Now
          </button>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-6 bg-white shadow-md rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            No Data Available
          </h2>
          <p className="mb-4">Could not load packaging list data.</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <PackagingList
      onBack={() => navigate("/invoice")}
      markNumber={formData.markNumber || ""}
      readOnly={formData.readOnly || false}
      invoiceHeader={formData.invoiceHeader || {}}
      form={form}
    />
  );
};

// Create a wrapper for Annexure that loads data from localStorage
const AnnexureWrapper = ({form}) => {
  const navigate = useNavigate();
  const [annexureData, setAnnexureData] = useState<any>(null);

  // useEffect(() => {
  //   // Retrieve data from localStorage
  //   const storedData = localStorage.getItem('annexureData');
  //   if (storedData) {
  //     try {
  //       const parsedData = JSON.parse(storedData);
  //       setAnnexureData(parsedData);
  //     } catch (e) {
  //       // Error parsing annexure data - handled silently
  //       navigate('/');
  //     }
  //   } else {
  //     // If no data is found, go back to the packaging list page
  //     navigate('/packaging-list');
  //   }
  // }, [navigate]);

  // if (!annexureData) {
  //   return <div>Loading...</div>;
  // }

  return (
    <Annexure
      onBack={() => navigate("/packaging-list")}
      importedSections={annexureData?.sections}
      markNumber={annexureData?.markNumber}
      invoiceHeader={annexureData?.invoiceHeader}
      buyerInfo={annexureData?.buyerInfo}
      shippingInfo={annexureData?.shippingInfo}
      containerInfo={{
        containerRows: annexureData?.containerRows,
        totalPalletCount: annexureData?.totalPalletCount,
      }}
      form={form}
    />
  );
};

// Create a wrapper for VgmForm that loads data from localStorage
const VgmFormWrapper = ({form}) => {
  const navigate = useNavigate();
  const [vgmData, setVgmData] = useState<any>(null);

  useEffect(() => {
    // Retrieve data from localStorage
    const storedData = localStorage.getItem("vgmData");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setVgmData(parsedData);
      } catch (e) {
        // Error parsing VGM data - handled silently
        navigate("/");
      }
    } else {
      // If no data is found, go back to the annexure page
      navigate("/annexure");
    }
  }, [navigate]);

  if (!vgmData) {
    return <div>Loading...</div>;
  }

  return (
    <VgmForm
      onBack={() => navigate("/annexure")}
      containerInfo={vgmData.containerInfo}
      invoiceHeader={vgmData.invoiceHeader}
      form={form}
    />
  );
};


const App = () => {
  const form = rhf();
  return(
  <AuthProvider>
    <FP {...form}>
    <FormProvider>
      <SidebarProvider>
        <QueryProvider>
          <TooltipProvider>
            <Router>
              <Toaster />
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Dashboard />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/invoice"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <InvoiceGenerator form={form}/>
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoice/drafts/:id"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <InvoiceGenerator form={form}/>
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/packaging-list"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <PackagingListWrapper form={form}/>
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/annexure"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <AnnexureWrapper form={form} />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/vgm-form"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <VgmFormWrapper form={form}/>
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/backup"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <ProcessQueue />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Admin-only routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminLayout>
                        <AdminPanel />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </TooltipProvider>
        </QueryProvider>
      </SidebarProvider>
    </FormProvider>
    </FP>
  </AuthProvider>
)};

export default App;

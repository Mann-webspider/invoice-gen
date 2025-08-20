import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogAction, AlertDialogFooter} from "@/components/ui/alert-dialog";
import {Trash2, AlertTriangle} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  getInvoices,
  getProducts,
  getClients,
  getShippingTerms,
} from "@/lib/dataService";
import { dashboardApi, invoiceApi } from "@/lib/apiService";
import {
  FileText,
  Users,
  Package,
  Plus,
  Edit,
  Eye,
  Loader2,
  Archive,
  ClipboardList,
  Scale,
  Download,
  Printer,
  Mail,
  FileSpreadsheet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Invoice } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import { generateInvoiceExcel } from "@/lib/excelGenerator";
import { generateInvoigenerateDocxceExcel } from "@/lib/wordGenerator";
import { filesApi } from "@/services/api";
import ProgressQueue, { ProcessItem } from '@/components/ProcessQueue';
import {  useFormContext} from "react-hook-form";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

const Dashboard = () => {
  // State for dashboard data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [draftInvoices, setDraftInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({
    invoiceCount: 0,
    exporterCount: 0,
    productCount: 0,
    draftCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  interface Document {
    id: number;
    name: string;
    type: string;
    status: string;
    previewUrl: string;
   
  }
  // Document management state
  const [invoiceDocuments, setInvoiceDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const { user, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}/api`
  const method = useFormContext()
  useEffect(()=>{
    // call the backend at /show/list?path=${invoiceId} to get the list of files
    // console.log("Resetting form data");
    
    method.reset({})
  },[])

  // Mock data for documents - replace with API call
  const mockInvoiceDocuments = [
    {
      id: 1,
      name: "Custom Invoice",
      type: "Custom Invoice",
      status: "ready",
      previewUrl:
        "http://localhost:8000/api/show/file/2025/SGP/0055/CUSTOM_INVOICE.pdf",
      
    },
    {
      id: 2,
      name: "Packaging List",
      type: "Packaging List",
      status: "ready",
      previewUrl:
        "http://localhost:8000/api/show/file/2025/SGP/0055/PACKING_LIST.pdf",
      
    },
    {
      id: 3,
      name: "Annexure",
      type: "Annexure",
      status: "ready",
      previewUrl:
        "http://localhost:8000/api/show/file/2025/SGP/0055/ANNEXURE.pdf",
      
    },
    {
      id: 4,
      name: "VGM Certificate",
      type: "VGM",
      status: "ready",
      previewUrl: "http://localhost:8000/api/show/file/2025/SGP/0055/VGN.pdf",
      
    }
  ];

  // Function to get appropriate icon for document type
  const getDocumentIcon = (type) => {
    const iconClass = "h-5 w-5 text-primary";
    switch (type) {
      case "Custom Invoice":
        return <FileText className={iconClass} />;
      case "Packaging List":
        return <Package className={iconClass} />;
      case "Annexure":
        return <ClipboardList className={iconClass} />;
      case "VGM":
        return <Scale className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  // Document selection handler
  const handleDocumentSelect = async (document) => {
    setSelectedDocument(document);
    setDocumentLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load document preview",
        variant: "destructive",
      });
    } finally {
      setDocumentLoading(false);
    }
  };

const fetchDocuments = async (id: string,type:null | string = null) => {
    try {
      const response = await api.get(`/show/list?path=${id}&type=${type}`);
     
      return response.data.files.files;
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice documents",
        variant: "destructive",
      });
      return [];
    }
  };
  // Bulk actions
  const handleDownloadAllDocuments = async () => {
    setBulkActionLoading(true);

    try {
      const allDocRes = await fetchDocuments(selectedInvoice?.invoiceNo,"pdf");
      for (const docPath of allDocRes) {

      const response = await api.get(`/show/file/${docPath}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${docPath.split("/").pop()}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
      toast({
        title: "Success",
        description: "All documents downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download all documents",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDownloadExcelSheet = async () => {
    setBulkActionLoading(true);

    try {
      const excelRes = await fetchDocuments(selectedInvoice?.invoiceNo,"xlsx");
      const response = await api.get(`/show/file/${excelRes.find(path => path.includes("COMBINED"))}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", excelRes.find(path => path.includes("COMBINED")).split("/").pop().split("COMBINED")[0]);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Excel sheet downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download Excel sheet",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDownloadVGMMail = async () => {
    setBulkActionLoading(true);

    try {
      const docxRes = await fetchDocuments(selectedInvoice?.invoiceNo,"docx");
      const response = await api.get(`/show/file/${docxRes[0]}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", docxRes.find(path => path.includes("docx")).split("/").pop());
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "VGM mail document downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download VGM mail document",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };
  
  // Load documents when invoice is selected
useEffect(() => {
  if (!selectedInvoice) return;

 

  const loadInvoiceDocuments = async () => {
    const filePaths = await fetchDocuments(selectedInvoice.invoiceNo,"pdf");

    const mockInvoiceDocuments = filePaths.map((path: string, index: number) => {
      const fileName = path.split("/").pop() || "";
      let type = "";
      if(fileName.includes("COMBINED")){
        type = fileName
        .replace(".pdf", "")
        // .replace(/(_)|(g)/, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()).split("COMBINED")[0];
        
      }else{

        type = fileName
          .replace(".pdf", "")
          // .replace(/(_)|(g)/, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()).split(" ").pop();
      }

      return {
        id: index + 1,
        name: type,
        type: type,
        status: "ready",
        previewUrl: `${baseUrl}/show/file${path}`,
      };
    });

    setInvoiceDocuments(mockInvoiceDocuments);
    setSelectedDocument(null);
  };

  loadInvoiceDocuments();
}, [selectedInvoice]);


  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        try {
          const [statsData, recentInvoicesData, allInvoices] =
            await Promise.all([
              dashboardApi.getStats(),
              dashboardApi.getRecentInvoices(),
              invoiceApi.getAll(),
            ]);

          if (statsData) {
            setStats(statsData);
          }

          if (recentInvoicesData && recentInvoicesData.length > 0) {
            
            // console.log(recentInvoicesData);
            setRecentInvoices(recentInvoicesData);
          }
          
          if (allInvoices ) {
            setInvoices(allInvoices.invoices);
            // console.log(allInvoices.drafts)
            setDraftInvoices(allInvoices.drafts || []);
          }
        } catch (apiError) {
          // API requests failed
        }
      } catch (error) {
        toast({
          title: "Error loading dashboard",
          description: "There was a problem loading the dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle view invoice
  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const existingInvoice = invoices.find((inv) => inv.id === invoiceId);
      if (existingInvoice) {
        setSelectedInvoice(existingInvoice);
        setViewDialogOpen(true);
        return;
      }

      setLoading(true);
      try {
        const invoice = await invoiceApi.getById(invoiceId);
        if (invoice) {
          setSelectedInvoice(invoice);
          setViewDialogOpen(true);
        } else {
          toast({
            title: "Invoice not found",
            description: "The requested invoice could not be found",
            variant: "destructive",
          });
        }
      } catch (apiError) {
        toast({
          title: "Error",
          description: "Failed to load invoice details from API",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
const handleProcessUpdate = (id: string, status: ProcessItem['status']) => {
    setProcesses(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
  };
   const handleFiles = async (data: any) => {
    try {
      // Generate Excel and Docx
      const { allBuffers: excelBlobs, fileName: excelFileName } = await generateInvoiceExcel(data);
      const docxFile = await generateInvoigenerateDocxceExcel(data);
  
      let resDoc = await filesApi.uploadDoc(docxFile, data.invoice_number);
      // if (resDoc) {
      //   console.log("Document uploaded successfully:", resDoc);
      // }
      // Create process list for queue
      const newProcesses = excelBlobs.map((file: any, index: number) => ({
        id: `${index + 1}`,
        title: `${file.fileName || 'Excel file'} Upload`,
        status: 'pending',
        description: `Uploading ${file.fileName || 'Excel file'}`
      }));
      
      setIsProgressOpen(true);
      setProcesses(()=>newProcesses);
      
  
      const results: any[] = [];
     
      
      for (let i = 0; i < excelBlobs.length; i++) {
        const id = `${i + 1}`;
        const { buffer, fileName } = excelBlobs[i];
        // Set process to running
         handleProcessUpdate(`${i+1}`, "running");
        
         try {
          const response = await filesApi.uploadAndDownloadPdf({buffer, fileName}, data.invoice_number,data.payment_term,excelFileName);
  
          // 👇 Mark as completed
          handleProcessUpdate(`${i+1}`, "completed");
        } catch (err) {
          // 👇 Mark as failed
          handleProcessUpdate(`${i+1}`, "failed");
          console.error(`${fileName} upload failed:`, err);
        }
      }
  
      toast({
        title: "Upload Success",
        description: "Uplaod completed successfully",
        variant: "success",
      });
      // console.log("Upload results:", results);
    } catch (error) {
      console.error("Error generating or uploading files:", error);
      ;
      toast({
        title: "Upload Failed",
        description: "An error occurred during file processing",
        variant: "destructive",
      });
    }
  };

  const handleGenerateFile = async (invoiceId: string) => {
    setIsGenerating(true);
    try {
      let res = await api.get(`/invoice/${invoiceId}`)
      if (!res.data) {
        toast({
          title: "Error",
          description: "Invoice data not found",
          variant: "destructive",
        });
        return;
      }
      const data = res.data;
      await handleFiles(data);
      
    } catch (error) {
      // console.log("Error generating files:", error);
      
    }finally{
      setIsGenerating(false);
    }}
  // handle delete invoice 
  const handleRemoveInvoice = async (invoiceId: string) => {
    try {
      const res = await api.delete(`/invoice/${invoiceId}`);
      
      if (res.status === 200) {
        toast({
          title: "Success",
          description: "Invoice removed successfully",
        });
        
        // Fix: Use consistent state variable names
        setRecentInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
        
        // Only clear selected invoice if it's the one being deleted
        if (selectedInvoice?.id === invoiceId) {
          setSelectedInvoice(null);
        }
        
        setViewDialogOpen(false);
      } else {
        // Handle non-200 responses
        throw new Error(`Failed to delete invoice: ${res.status}`);
      }
    } catch (error: any) {
      console.error("Error removing invoice:", error);
      
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove invoice",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteDraft = async (invoiceId: string) => {
    try {
      const res = await api.delete(`/draft/${invoiceId}`);
      
      if (res.status === 204 || res.status === 200) {
        toast({
          title: "Success",
          description: "Draft removed successfully",
        });
        
        // Fix: Use functional state update for safety
        setDraftInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
        
        // Only clear selected invoice if it's the one being deleted
        if (selectedInvoice?.id === invoiceId) {
          setSelectedInvoice(null);
        }
      } else {
        throw new Error(`Failed to delete draft: ${res.status}`);
      }
    } catch (error: any) {
      console.error("Error removing draft:", error);
      
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove draft",
        variant: "destructive",
      });
    }
  };
  // Handle edit invoice
  const handleEditInvoice = (invoiceId: string) => {
    navigate(`/invoice/drafts/${invoiceId}`);
  };

  function parseIndianDate(dateStr) {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
  }

  const statCards = [
    {
      title: "Total Invoices",
      value: recentInvoices.length,
      icon: FileText,
      link: "/invoice",
      color: "bg-gray-200",
    },
    {
      title: "Total Exporters",
      value: stats.exporterCount,
      icon: Users,
      link: "/clients",
      color: "bg-gray-200",
    },
    {
      title: "Total Products",
      value: stats.productCount,
      icon: Package,
      link: "/products",
      color: "bg-gray-200",
    },
  ];

  return (
    
    <div>
      
      <PageHeader
        title="Dashboard"
        description="Your Invoice Summary Dashboard, Track, Manage, and Create Invoices From here."
        action={
          <Button asChild>
            {isAdmin ? <Link to="/admin">Admin Panel</Link> : <></>}
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading dashboard data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {statCards.map((card, index) => (
            <Card
              key={index}
              className="border border-gray-100 shadow-sm transition-all duration-200 hover:shadow"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </h3>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">{card.value}</span>
                </div>
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="px-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {/* <Link to={card.link}>View Details →</Link> */}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="w-full relative shadow-sm border border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle>Invoices</CardTitle>
              <Button size="sm" className="rounded-full w-8 h-8 p-0" asChild>
                <Link to="/invoice">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add Invoice</span>
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : recentInvoices.length > 0 ? (
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 transition-colors duration-200 group"
                    >

                      <div className="flex-1">
                        <div className="font-medium">{invoice.invoiceNo}</div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.date}
                          
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium text-sm">
                          {invoice.totalFOBEuro}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.items?.length || 0} items
                        </div>
                      </div>
                      <div className="ml-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleViewInvoice(invoice.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="sr-only">View</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No completed invoices yet</p>
                  <Button asChild size="sm" className="mt-3">
                    <Link to="/invoice">Create Invoice</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="w-full relative shadow-sm border border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <CardTitle>In Progress</CardTitle>
                <div className="flex items-center text-xs">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {stats.draftCount} drafts
                  </span>
                </div>
              </div>
              <div className="flex items-center text-gray-400">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 overflow-auto h-[calc(100vh-360px)]">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : draftInvoices.length > 0 ? (
                <div className="space-y-3">
                  {draftInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 transition-colors duration-200 group"
                    >
                      <div className="flex-1">
                        <div className="font-medium flex items-center">
                          <span className="mr-2">
                            {invoice.invoice_number || "Untitled Invoice"}
                          </span>
                          <span className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded">
                            Draft
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.updated_at
                            ? new Date(invoice.updated_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : "Started recently"}

                        </div>
                      </div>
                      
                      <div className="ml-3 gap-2 flex">
                        <Button
                           variant="outline"
                           size="sm"
                           className="h-7 px-2 text-xs"
                          onClick={() => handleEditInvoice(invoice.id)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                        <ConfirmationDialog
  trigger={
    <Button
    variant="outline"
    size="sm"
    className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
    >
       <Trash2 className="h-3 w-3 mr-1" />
      Delete
    </Button>
  }
  title="Delete Draft"
  description={
    <>
      You are about to permanently delete the draft{' '}
      <span className="font-medium text-gray-900">
        "{invoice.invoice_number || "Untitled Invoice"}"
      </span>
      . This action cannot be undone and all progress will be lost.
    </>
  }
  confirmText="Delete Draft"
  onConfirm={() => handleDeleteDraft(invoice.id)}
  variant="destructive"
/>

                         
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-md">
                  <div className="bg-white w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center border">
                    <FileText className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-600">
                    No in-progress invoices
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Invoices that are started but not completed will appear here
                    automatically
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen} closeOnEscape={false}>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0 sm:max-w-[80vw] md:max-w-6xl lg:max-w-[80rem]">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-xl font-semibold flex justify-between items-center">
              Invoice {selectedInvoice?.invoiceNo}
              <div className="flex items-center space-x-2">
                <ConfirmationDialog
  trigger={
    <Button 
        variant="destructive"
        className="bg-red-500 hover:bg-red-600 text-white font-regular px-4 py-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Trash2 className="w-4 h-4" />
        Remove
      </Button>
  }
  title="Delete Invoice"
  description={
    <>
      You are about to permanently delete the invoice{' '}
      <span className="font-medium text-gray-900">
        "{selectedInvoice?.invoiceNo || "Untitled Invoice"}"
      </span>
      . This action cannot be undone.
    </>
  }
  confirmText="Delete Invoice"
  onConfirm={() => handleRemoveInvoice(selectedInvoice?.id || "")}
  variant="destructive"
/>

                
                <Button 
  onClick={() => handleGenerateFile(selectedInvoice?.id || "")} 
  disabled={isGenerating}
  className={`
    py-2 px-3 border-green-300 bg-green-600 hover:bg-green-800 
    hover:text-green-50 hover:border-green-400 
    transition-all duration-300 ease-in-out
    ${isGenerating 
      ? 'opacity-50 cursor-not-allowed bg-gray-400 border-gray-400' 
      : 'transform hover:scale-105 active:scale-95'
    }
  `}
>
  {isGenerating ? (
    <div className="flex items-center gap-2">
      <svg 
        className="animate-spin h-4 w-4 text-white" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Generating...
    </div>
  ) : (
    'Generate'
  )}
</Button>
              {/* <Button onClick={() => handleEditInvoice(selectedInvoice?.id || "")} className="py-2 px-3">
                Edit Invoice
              </Button> */}
              <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="py-2 px-3">
                Close
              </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
              {isProgressOpen?(<ProgressQueue
  isOpen={isProgressOpen}
  onClose={() => setIsProgressOpen(false)}
  onDashboardNavigate={() => {
    setIsProgressOpen(false);
    navigate("/"); // or your custom action
  }}
  processes={processes}
/>):<></>}
          {selectedInvoice ? (
            <div className="flex flex-col h-[calc(90vh-120px)] sm:h-[calc(90vh-100px)]">
              {/* Invoice Header Info */}
              <div className="border-b bg-gray-50 p-4 rounded-t-lg flex-shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Invoice Number
                    </h3>
                    <p className="font-semibold text-lg truncate">
                      {selectedInvoice.invoiceNo}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Date
                    </h3>
                    <p className="font-semibold text-lg">
                      {
                        selectedInvoice.date
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Exporter
                    </h3>
                    <p className="font-semibold text-lg truncate">
                      {selectedInvoice.exporter_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Final Destination
                    </h3>
                    <p className="font-semibold text-lg truncate">
                      {selectedInvoice.finalDestination || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col md:flex-row lg:flex-row gap-4 p-4 min-h-0 overflow-auto">
                {/* Documents Panel */}
                <div className="w-full md:w-1/3 lg:w-1/3 border-r md:pr-4 flex flex-col min-h-0">
                  <div className="flex-1 flex flex-col justify-center min-h-0 max-h-full">
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <h3 className="text-lg font-semibold">Documents</h3>
                      <Badge variant="secondary" className="text-xs">
                        {invoiceDocuments.length} files
                      </Badge>
                    </div>

                    <div className="flex-1 max-h-[50vh]">
                      <ScrollArea className="h-96 max-h-[20rem] ">
                        <div className="space-y-2 p-2">
                          {invoiceDocuments.map((doc, index) => (
                            <Card
                              key={index}
                              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedDocument?.id === doc.id
                                ? "ring-2 ring-primary bg-primary/5"
                                : ""
                                }`}
                              onClick={() => handleDocumentSelect(doc)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    {getDocumentIcon(doc.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {doc.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {doc.type}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    <Badge
                                      variant={
                                        doc.status === "ready"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {doc.status}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Bulk Actions */}
                    <div className="border-t pt-3 flex-shrink-0">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Bulk Actions
                      </h4>
                      <ScrollArea className="max-h-30 pr-2">
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full max-w-full justify-start break-words"
                            onClick={handleDownloadAllDocuments}
                            disabled={bulkActionLoading}
                          >
                            {bulkActionLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Archive className="h-4 w-4 mr-2" />
                            )}
                            <span className="hidden sm:inline">
                              Download All Documents (PDF)
                            </span>
                            <span className="sm:hidden">All Docs</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full max-w-full justify-start break-words"
                            onClick={handleDownloadExcelSheet}
                            disabled={bulkActionLoading}
                          >
                            {bulkActionLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                            )}
                            <span className="hidden sm:inline">
                              Download Excel Sheet
                            </span>
                            <span className="sm:hidden">Excel</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full max-w-full justify-start break-words"
                            onClick={handleDownloadVGMMail}
                            disabled={bulkActionLoading}
                          >
                            {bulkActionLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4 mr-2" />
                            )}
                            <span className="hidden sm:inline">
                              Download VGM Mail (DOC)
                            </span>
                            <span className="sm:hidden">VGM Mail</span>
                          </Button>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>

                {/* Document Preview Panel */}
                <div className="flex-1 h-full overflow-auto">
                  {selectedDocument ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 bg-gray-100 p-4 rounded-b-lg overflow-auto">
                        {documentLoading ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">
                                Loading document preview...
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full border rounded-lg bg-white shadow-sm">
                            <div className="h-full flex items-center justify-center">
                              {selectedDocument.previewUrl ? (
                                <iframe
                                  src={selectedDocument.previewUrl}
                                  className="w-full h-full border-0 rounded-lg"
                                  title={`Preview of ${selectedDocument.name}`}
                                />
                              ) : (
                                <div className="text-center">
                                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                  <p className="text-sm text-muted-foreground">
                                    Preview not available
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Click download to view the document
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Eye className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                          Select a Document
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Choose a document from the list to preview
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading invoice details...</span>
            </div>
          )}

          {/* <CardFooter className="p-6 border-t flex justify-between flex-shrink-0">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            
          </CardFooter> */}
        </DialogContent>


      </Dialog>
    </div>
  );
};

export default Dashboard;

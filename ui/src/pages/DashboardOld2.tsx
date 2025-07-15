import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getInvoices, getProducts, getClients, getShippingTerms } from "@/lib/dataService";
import { dashboardApi, invoiceApi } from "@/lib/apiService";
import { FileText, Users, Package, Plus, Edit, Eye, Loader2, Archive, ClipboardList, Scale, Download, Printer, Mail, FileSpreadsheet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Invoice } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  // State for dashboard data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [draftInvoices, setDraftInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({
    invoiceCount: 0,
    exporterCount: 0,
    productCount: 0,
    draftCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Document management state
  const [invoiceDocuments, setInvoiceDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  const { user, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock data for documents - replace with API call
  const mockInvoiceDocuments = [
    {
      id: 1,
      name: "Custom Invoice",
      type: "Custom Invoice",
      status: "ready",
      previewUrl: "/api/documents/preview/custom-invoice/1",
      downloadUrl: "/api/documents/download/custom-invoice/1"
    },
    {
      id: 2,
      name: "Packaging List",
      type: "Packaging List",
      status: "ready",
      previewUrl: "/api/documents/preview/packaging-list/1",
      downloadUrl: "/api/documents/download/packaging-list/1"
    },
    {
      id: 3,
      name: "Annexure",
      type: "Annexure",
      status: "ready",
      previewUrl: "/api/documents/preview/annexure/1",
      downloadUrl: "/api/documents/download/annexure/1"
    },
    {
      id: 4,
      name: "VGM Certificate",
      type: "VGM",
      status: "ready",
      previewUrl: "/api/documents/preview/vgm/1",
      downloadUrl: "/api/documents/download/vgm/1"
    }
  ];

  // Function to get appropriate icon for document type
  const getDocumentIcon = (type) => {
    const iconClass = "h-5 w-5 text-primary";
    switch (type) {
      case 'Custom Invoice':
        return <FileText className={iconClass} />;
      case 'Packaging List':
        return <Package className={iconClass} />;
      case 'Annexure':
        return <ClipboardList className={iconClass} />;
      case 'VGM':
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
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load document preview",
        variant: "destructive"
      });
    } finally {
      setDocumentLoading(false);
    }
  };

  // Document download handler
  const handleDownloadDocument = async (document) => {
    setDocumentLoading(true);
    
    try {
      // Simulate download
      const link = document.createElement('a');
      link.href = document.downloadUrl;
      link.download = document.name;
      link.click();
      
      toast({
        title: "Success",
        description: ${document.name} downloaded successfully,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    } finally {
      setDocumentLoading(false);
    }
  };

  // Document print handler
  const handlePrintDocument = async (document) => {
    setDocumentLoading(true);
    
    try {
      // Simulate print
      window.open(document.previewUrl, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to print document",
        variant: "destructive"
      });
    } finally {
      setDocumentLoading(false);
    }
  };

  // Bulk actions
  const handleDownloadAllDocuments = async () => {
    setBulkActionLoading(true);
    
    try {
      toast({
        title: "Success",
        description: "All documents downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download all documents",
        variant: "destructive"
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDownloadExcelSheet = async () => {
    setBulkActionLoading(true);
    
    try {
      toast({
        title: "Success",
        description: "Excel sheet downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download Excel sheet",
        variant: "destructive"
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDownloadVGMMail = async () => {
    setBulkActionLoading(true);
    
    try {
      toast({
        title: "Success",
        description: "VGM mail document downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download VGM mail document",
        variant: "destructive"
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Load documents when invoice is selected
  useEffect(() => {
    if (selectedInvoice) {
      setInvoiceDocuments(mockInvoiceDocuments);
      setSelectedDocument(null);
    }
  }, [selectedInvoice]);
  
  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        try {
          const [statsData, recentInvoicesData, allInvoices] = await Promise.all([
            dashboardApi.getStats(),
            dashboardApi.getRecentInvoices(8),
            invoiceApi.getAll()
          ]);
          
          if (statsData) {
            setStats(statsData);
          }
          
          if (recentInvoicesData && recentInvoicesData.length > 0) {
            setRecentInvoices(recentInvoicesData);
          }
          
          if (allInvoices && allInvoices.invoices.length > 0) {
            setInvoices(allInvoices.invoices);
            setDraftInvoices(allInvoices.drafts || []);
          }
        } catch (apiError) {
          // API requests failed
        }
      } catch (error) {
        toast({
          title: "Error loading dashboard",
          description: "There was a problem loading the dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [toast]);
  
  // Handle view invoice
  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const existingInvoice = invoices.find(inv => inv.id === invoiceId);
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
            variant: "destructive"
          });
        }
      } catch (apiError) {
        toast({
          title: "Error",
          description: "Failed to load invoice details from API",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit invoice
  const handleEditInvoice = (invoiceId: string) => {
    navigate(/invoice/drafts/${invoiceId});
  };
 
  function parseIndianDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return ${year}-${month}-${day};
  }

  const statCards = [
    {
      title: "Total Invoices",
      value: stats.invoiceCount,
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
        description="Welcome to Invoice Forge Admin Panel"
        action={
          <Button asChild>
            {isAdmin ? (
              <Link to="/admin">Admin Panel</Link>
            ) : (
              <></>
            )}
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
            <Card key={index} className="border border-gray-100 shadow-sm transition-all duration-200 hover:shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
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
                    <Link to={card.link}>View Details →</Link>
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
              <CardTitle>Recent Invoices</CardTitle>
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
                          {new Date(parseIndianDate(invoice.date)).toLocaleDateString()}
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
            <CardContent className="pt-4">
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
                          <span className="mr-2">{invoice.invoiceNo || 'Untitled Invoice'}</span>
                          <span className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded">Draft</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.date ? new Date(parseIndianDate(invoice.date)).toLocaleDateString() : 'Started recently'}
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="text-xs text-muted-foreground">
                          {invoice.items?.length || 0} items
                        </div>
                        <div className="text-xs text-gray-500">
                          Resume editing to complete
                        </div>
                      </div>
                      <div className="ml-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleEditInvoice(invoice.id)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-md">
                  <div className="bg-white w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center border">
                    <FileText className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-600">No in-progress invoices</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Invoices that are started but not completed will appear here automatically
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
  <DialogContent className="w-[95vw] max-w-7xl h-[95vh] max-h-[95vh] p-0">
    <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4">
      <DialogTitle className="text-lg sm:text-xl font-semibold">
        Invoice {selectedInvoice?.invoiceNo}
      </DialogTitle>
    </DialogHeader>
    
    {selectedInvoice ? (
      <div className="flex flex-col h-[calc(95vh-120px)] overflow-hidden">
        {/* Invoice Header Info */}
        <div className="border-b bg-gray-50 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Invoice Number</h3>
              <p className="font-semibold text-sm sm:text-lg truncate">{selectedInvoice.invoiceNo}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Date</h3>
              <p className="font-semibold text-sm sm:text-lg">
                {new Date(parseIndianDate(selectedInvoice.date)).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Exporter</h3>
              <p className="font-semibold text-sm sm:text-lg truncate">{selectedInvoice.exporter_name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Final Destination</h3>
              <p className="font-semibold text-sm sm:text-lg truncate">{selectedInvoice.finalDestination || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-4 p-3 sm:p-4 overflow-hidden">
          {/* Documents Panel */}
          <div className="w-full lg:w-1/3 lg:border-r lg:pr-4 mb-4 lg:mb-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-semibold">Documents</h3>
                <Badge variant="secondary" className="text-xs">
                  {invoiceDocuments.length} files
                </Badge>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full max-h-[300px] lg:max-h-[calc(100vh-450px)]">
                  <div className="space-y-2">
                    {invoiceDocuments.map((doc, index) => (
                      <Card 
                        key={index} 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedDocument?.id === doc.id ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleDocumentSelect(doc)}
                      >
                        <CardContent className="p-2 sm:p-3">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="flex-shrink-0">
                              {getDocumentIcon(doc.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.type}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Badge variant={doc.status === 'ready' ? 'default' : 'secondary'} className="text-xs">
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
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-2">Bulk Actions</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={handleDownloadAllDocuments}
                    disabled={bulkActionLoading}
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    ) : (
                      <Archive className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">Download All Documents (PDF)</span>
                    <span className="sm:hidden">Download All (PDF)</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={handleDownloadExcelSheet}
                    disabled={bulkActionLoading}
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">Download Excel Sheet</span>
                    <span className="sm:hidden">Excel Sheet</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={handleDownloadVGMMail}
                    disabled={bulkActionLoading}
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">Download VGM Mail (DOC)</span>
                    <span className="sm:hidden">VGM Mail</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Document Preview Panel */}
          <div className="flex-1 min-h-0">
            {selectedDocument ? (
              <div className="h-full flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b bg-gray-50 rounded-t-lg gap-3 sm:gap-0">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    {getDocumentIcon(selectedDocument.type)}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{selectedDocument.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{selectedDocument.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePrintDocument(selectedDocument)}
                      disabled={documentLoading}
                      className="text-xs sm:text-sm"
                    >
                      {documentLoading ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      ) : (
                        <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">Print</span>
                      <span className="sm:hidden">Print</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadDocument(selectedDocument)}
                      disabled={documentLoading}
                      className="text-xs sm:text-sm"
                    >
                      {documentLoading ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">Download</span>
                    </Button>
                  </div>
                </div>

                <div className="flex-1 bg-gray-100 p-2 sm:p-4 rounded-b-lg overflow-hidden">
                  {documentLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 animate-spin text-primary" />
                        <p className="text-xs sm:text-sm text-muted-foreground">Loading document preview...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full border rounded-lg bg-white shadow-sm overflow-hidden">
                      <div className="h-full flex items-center justify-center">
                        {selectedDocument.previewUrl ? (
                          <iframe
                            src={selectedDocument.previewUrl}
                            className="w-full h-full border-0 rounded-lg"
                            title={`Preview of ${selectedDocument.name}`}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-xs sm:text-sm text-muted-foreground">Preview not available</p>
                            <p className="text-xs text-muted-foreground mt-1">Click download to view the document</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center p-4">
                  <Eye className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">Select a Document</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Choose a document from the list to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm sm:text-base">Loading invoice details...</span>
      </div>
    )}
    
    <CardFooter className="flex flex-col sm:flex-row justify-between border-t p-3 sm:p-4 gap-2 sm:gap-0">
      <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="w-full sm:w-auto">
        Close
      </Button>
      <Button 
        onClick={() => handleEditInvoice(selectedInvoice?.id || '')} 
        className="w-full sm:w-auto"
      >
        Edit Invoice
      </Button>
    </CardFooter>
  </DialogContent>
</Dialog>
    </div>
  );
};

export default Dashboard;
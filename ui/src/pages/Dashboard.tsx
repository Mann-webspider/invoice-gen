import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getInvoices, getProducts, getClients, getShippingTerms } from "@/lib/dataService";
import { dashboardApi, invoiceApi } from "@/lib/apiService";
import { FileText, Users, Package, Ship, Plus, Edit, Eye, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Invoice } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

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
  
  const { user, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Load local data first to ensure we have something to display
        const localInvoices = getInvoices();
        const localProducts = getProducts();
        const localClients = getClients();
        
        // Separate completed invoices from drafts
        const completedInvoices = localInvoices.filter(invoice => invoice.status === 'completed' || !invoice.status);
        const drafts = localInvoices.filter(invoice => invoice.status === 'draft');
        
        // Set initial data from local storage
        setStats({
          invoiceCount: completedInvoices.length,
          exporterCount: localClients.length,
          productCount: localProducts.length,
          draftCount: drafts.length
        });
        
        setRecentInvoices(completedInvoices.slice(0, 8));
        setDraftInvoices(drafts.slice(0, 8));
        setInvoices(localInvoices);
        
        // Try to fetch from API in the background
        try {
          const [statsData, recentInvoicesData, allInvoices] = await Promise.all([
            dashboardApi.getStats(),
            dashboardApi.getRecentInvoices(8),
            invoiceApi.getAll()
          ]);
          
          // Update with API data if available
          if (statsData) {
            setStats(statsData);
          }
          
          if (recentInvoicesData && recentInvoicesData.length > 0) {
            setRecentInvoices(recentInvoicesData);
          }
          
          if (allInvoices && allInvoices.length > 0) {
            setInvoices(allInvoices);
          }
        } catch (apiError) {
          // API requests failed, using local data
          // We already have local data loaded, so no need to do anything here
        }
      } catch (error) {
        // Error in dashboard data loading
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
      // Find the invoice in our already loaded data first
      const existingInvoice = invoices.find(inv => inv.id === invoiceId);
      if (existingInvoice) {
        setSelectedInvoice(existingInvoice);
        setViewDialogOpen(true);
        return;
      }
      
      // If not found in memory, try to get from API
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
        // API error fetching invoice - handled with toast
        toast({
          title: "Error",
          description: "Failed to load invoice details from API",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Error in view invoice handler - handled with toast
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
    navigate(`/invoice/edit/${invoiceId}`);
  };
 
  function parseIndianDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;  // ISO format
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
            {isAdmin  ? (
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
          {/* Recent Completed Invoices */}
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
                        {/* <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => handleEditInvoice(invoice.id)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button> */}
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

          {/* Draft Invoices */}
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
      
      {/* Invoice View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoiceNo}</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice ? (
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="border-b pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                      <p className="font-medium">{selectedInvoice.invoiceNo}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                      <p className="font-medium">{new Date(parseIndianDate(selectedInvoice.date)).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Exporter</h3>
                      <p className="font-medium">{selectedInvoice.exporter_name || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Buyer</h3>
                      <p className="font-medium">{selectedInvoice.buyer?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Items */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Items</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left font-medium text-sm">Description</th>
                          <th className="p-2 text-left font-medium text-sm">Quantity</th>
                          <th className="p-2 text-left font-medium text-sm">Unit</th>
                          <th className="p-2 text-right font-medium text-sm">Price</th>
                          <th className="p-2 text-right font-medium text-sm">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items?.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.description}</td>
                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2">{item.unit}</td>
                            <td className="p-2 text-right">
                              {new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "USD",
                              }).format(item.price)}
                            </td>
                            <td className="p-2 text-right">
                              {new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "USD",
                              }).format(item.quantity * item.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50">
                        <tr>
                          <td colSpan={4} className="p-2 text-right font-medium">Total:</td>
                          <td className="p-2 text-right font-bold">
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "USD",
                            }).format(selectedInvoice.totalFOBEuro || 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                
                {/* Shipping Details */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">Shipping Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Shipping Term</h4>
                      <p>{selectedInvoice.shippingTerm || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Port of Loading</h4>
                      <p>{selectedInvoice.portOfLoading || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Port of Discharge</h4>
                      <p>{selectedInvoice.portOfDischarge || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Final Destination</h4>
                      <p>{selectedInvoice.finalDestination || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading invoice details...</span>
            </div>
          )}
          
          <CardFooter className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => handleEditInvoice(selectedInvoice?.id || '')}>Edit Invoice</Button>
          </CardFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

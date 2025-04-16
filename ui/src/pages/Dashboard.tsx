import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvoices, getProducts, getClients, getShippingTerms } from "@/lib/dataService";
import { FileText, Users, Package, Ship, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const invoices = getInvoices();
  const products = getProducts();
  const clients = getClients();
  const shippingTerms = getShippingTerms();

  const statCards = [
    {
      title: "Total Invoices",
      value: invoices.length,
      icon: FileText,
      link: "/invoice",
      color: "bg-blue-500",
    },
    {
      title: "Total Exporters",
      value: clients.length,
      icon: Users,
      link: "/clients",
      color: "bg-green-500",
    },
    {
      title: "Total Products",
      value: products.length,
      icon: Package,
      link: "/products",
      color: "bg-purple-500",
    },
    {
      title: "Shipping Terms",
      value: shippingTerms.length,
      icon: Ship,
      link: "/shipping",
      color: "bg-amber-500",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome to Invoice Forge Admin Panel"
        action={
          <Button asChild>
            <Link to="/admin">Admin Panel</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <Card key={index} className="border-t-4" style={{ borderTopColor: card.color.replace('bg-', '') }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">{card.value}</div>
                <card.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild 
                  className="px-0 text-muted-foreground hover:text-foreground"
                >
                  <Link to={card.link}>View Details →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="w-full relative">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <Button size="sm" className="rounded-full w-10 h-10 p-0" asChild>
            <Link to="/invoice">
              <Plus className="h-5 w-5" />
              <span className="sr-only">Add Invoice</span>
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.slice(0, 8).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{invoice.invoiceNo}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "USD",
                      }).format(invoice.totalFOBEuro)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {invoice.items.length} items
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No invoices created yet</p>
              <Button asChild className="mt-4">
                <Link to="/invoice">Add Invoice</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

const AddClient = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Client"
        description="Create a new client for invoices"
      />
      <Card>
        <CardContent className="p-6">
          <p>Client creation form will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddClient; 
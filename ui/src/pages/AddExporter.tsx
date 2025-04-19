import React from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

const AddExporter = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Exporter"
        description="Create a new exporter for invoices"
      />
      <Card>
        <CardContent className="p-6">
          <p>Exporter creation form will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddExporter; 
import React from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from 'react-router-dom';

const InvoiceEditor = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Invoice"
        description={`Editing invoice #${id}`}
      />
      <Card>
        <CardContent className="p-6">
          <p>Invoice editing functionality will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceEditor; 
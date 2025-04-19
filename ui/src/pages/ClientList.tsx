import React from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

const ClientList = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Client List"
        description="Manage your clients"
      />
      <Card>
        <CardContent className="p-6">
          <p>Client list will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientList; 
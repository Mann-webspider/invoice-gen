import React from 'react';
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

const ExporterList = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Exporter List"
        description="Manage your exporters"
      />
      <Card>
        <CardContent className="p-6">
          <p>Exporter list will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExporterList; 
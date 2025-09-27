import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExporterSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  exporterData: {
    invoiceNo: string;
    email: string;
    taxid: string;
    ieCode: string;
    panNo: string;
    gstinNo: string;
    stateCode: string;
    selectedExporter: string;
  };
  exporters: string[];
  onExporterDataChange: (field: string, value: string) => void;
}

export const ExporterSection: React.FC<ExporterSectionProps> = ({
  isExpanded,
  onToggle,
  exporterData,
  exporters,
  onExporterDataChange
}) => {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <CardTitle className="flex items-center justify-between">
          Exporter Details
          {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNo">Invoice No</Label>
              <Input
                id="invoiceNo"
                value={exporterData.invoiceNo}
                onChange={(e) => onExporterDataChange('invoiceNo', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={exporterData.email}
                onChange={(e) => onExporterDataChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="exporter">Exporter</Label>
              <Select
                value={exporterData.selectedExporter}
                onValueChange={(value) => onExporterDataChange('selectedExporter', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exporter" />
                </SelectTrigger>
                <SelectContent>
                  {exporters.map((exporter) => (
                    <SelectItem key={exporter} value={exporter}>
                      {exporter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gstinNo">GSTIN No</Label>
              <Input
                id="gstinNo"
                value={exporterData.gstinNo}
                onChange={(e) => onExporterDataChange('gstinNo', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

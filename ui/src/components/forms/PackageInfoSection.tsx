'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import React from "react";

interface Supplier {
  id: string;
  name: string;
  gstin: string;
  invoiceNo: string;
  date: string;
}

interface PackageInfoSectionProps {
  noOfPackages: string;
  grossWeight: string;
  netWeight: string;
  exportUnderGstCircular: string;
  setExportUnderGstCircular: (val: string) => void;
  integratedTaxOption: string;
  lutNo: string;
  setLutNo: (val: string) => void;
  lutDate: string;
  setLutDate: (val: string) => void;
  totalFOBEuro: number;
  amountInWords: string;
 
  
}

const PackageInfoSection: React.FC<PackageInfoSectionProps> = ({
  noOfPackages,
  grossWeight,
  netWeight,
  exportUnderGstCircular,
  setExportUnderGstCircular,
  integratedTaxOption,
  lutNo,
  setLutNo,
  lutDate,
  setLutDate,
  totalFOBEuro,
  amountInWords,
  
}) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Package Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "noOfPackages", label: "No. of Packages", value: noOfPackages, placeholder: "e.g., 14000 BOX" },
              { id: "grossWeight", label: "Gross Weight (KGS)", value: grossWeight, placeholder: "Enter gross weight" },
              { id: "netWeight", label: "Net Weight (KGS)", value: netWeight, placeholder: "Enter net weight" }
            ].map((field) => (
              <div className="space-y-2" key={field.id}>
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  value={field.value}
                  readOnly
                  className="cursor-default"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exportUnderGstCircular">Export Under GST Circular</Label>
              <Input
                id="exportUnderGstCircular"
                value={exportUnderGstCircular}
                onChange={(e) => setExportUnderGstCircular(e.target.value)}
                placeholder="Enter GST circular details"
              />
            </div>

            {integratedTaxOption === "WITHOUT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lutNo">Application Reference Number</Label>
                  <Input
                    id="lutNo"
                    value={lutNo}
                    onChange={(e) => setLutNo(e.target.value)}
                    placeholder="Enter LUT number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lutDate">LUT Date</Label>
                  <Input
                    id="lutDate"
                    value={lutDate}
                    onChange={(e) => setLutDate(e.target.value)}
                    placeholder="Enter LUT date"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalFOBEuro">TOTAL FOB EURO</Label>
              <Input
                id="totalFOBEuro"
                value={totalFOBEuro.toFixed(2)}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountInWords">Amount In Words</Label>
              <Input
                id="amountInWords"
                value={amountInWords}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      
      
    </>
  );
};

export default PackageInfoSection;

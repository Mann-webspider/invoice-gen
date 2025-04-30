'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import React, { useEffect } from "react";
import { useForm } from "@/context/FormContext";

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
  paymentTerms: string;
  selectedCurrency: string;
  exportUnderGstCircular: string;
  sections: any[];
  totalSQM: number;

  setExportUnderGstCircular: (val: string) => void;
  integratedTaxOption: string;
  arnNo: string;
  setLutNo: (val: string) => void;
  lutNo: string;
  lutDate: string;
  setLutDate: (val: string) => void;
  totalFOBEuro: number;
  amountInWords: string;
 
  
}

const PackageInfoSection: React.FC<PackageInfoSectionProps> = ({
  noOfPackages,
  grossWeight,
  netWeight,
  paymentTerms,
  selectedCurrency,
  exportUnderGstCircular,
  sections,
  totalSQM,
  setExportUnderGstCircular,
  integratedTaxOption,
  lutNo,
  setLutNo,
  lutDate,
  setLutDate,
  totalFOBEuro,
  amountInWords,
  
}) => {

  const {formData, setInvoiceData} = useForm();
  useEffect(() => {
    setInvoiceData({
      ...formData.invoice,
      package: {
        no_of_packages: noOfPackages,
        gross_weight: grossWeight,
        net_weight: netWeight,
        gst_circular: exportUnderGstCircular,
        integrated_tax_option: integratedTaxOption,
        arn_no: lutNo,
        lut_date: lutDate,
        total_fob: totalFOBEuro,
        amount_in_words: amountInWords,
        payment_terms: paymentTerms,
        selected_currency: selectedCurrency,
        total_sqm: totalSQM,

      }
    });
  }, [formData, noOfPackages, grossWeight, netWeight, exportUnderGstCircular, integratedTaxOption, lutNo, lutDate, totalFOBEuro, amountInWords, paymentTerms, selectedCurrency, totalSQM]);
  return (
    <>
      <Card>
          <CardHeader>
            <CardTitle>Package Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="noOfPackages">No. of Packages</Label>
                <Input
                  id="noOfPackages"
                  value={(() => {
                    // Calculate total quantity by summing all items' quantities
                    const totalQuantity = sections.reduce(
                      (total, section) => 
                        total + section.items.reduce(
                          (sectionTotal, item) => sectionTotal + item.quantity, 
                          0
                        ), 
                      0
                    );
                    // Use unit type of first item if available
                    const firstItem = sections.find(s => s.items.length > 0)?.items[0];
                    const unitType = firstItem?.unitType || "BOX";
                    return `${totalQuantity} ${unitType.toUpperCase()}`;
                  })()}
                  readOnly
                  className="cursor-default"
                  placeholder="e.g., 14000 BOX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noOfPackages">No. of SQMs</Label>
                <Input
                  id="noOfSQMs"
                  value={`${totalSQM.toFixed(2)} SQM`}
                  readOnly
                  className="cursor-default"
                  placeholder="e.g., 20.16 SQM"
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="netWeight">Net Weight (KGS)</Label>
                <Input
                  id="netWeight"
                  readOnly
                  className="cursor-default"
                  value={netWeight}
                  placeholder="Auto-filled from packaging list"
                />
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="grossWeight">Gross Weight (KGS)</Label>
                    <Input
                      id="grossWeight"
                      value={grossWeight}
                      readOnly
                      className="cursor-default"
                      placeholder="Auto-filled from packaging list"
                    />
                  </div>
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

                  {integratedTaxOption !== "WITHOUT" && (
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
                          type="date"
                          onChange={(e) => setLutDate(e.target.value)}
                          placeholder="Enter LUT date"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalFOBEuro">TOTAL {paymentTerms} {selectedCurrency}</Label>
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

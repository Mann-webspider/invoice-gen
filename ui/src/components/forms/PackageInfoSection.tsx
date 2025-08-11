"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import React, { useEffect } from "react";
import { useForm } from "@/context/FormContext";
import api from "@/lib/axios";

import { Controller, useForm as rhf, UseFormReturn,useFormContext } from "react-hook-form";
interface Supplier {
  id: string;
  name: string;
  gstin: string;
  invoiceNo: string;
  date: string;
}

interface PackageInfoSectionProps {
  paymentTerms: string;
  selectedCurrency: string;
  exportUnderGstCircular: string;
  sections: any[];
  totalSQM: number;
  setExportUnderGstCircular: (val: any) => void;
  integratedTaxOption: string;
  arnNo?: string;
  setLutNo: (val: string) => void;
  lutNo: string;
  lutDate: string;

  totalFOBEuro: number;
  amountInWords: string;
  currencyRate: number;
  form: UseFormReturn;
}

const PackageInfoSection = ({
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

  totalFOBEuro,
  amountInWords,
  currencyRate,
  form,
}: PackageInfoSectionProps) => {
  const { formData, setInvoiceData } = useForm();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    
    watch,
    formState: { errors },
  } = useFormContext();
  const packageForm = watch("invoice.package");
  // const productForm = watch("products");

  // Calculate tax values when integratedTaxOption is "WITH"
 let currencyRateValue = watch("invoice.currency_rate") // Default to 1 if currencyRate is not provided
 
 
  
  const taxableValue =
    integratedTaxOption === "WITH" ? totalFOBEuro * currencyRateValue : 0;
  const gstAmount = taxableValue * 0.18; // 18% GST
  useEffect(() => {
    
    setValue("invoice.package.total_fob", 
  typeof totalFOBEuro === 'number' && !isNaN(totalFOBEuro)
    ? totalFOBEuro.toFixed(2)
    : "0.00"
);
    setValue("invoice.package.amount_in_words", amountInWords);
    setValue("invoice.package.gst_amount", gstAmount.toFixed(2));
    setValue("invoice.package.taxable_value", taxableValue.toFixed(2));
    setValue("invoice.package.total_sqm", typeof totalSQM === 'number' ? totalSQM.toFixed(2) : totalSQM);
  }, [totalFOBEuro, amountInWords, setValue]);
  // useEffect(() => {
  //   setInvoiceData({
  //     ...formData.invoice,
  //     package: {
  //       no_of_packages: noOfPackages,
  //       gross_weight: grossWeight,
  //       net_weight: netWeight,
  //       gst_circular: exportUnderGstCircular,
  //       integrated_tax_option: integratedTaxOption,
  //       arn_no: lutNo,
  //       lut_date: format(lutDate, 'dd/MM/yyyy'),
  //       total_fob: totalFOBEuro,
  //       amount_in_words: amountInWords,
  //       payment_terms: paymentTerms,
  //       selected_currency: selectedCurrency,
  //       total_sqm: totalSQM,
  //       taxable_value: taxableValue,
  //       gst_amount: gstAmount,
  //     }
  //   });
  // }, [formData, noOfPackages, grossWeight, netWeight, exportUnderGstCircular, integratedTaxOption, lutNo, lutDate, totalFOBEuro, amountInWords, paymentTerms, selectedCurrency, totalSQM, taxableValue, gstAmount]);
  useEffect(() => {
    const totalQuantity = sections.reduce(
      (total, section) =>
        total +
        section.items.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        ),
      0
    );

    const totalSQM = sections.reduce(
      (total, section) =>
        total +
        section.items.reduce(
          (sum, item) => sum + Number(item.totalSQM || 0),
          0
        ),
      0
    );

    const firstItem = sections.find((s) => s.items.length > 0)?.items[0];
    const unitType = firstItem?.unitType || "BOX";

    setValue("invoice.package.no_of_packages", `${totalQuantity} ${unitType}`);
    setValue("invoice.package.no_of_sqm", totalSQM.toFixed(2));
  }, [sections, setValue]);

  // fetch arn and set its value
  async function fetchArn() {
    try {
      const response = await api.get(`arn/1`);
      if (response.status != 200) {
        throw new Error("Network response was not ok");
      }
      console.log("ARN response:", response.data);
      
      setExportUnderGstCircular(() => response.data.data.gst_circular);
      setValue("invoice.package.gst_circular", response.data.data.gst_circular);
      setValue("invoice.package.arn_no", response.data.data.arn);
      setLutNo(response.data.data.arn);
    } catch (error) {
      // Error fetching ARN - handled silently
    }
  }
  useEffect(() => {
    fetchArn();
  }, []);

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
                {...register("invoice.package.no_of_packages", {
                  required: "No. of packages is required",
                })}
                readOnly
                className="cursor-default"
                placeholder="e.g., 14000 BOX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noOfSQm">No. of SQMs</Label>
              <Input
                id="noOfSQMs"
                {...register("invoice.package.no_of_sqm", {
                  required: "No. of SQMs is required",
                })}
                readOnly
                className="cursor-default"
                placeholder="e.g., 20.16 SQM"
              />
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="grossWeight">Gross Weight (KGS)</Label>
              <Input
                id="grossWeight"
                value={packageForm?.gross_weight || grossWeight}
                // {...register("package.gross_weight",{required: "Gross weight is required"})}
                readOnly
                className="cursor-default"
              />
            </div> */}

            {/* <div className="space-y-2">
              <Label htmlFor="netWeight">Net Weight (KGS)</Label>
              <Input
                id="netWeight"
                // {...register("package.net_weight",{required: "Net weight is required"})}
                value={packageForm?.net_weight || netWeight}
                readOnly
                className="cursor-default"
              />
            </div> */}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exportUnderGstCircular">
                Export Under GST Circular
              </Label>
              <Input
                id="exportUnderGstCircular"
                readOnly={true}
                {...register("invoice.package.gst_circular", {
                  required: "GST circular is required",
                })}
                value={packageForm?.gst_circular || exportUnderGstCircular}
                // onChange={(e) => setExportUnderGstCircular(e.target.value)}
                placeholder="Enter GST circular details"
              />
            </div>

            {integratedTaxOption === "WITH" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taxable Value (INR)</Label>
                    <Input
                      value={
                        packageForm?.taxable_value || taxableValue.toFixed(2)
                      }
                      {...register("invoice.package.taxable_value", {
                        required: "Taxable value is required",
                      })}
                      readOnly
                      className="cursor-default"
                    />
                    {errors.package?.taxable_value && (
                      <span className="text-red-500 text-sm">
                        {errors.package.taxable_value.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>GST Amount @ 18% (INR)</Label>
                    <Input
                      value={packageForm?.gst_amount || gstAmount.toFixed(2)}
                      {...register("invoice.package.gst_amount", {
                        required: "GST amount is required",
                      })}
                      readOnly
                      className="cursor-default"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lutNo">Application Reference Number</Label>
                  <Input
                    id="lutNo"
                    value={packageForm?.arn_no || lutNo}
                    {...register("invoice.package.arn_no", {
                      required: "ARN is required",
                    })}
                    // onChange={(e) => setLutNo(e.target.value)}
                    placeholder="Enter LUT number"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lutDate">LUT Date</Label>
                  <Input
                    id="lutDate"
                    type="date"
                    value={packageForm?.lut_date || new Date(lutDate).toISOString().split("T")[0]}
                    {...register("invoice.package.lut_date", {
                      required: "LUT date is required",
                    })}
                    // onChange={(e) => setLutDate(e.target.value)}
                    placeholder="Enter LUT date"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalFOBEuro">
                TOTAL {paymentTerms} {selectedCurrency}
              </Label>
              <Input
                id="totalFOBEuro"
                value={packageForm?.total_fob || totalFOBEuro.toFixed(2)}
                {...register("invoice.package.total_fob")}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountInWords">Amount In Words</Label>
              <Input
                id="amountInWords"
                value={amountInWords}
                {...register("invoice.package.amount_in_words")}
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

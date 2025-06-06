"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "@/context/FormContext";
import { Controller, useForm as rhf, UseFormReturn } from "react-hook-form";
interface Supplier {
  id: string;
  name: string;
  gstin_number: string;
  tax_invoice_number?: string;
  date?: string;
  authorizedName?: string;
  authorizedGstin?: string;
  contactNo?: string;
}

interface SupplierDetailsProps {
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  integratedTaxOption: "WITH" | "WITHOUT";
  setSelectedSupplier?: (suppliers: Array<object>) => void;
  selectedSupplier?: Array<object>;
  setAuthorizedName?: (name: string) => void;
  setAuthorizedGstin?: (gstin: string) => void;
  setGstInvoiceNoDate?: (date: string) => void;
  form: UseFormReturn;
}

async function getSuppliers() {
  let res = await api.get("/supplier");
  if (res.status !== 200) return "error";
  return res.data.data;
}

export const SupplierDetails = ({
  suppliers,
  setSuppliers,
  integratedTaxOption,
  setSelectedSupplier,
  selectedSupplier,
  setAuthorizedName,
  setAuthorizedGstin,
  setGstInvoiceNoDate,
  form
}: SupplierDetailsProps) => {
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const { formData, setInvoiceData } = useForm();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const supplierForm = watch("suppliers");
  // Load supplier options from backend
  useEffect(() => {
    (async () => {
      try {
        const fetched = await getSuppliers();
        setAvailableSuppliers(fetched);
      } catch (error) {
        // Failed to fetch suppliers - handled with toast
      }
    })();
  }, []);

  // Sync suppliers with formData
  // useEffect(() => {
  //   // Only update the form data if the integratedTaxOption is "WITHOUT"
  //   if (integratedTaxOption === "WITHOUT") {
  //     setInvoiceData((prev) => ({
  //       ...prev,
  //       invoice: {
  //         ...prev.invoice,
  //         supplier: suppliers.map((s) => ({
  //           id: s.id,
  //           name: s.name,
  //           gstin_number: s.gstin_number,
  //           tax_invoice_number: s.tax_invoice_number || "",
  //           date: s.date || "",
  //           authorizedName: s.name || "ABC",
  //           authorizedGstin: s.gstin_number || "XXXXXXXXXXXX",
  //           contactNo: s.contactNo || "",
  //         })),
  //       },
  //     }));
  //   }

  //   // Update selectedSupplier state if the prop exists
  //   if (setSelectedSupplier) {
  //     setSelectedSupplier(suppliers);
  //   }

  //   // Update other supplier-related states if they exist and if there are suppliers
  //   if (suppliers.length > 0 && suppliers[0].name) {
  //     if (setAuthorizedName) {
  //       setAuthorizedName(suppliers[0].name || "ABC");
  //     }
  //     if (setAuthorizedGstin) {
  //       setAuthorizedGstin(suppliers[0].gstin_number || "XXXXXXXXXXXX");
  //     }
  //     if (setGstInvoiceNoDate) {
  //       setGstInvoiceNoDate(
  //         `GST/${suppliers[0].tax_invoice_number || "XXX"} ${
  //           suppliers[0].date || "XX.XX.XXXX"
  //         }`
  //       );
  //     }
  //   }
  // }, [
  //   suppliers,
  //   setSelectedSupplier,
  //   setAuthorizedName,
  //   setAuthorizedGstin,
  //   setGstInvoiceNoDate,
  //   integratedTaxOption,
  // ]);

  const handleSupplierSelect = (value: string, supplierId: string) => {
    const selected = availableSuppliers.find((s) => s.name === value);
    if (!selected) return;

    const updated = suppliers.map((s) =>
      s.id === supplierId
        ? {
            ...selected,
            id: s.id, // preserve ID
            tax_invoice_number: s.tax_invoice_number || "",
            date: s.date || "",
          }
        : s
    );
    setValue(`suppliers.${supplierId-1}.name`, selected.name);
    setValue(`suppliers.${supplierId-1}.gstin_number`, selected.gstin_number);
    setSuppliers(updated);
  };

  return (
    <>
      {integratedTaxOption === "WITHOUT" && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  setSuppliers([
                    ...suppliers,
                    {
                      id: (suppliers.length + 1).toString(),
                      name: "",
                      gstin_number: "",
                      tax_invoice_number: "",
                      date: "",
                    },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </div>

            {suppliers.map((supplier, index) => (
  <div key={supplier.id} className="border p-4 rounded-lg">
    <div className="flex justify-between items-center mb-4">
      <h4 className="font-medium">SUPPLIER DETAILS :- {index + 1}</h4>
      {suppliers.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setSuppliers(suppliers.filter((s) => s.id !== supplier.id))
          }
        >
          <Trash className="h-4 w-4" />
        </Button>
      )}
    </div>

    <div className="space-y-4">
      {/* Name (not RHF since it's from backend selection) */}
      <div className="space-y-2">
        <Label>NAME :</Label>
        <Controller
  control={control}
  name={`suppliers.${index}.name`}
  defaultValue={supplier.name}
  render={({ field }) => (
    <Select
      value={field.value}
      onValueChange={(value) => {
        field.onChange(value);
        handleSupplierSelect(value, supplier.id); // still updates `setSuppliers`
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select supplier" />
      </SelectTrigger>
      <SelectContent>
        {availableSuppliers.map((s) => (
          <SelectItem key={s.id} value={s.name}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
/>
      </div>

      {/* GSTIN (read-only) */}
      <div className="space-y-2">
        <Label>GSTIN NO. :</Label>
        <Input value={supplier.gstin_number} readOnly />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>TAX INVOICE NO :</Label>
          <Input
            {...register(`suppliers.${index}.tax_invoice_number`)}
            defaultValue={supplier.tax_invoice_number}
          />
        </div>
        <div className="space-y-2">
          <Label>DATE :</Label>
          <Input
            type="date"
            {...register(`suppliers.${index}.date`)}
            defaultValue={supplier.date}
          />
        </div>
      </div>
    </div>
  </div>
))}

          </CardContent>
        </Card>
      )}
    </>
  );
};
export default SupplierDetails;

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
import { Controller, useForm as rhf, UseFormReturn,useFormContext } from "react-hook-form";
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
  } = useFormContext();
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

 const handleSupplierSelect = (value: string, supplierId: string) => {
  const selected = availableSuppliers.find((s) => s.name === value);
  if (!selected) return;

  const updated = suppliers.map((s) =>
    s.id === supplierId
      ? {
          ...selected,
          id: s.id, // preserve original ID
          tax_invoice_number: s.tax_invoice_number || "",
          date: s.date || "",
        }
      : s
  );

  const index = suppliers.findIndex((s) => s.id === supplierId);
  if (index === -1) return;

  setValue(`suppliers.${index}.name`, selected.name);
  setValue(`suppliers.${index}.gstin_number`, selected.gstin_number);
  setValue(`suppliers.${index}.address`, selected.address);
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

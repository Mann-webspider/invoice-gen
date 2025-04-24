'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import React, { useEffect } from "react";
import api from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
interface Supplier {
  id: string;
  name: string;
  gstin: string;
  invoiceNo: string;
  date: string;
}
async function getSuppliers() {
  let res = await api.get("/supplier")
  if (res.status !== 200) {
    return "error"
  }
  return res.data
}
let supplierList = []
export const SupplierDetails = ({
  suppliers,
  setSuppliers,
  integratedTaxOption,
  setAuthorizedName,
  setAuthorizedGstin,
  setGstInvoiceNoDate,
  selectedSupplier,
  setSelectedSupplier
}) => {

  useEffect(() => {
    (async () => {
      try {
        const supplier = await getSuppliers();
        console.log(supplier);
        setSuppliers(supplier);
      }
      catch (error) {
        console.error("Failed to fetch exporters:", error);
      }
    })()
  }, [])
  return (
    <>
      {integratedTaxOption === "WITHOUT" && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex-grow" />
              <Button
                variant="outline"
                onClick={() => {
                  supplierList.push(
                   
                    {
                      id: (suppliers.length + 1).toString(),
                      supplier_name: '',
                      gstin_number: '',
                      tax_invoice_no: '',
                      date: '',
                    }
                  );
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </div>

            {supplierList.map((supplier, index) => (
              <div key={supplier.id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">SUPPLIER DETAILS :- {index + 1}</h4>
                  {supplierList.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        supplierList = supplierList.filter(s => s.id !== supplier.id);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${supplier.id}`}>NAME :</Label>
                    <Select
                      value={selectedSupplier.supplier_name}
                      onValueChange={(value) => setSelectedSupplier({ ...selectedSupplier, supplier_name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exporter" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.supplier_name}>
                            {supplier.supplier_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* <Input
                      id={`name-${supplier.id}`}
                      value={supplier.supplier_name}
                      onChange={(e) => {
                        const updatedSuppliers = suppliers.map(s =>
                          s.id === supplier.id ? { ...s, supplier_name: e.target.value } : s
                        );
                        setSuppliers(updatedSuppliers);
                        if (index === 0) setAuthorizedName(e.target.value);
                      }}
                      placeholder="Enter supplier name"
                    /> */}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`gstin-${supplier.id}`}>GSTIN NO. :</Label>
                    <Input
                      id={`gstin-${supplier.id}`}
                      value={suppliers.find(s => s.id === supplier.id)?.gstin_number}
                      onChange={(e) => {
                        const updatedSuppliers = suppliers.map(s =>
                          s.id === supplier.id ? { ...s, gstin_number: e.target.value } : s
                        );
                        setSuppliers(updatedSuppliers);
                        if (index === 0) setAuthorizedGstin(e.target.value);
                      }}
                      placeholder="Enter GSTIN number"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`invoiceNo-${supplier.id}`}>TAX INVOICE NO :</Label>
                      <Input
                        id={`invoiceNo-${supplier.id}`}
                        value={supplier.tax_invoice_no}
                        onChange={(e) => {
                          const updatedSuppliers = suppliers.map(s =>
                            s.id === supplier.id ? { ...s, tax_invoice_no: e.target.value } : s
                          );
                          setSuppliers(updatedSuppliers);
                          if (index === 0) setGstInvoiceNoDate(`${e.target.value} ${supplier.date}`);
                        }}
                        placeholder="Enter tax invoice number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`date-${supplier.id}`}>DATE :</Label>
                      <Input
                        id={`date-${supplier.id}`}
                        type="date"
                        value={supplier.date}
                        onChange={(e) => {
                          const updatedSuppliers = suppliers.map(s =>
                            s.id === supplier.id ? { ...s, date: e.target.value } : s
                          );
                          setSuppliers(updatedSuppliers);
                          if (index === 0) setGstInvoiceNoDate(`${supplier.tax_invoice_no} ${e.target.value}`);
                        }}
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
  )
}
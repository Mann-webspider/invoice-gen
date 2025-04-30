'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "@/context/FormContext";


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
  setAuthorizedName: (name: string) => void;
  setAuthorizedGstin: (gstin: string) => void;
  setGstInvoiceNoDate: (date: string) => void;
  selectedSupplier: object;
  setSelectedSupplier: (supplier: object) => void;
}

async function getSuppliers() {
  let res = await api.get("/supplier")
  if (res.status !== 200) {
    return "error"
  }
  return res.data.data
}

export const SupplierDetails = ({
  suppliers,
  setSuppliers,
  integratedTaxOption,
  setAuthorizedName,
  setAuthorizedGstin,
  setGstInvoiceNoDate,
  selectedSupplier,
  setSelectedSupplier
}: SupplierDetailsProps) => {
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const {formData, setInvoiceData} = useForm()
  useEffect(() => {
    (async () => {
      try {
        const fetchedSuppliers = await getSuppliers();
        setAvailableSuppliers(fetchedSuppliers);
      }
      catch (error) {
        console.error("Failed to fetch suppliers:", error);
      }
    })()
  }, []);
  useEffect(()=>{
    setInvoiceData({
      ...formData.invoice,
      supplier: selectedSupplier
    })
  },[selectedSupplier])
  

  const handleSupplierSelect = (value: string, supplierId: string, index: number) => {
    const selectedSupplier = availableSuppliers.find(s => s.name === value);
    setSuppliers(suppliers.map(s =>
      s.id === supplierId
        ? {
            ...selectedSupplier,
            name: value,
            gstin_number: selectedSupplier?.gstin_number || '',
          }
        : s
    ));
    
    
  };

  return (
    <>
      {integratedTaxOption === "WITHOUT" && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex-grow"></div>
              <Button
                variant="outline"
                onClick={() => {
                  setSuppliers([...suppliers, {
                    id: (suppliers.length + 1).toString(),
                    name: '',
                    gstin_number: '',
                    tax_invoice_number: '',
                    date: '',
                    authorizedName: '',
                    authorizedGstin: '',
                    contactNo: ''
                  }]);
                }}
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
                      onClick={() => {
                        setSuppliers(suppliers.filter(s => s.id !== supplier.id));
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
                      value={supplier.name}
                      onValueChange={(value) => handleSupplierSelect(value, supplier.id, index)}
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`gstin-${supplier.id}`}>GSTIN NO. :</Label>
                    <Input
                      id={`gstin-${supplier.id}`}
                      value={supplier.gstin_number}
                      readOnly
                      onChange={(e) => {
                        setSelectedSupplier(suppliers.map(s =>
                          s.id === supplier.id
                            ? { ...s, gstin_number: e.target.value,id:supplier.id }
                            : s
                        ));
                      }}
                    />
                  
                   
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`invoiceNo-${supplier.id}`}>TAX INVOICE NO :</Label>
                      <Input
                        id={`invoiceNo-${supplier.id}`}
                        value={supplier.tax_invoice_number}
                        onChange={(e) => {
                          setSelectedSupplier(()=>suppliers.map(s =>
                            s.id === supplier.id
                              ? { ...s, tax_invoice_number: e.target.value }
                              : s
                          ));
                          
                        }}
                      />
                    
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`date-${supplier.id}`}>DATE :</Label>
                      <Input
                        id={`date-${supplier.id}`}
                        value={supplier.date}
                        type="date"
                        onChange={(e) => {
                          setSelectedSupplier(suppliers.map(s =>
                            s.id === supplier.id
                              ? { ...s, date: e.target.value }
                              : s
                          ));
                          
                        }}
                      />
                    </div>
                    <Button variant="outline" onClick={()=>{
                      console.log(formData.invoice);
                    }}>
                      show
                    </Button>
                      
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
// components/ExporterInfo.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import api from "@/lib/axios";
import { useForm } from "@/context/FormContext";
import { Controller, useForm as rhf,UseFormReturn,useFormContext  } from "react-hook-form";

interface ExporterInfoProps {
  
  exporters: object[];
  
  invoiceNo: string;
  
  setExporters: (val: any[]) => void;
  
  form: UseFormReturn
}
async function getExporters() {
  let res = await api.get("/exporter");
  if (res.status !== 200) {
    return "error";
  }
  return res.data.data;
}

const ExporterInfo: React.FC<ExporterInfoProps> = ({
  
  exporters,
  invoiceNo,
  
  setExporters,
  
 
  form
}) => {
  const { formData, setInvoiceData } = useForm();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } =  useFormContext();
  const selectedExporter2 = watch("invoice.exporter");
  // useEffect(() => {
  //   const subscribe = watch((value) => {
  //     console.log(value);
  //   });
  //   return () => subscribe.unsubscribe();
  // }, [watch]);

  useEffect(() => {
    (async () => {
      try {
        const exporter_res = await getExporters();
        // Fetched exporters
        setExporters(exporter_res);
      } catch (error) {
        // Failed to fetch exporters - handled silently
      }
    })();
  }, []);

  const handleExporterSelect = (company_name: string) => {
    const exporterObj = exporters.find((e) => e.company_name === company_name);
    if (exporterObj) {
      setValue("invoice.exporter", exporterObj); // update exporter object in form
      // Convert invoiceDate to local date string (MM/DD/YYYY)
      // const localInvoiceDate = new Date(
      //   exporterObj.invoiceDate
      // ).toLocaleDateString();

      // setValue("invoice_date", localInvoiceDate);
      setValue("invoice.invoice_number", exporterObj.next_invoice_number || ""); // set invoice number outside exporter
    }
  };

 

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exporter Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="companyName">EXPORTER</Label>
                
              </div>
              <Controller
                name="invoice.exporter"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value?.company_name || ""}
                    onValueChange={handleExporterSelect}
                  >
                    <SelectTrigger
                      className={errors.exporter ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select exporter" />
                    </SelectTrigger>
                    <SelectContent>
                      {exporters.map((exp) => (
                        <SelectItem key={exp.id} value={exp.company_name}>
                          {exp.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">COMPANY ADDRESS</Label>
              <Textarea
                id="companyAddress"
                value={selectedExporter2?.company_address || ""}
                readOnly
                className="bg-gray-50"
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">EMAIL</Label>
              <Input
                id="email"
                value={selectedExporter2?.email || ""}
                // onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., yourmail@gmail.com"
                required
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax id">Tax ID:</Label>
              <Input
                id="taxid"
                value={selectedExporter2?.tax_id || ""}
                // onChange={(e) => setTaxid(e.target.value)}
                placeholder="e.g., 24AACF*********"
                required
                readOnly
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="invoiceNo">INVOICE NUMBER</Label>
                  
                </div>
                <Input
                  id="invoiceNo"
                  value={
                    invoiceNo || selectedExporter2?.next_invoice_number || ""
                  }
                  // onChange={(e) => setInvoiceNo(e.target.value)}
                  {...register("invoice.invoice_number", {
                    required: true,
                  })}
                  placeholder="Enter invoice number"
                  // className={hasInvoiceNumberError ? "border-red-500" : ""}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>INVOICE DATE</Label>
                  
                </div>
                <Controller
                  name="invoice.invoice_date"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                            errors.invoice_date && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? field.value : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            const handleDateChange = (date: Date | undefined) => {
                                if (date) {
                                  // ✅ Use local timezone instead of UTC to avoid date shifting
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  const formatted = `${day}/${month}/${year}`; // yyyy-mm-dd
                                  
                                  field.onChange(formatted);
                                  
                                }
                              };
                            if (date) {
                              handleDateChange(date);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />

                {errors.invoice_date && (
                  <span className="text-red-500 text-sm">Required</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">EXPORTER'S REF.</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ieCode">I.E. CODE #</Label>
                  <Input
                    id="ieCode"
                    value={selectedExporter2?.ie_code || ""}
                    // onChange={(e) => setIeCode(e.target.value)}
                    placeholder="Enter IE code"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panNo">PAN NO. #</Label>
                  <Input
                    id="panNo"
                    value={selectedExporter2?.pan_number || ""}
                    // onChange={(e) => setPanNo(e.target.value)}
                    placeholder="Enter PAN number"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstinNo">GSTIN NO.#</Label>
                  <Input
                    id="gstinNo"
                    value={selectedExporter2?.gstin_number || ""}
                    // onChange={(e) => setGstinNo(e.target.value)}
                    placeholder="Enter GSTIN number"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stateCode">STATE CODE</Label>
                  <Input
                    id="stateCode"
                    value={selectedExporter2?.state_code || ""}
                    // onChange={(e) => setStateCode(e.target.value)}
                    placeholder="Enter state code"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExporterInfo;

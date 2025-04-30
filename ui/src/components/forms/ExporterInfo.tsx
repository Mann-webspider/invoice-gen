// components/ExporterInfo.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react"
import api from "@/lib/axios"
import { useForm } from "@/context/FormContext"


interface ExporterInfoProps {
  selectedExporter: string
  
  handleExporterSelect: (value: string) => void
  companyAddress: string
  email: string
  taxid: string
  invoiceNo: string
  invoiceDate: Date | undefined
  setInvoiceNo: (value: string) => void
  setInvoiceDate: (date: Date) => void
  ieCode: string
  panNo: string
  gstinNo: string
  stateCode: string
  setIeCode: (val: string) => void
  setPanNo: (val: string) => void
  setGstinNo: (val: string) => void
  setStateCode: (val: string) => void
  setTaxid: (val: string) => void
  setEmail: (val: string) => void
  setExporters: (val: any[]) => void
}
async function getExporters(){

  let res = await api.get("/exporter")
  if(res.status !== 200){
    return "error"
  }
  return res.data.data
}
    
 




const ExporterInfo: React.FC<ExporterInfoProps> = ({
  selectedExporter,
  exporters,
  handleExporterSelect,
  companyAddress,
  email,
  taxid,
  invoiceNo,
  invoiceDate,
  setInvoiceNo,
  setInvoiceDate,
  ieCode,
  panNo,
  gstinNo,
  stateCode,
  setIeCode,
  setPanNo,
  setGstinNo,
  setStateCode,
  setTaxid,
  setEmail,
  setExporters
}) => {
  const {formData, setInvoiceData} = useForm()
  useEffect(()=>{
    (async ()=>{

      try{
        const exporter_res = await getExporters();
        console.log(exporter_res);
        setExporters(exporter_res);
      }
      catch(error){
        console.error("Failed to fetch exporters:", error);
      }
    })()
    },[])

    useEffect(()=>{
      setInvoiceData({
        ...formData.invoice,
        invoice_number: invoiceNo,
        invoice_date: invoiceDate,
        exporter: exporters.find((e) => e.company_name === selectedExporter)
      })
    },[selectedExporter,invoiceDate])
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exporter Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">EXPORTER</Label>
                        <Select
                          value={selectedExporter}
                          onValueChange={handleExporterSelect}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select exporter" />
                          </SelectTrigger>
                          <SelectContent>
                            {exporters.map((exporter) => (
                              <SelectItem key={exporter.id} value={exporter.company_name}>
                                {exporter.company_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
      
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress">COMPANY ADDRESS</Label>
                        <Textarea
                          id="companyAddress"
                          value={exporters.find((e) => e.company_name === selectedExporter)?.company_address}
                          readOnly
                          className="bg-gray-50"
                          rows={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNo">EMAIL</Label>
                        <Input
                          id="email"
                          value={exporters.find((e) => e.company_name === selectedExporter)?.email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g., yourmail@gmail.com"
                          required
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNo">Tax ID:</Label>
                        <Input
                          id="taxid"
                          value={exporters.find((e) => e.company_name === selectedExporter)?.tax_id}
                          onChange={(e) => setTaxid(e.target.value)}
                          placeholder="e.g., 24AACF*********"
                          required
                          readOnly
                        />
                      </div>
                    </div>
      
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="invoiceNo">INVOICE NUMBER</Label>
                          <Input
                            id="invoiceNo"
                            className="w-full"
                            placeholder="e.g., EXP/001/2024"
                            value={invoiceNo}
                            onChange={(e) => setInvoiceNo(e.target.value)}
                            readOnly
                          />
                        </div>
      
                        <div className="space-y-2">
                          <Label>INVOICE DATE</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !invoiceDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {invoiceDate ? (
                                  format(invoiceDate, "dd/MM/yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={invoiceDate}
                                onSelect={(date) => {
                                  if (date) {
                                    const formattedDate = format(date, 'yyyy-MM-dd');
                                    setInvoiceDate(formattedDate);
                                  }
                                }}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
      
                      <div className="space-y-4">
                        <h3 className="font-medium">EXPORTER'S REF.</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="ieCode">I.E. CODE #</Label>
                            <Input
                              id="ieCode"
                              value={exporters.find((e) => e.company_name === selectedExporter)?.ie_code}
                              onChange={(e) => setIeCode(e.target.value)}
                              placeholder="Enter IE code"
                              readOnly
                            />
                          </div>
      
                          <div className="space-y-2">
                            <Label htmlFor="panNo">PAN NO. #</Label>
                            <Input
                              id="panNo"
                              value={exporters.find((e) => e.company_name === selectedExporter)?.pan_number}
                              onChange={(e) => setPanNo(e.target.value)}
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
                              value={exporters.find((e) => e.company_name === selectedExporter)?.gstin_number}
                              onChange={(e) => setGstinNo(e.target.value)}
                              placeholder="Enter GSTIN number"
                              readOnly
                            />
                          </div>
      
                          <div className="space-y-2">
                            <Label htmlFor="stateCode">STATE CODE</Label>
                            <Input
                              id="stateCode"
                              value={exporters.find((e) => e.company_name === selectedExporter)?.state_code}
                              onChange={(e) => setStateCode(e.target.value)}
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
  )
}

export default ExporterInfo

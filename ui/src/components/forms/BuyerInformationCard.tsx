// components/BuyerInformationCard.tsx

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useForm } from "@/context/FormContext";
import { useEffect } from "react";

interface BuyerInfoProps {
  buyersOrderNo: string;
  setBuyersOrderNo: (val: string) => void;
  buyersOrderDate: Date | undefined|string;
  setBuyersOrderDate: (val: string) => void;
  poNo: string;
  setPoNo: (val: string) => void;
  consignee: string;
  setConsignee: (val: string) => void;
  notifyParty: string;
  setNotifyParty: (val: string) => void;
}

const BuyerInformationCard: React.FC<BuyerInfoProps> = ({
  buyersOrderNo,
  setBuyersOrderNo,
  buyersOrderDate,
  setBuyersOrderDate,
  poNo,
  setPoNo,
  consignee,
  setConsignee,
  notifyParty,
  setNotifyParty,
}) => {

  const {formData, setInvoiceData} = useForm();

  useEffect(() => {
    setInvoiceData({
      ...formData.invoice,
      buyer: {
        buyer_order_no: buyersOrderNo,
        buyer_order_date: buyersOrderDate,
        po_no: poNo,
        consignee: consignee,
        notify_party: notifyParty,
      }
    });
  }, [formData, buyersOrderNo, buyersOrderDate, poNo, consignee, notifyParty]);

  return (
    <Card>
          <CardHeader>
            <CardTitle>Buyer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Buyer's Order No. & Date</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyersOrderNo">ORDER NO.</Label>
                    <Input
                      id="buyersOrderNo"
                      value={buyersOrderNo}
                      onChange={(e) => setBuyersOrderNo(e.target.value)}
                      placeholder="Enter buyer's order number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ORDER DATE</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="buyersOrderDate"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !buyersOrderDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {buyersOrderDate ? format(buyersOrderDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={new Date(buyersOrderDate)}
                          onSelect={(date) => {
                            if (date) {
                              const formattedDate = format(date, 'yyyy-MM-dd');
                              setBuyersOrderDate(formattedDate);
                            }
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poNo">PO NO.</Label>
                  <Input
                    id="poNo"
                    value={poNo}
                    onChange={(e) => setPoNo(e.target.value)}
                    placeholder="Enter PO number"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="consignee">CONSIGNEE</Label>
                    <Input
                      id="consignee"
                      value={consignee}
                      onChange={(e) => setConsignee(e.target.value)}
                      placeholder="Enter consignee details"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notifyParty">NOTIFY PARTY</Label>
                    <Input
                      id="notifyParty"
                      value={notifyParty}
                      onChange={(e) => setNotifyParty(e.target.value)}
                      placeholder="Enter notify party details"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
  );
};

export default BuyerInformationCard;

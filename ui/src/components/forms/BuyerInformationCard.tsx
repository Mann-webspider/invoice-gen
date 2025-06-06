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
import { Controller, useForm as rhf ,UseFormReturn} from "react-hook-form";

interface BuyerInformationCardProps {
  buyersOrderNo: string;
  setBuyersOrderNo: (val: string) => void;
  buyersOrderDate: Date;
  setBuyersOrderDate: (date: Date) => void;
  poNo: string;
  setPoNo: (val: string) => void;
  consignee: string;
  setConsignee: (val: string) => void;
  notifyParty: string;
  setNotifyParty: (val: string) => void;
  form : UseFormReturn;
}

const BuyerInformationCard: React.FC<BuyerInformationCardProps> = ({
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
  form
}) => {

  const {formData, setInvoiceData} = useForm();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const buyerForm = watch("buyer");
  // useEffect(() => {
  //   const subscribe = watch((value) => {
  //     console.log(value);
  //   });
  //   return () => subscribe.unsubscribe();
  // }, [watch]);

  // useEffect(() => {
  //   setInvoiceData({
  //     ...formData.invoice,
  //     buyer: {
  //       buyer_order_no: buyersOrderNo,
  //       buyer_order_date: buyersOrderDate ? format(buyersOrderDate, 'dd/MM/yyyy') : null,
  //       po_no: poNo,
  //       consignee: consignee,
  //       notify_party: notifyParty,
  //     }
  //   });
  // }, [formData, buyersOrderNo, buyersOrderDate, poNo, consignee, notifyParty]);

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
                      value={buyerForm?.buyer_order_no || ""}
                      {...register("buyer.buyer_order_no", { required: true })}
                      // onChange={(e) => setBuyersOrderNo(e.target.value)}
                      placeholder="Enter buyer's order number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ORDER DATE</Label>
                    <Controller
                  name="buyer.buyer_order_date"
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
                            if (date) {
                              const localeDate = date.toLocaleDateString();
                              field.onChange(localeDate);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />

                {errors.buyer_order_date && (
                  <span className="text-red-500 text-sm">Required</span>
                )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poNo">PO NO.</Label>
                  <Input
                    id="poNo"
                    value={buyerForm?.po_no || ""}
                    {...register("buyer.po_no", { required: true })}
                    // onChange={(e) => setPoNo(e.target.value)}
                    placeholder="Enter PO number"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="consignee">CONSIGNEE</Label>
                    <Input
                      id="consignee"
                      value={buyerForm?.consignee || ""}
                      {...register("buyer.consignee", { required: true })}
                      // onChange={(e) => setConsignee(e.target.value)}
                      placeholder="Enter consignee details"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notifyParty">NOTIFY PARTY</Label>
                    <Input
                      id="notifyParty"
                      value={buyerForm?.notify_party || ""}
                      {...register("buyer.notify_party", { required: true })}
                      // onChange={(e) => setNotifyParty(e.target.value)}
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

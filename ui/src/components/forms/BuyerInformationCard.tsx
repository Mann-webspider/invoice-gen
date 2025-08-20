// components/BuyerInformationCard.tsx

import { format,parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Controller, useForm as rhf, UseFormReturn,useFormContext } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { useState } from "react";
import { useRef } from "react";

interface BuyerInformationCardProps {
  
  form: UseFormReturn;
}

const BuyerInformationCard: React.FC<BuyerInformationCardProps> = ({
  
  form,
}) => {
  const { formData, setInvoiceData } = useForm();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();
  // Safe parsing from dd/MM/yyyy to yyyy-MM-dd
const safeParseToISO = (dateString) => {
  if (!dateString) return undefined;
  
  try {
    // If already in ISO format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    
    // Parse dd/MM/yyyy format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
      if (isNaN(parsedDate.getTime())) return undefined;
      return format(parsedDate, 'yyyy-MM-dd');
    }
    
    return undefined;
  } catch (error) {
    console.warn('Date parsing error:', error);
    return undefined;
  }
};

// Safe formatting from yyyy-MM-dd to dd/MM/yyyy
const safeFormatDate = (value) => {
  if (!value || value === '') return value;
  
  try {
    // If already in dd/MM/yyyy format, return as-is
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return value;
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    console.warn('Date formatting error:', error);
    return value;
  }
};

  const buyerForm = watch("invoice.buyer");
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
                  {...register("invoice.buyer.buyer_order_no", { required: true })}
                  // onChange={(e) => setBuyersOrderNo(e.target.value)}
                  placeholder="Enter buyer's order number"
                />
                {errors?.invoice?.buyer?.buyer_order_no && (
                  <span className="text-red-500 text-sm">Required</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>ORDER DATE</Label>
                

{/* <Controller
  name="invoice.buyer.buyer_order_date"
  control={control}
  rules={{ required: true }}
  render={({ field }) => {
    const [isOpen, setIsOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    const handleDateChange = (date: Date | undefined) => {
      if (date) {
        // ✅ Use local timezone instead of UTC to avoid date shifting
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`; // yyyy-mm-dd
        
        field.onChange(formatted);
        setIsOpen(false);
      }
    };

    // ❗ Close calendar on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          calendarRef.current &&
          !calendarRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    return (
      <div className="relative w-full" ref={calendarRef}>
        <Input
          value={field.value || ""}
          type={"text"}
          onChange={(e) => field.onChange(e.target.value)}
          placeholder="YYYY-MM-DD"
          onFocus={() => setIsOpen(true)}
          className={cn(
            "w-full pr-10",
            !field.value && "text-muted-foreground",
            errors?.invoice?.buyer?.buyer_order_date && "border-red-500"
          )}
        />
        <CalendarIcon
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 cursor-pointer"
        />
        {isOpen && (
          <div className="absolute z-50 mt-1 bg-white border shadow-lg rounded-md p-2">
            <Calendar
              mode="single"
              selected={
                field.value ? new Date(field.value + 'T00:00:00') : undefined
              }
              onSelect={handleDateChange}
              initialFocus
            />
          </div>
        )}
      </div>
    );
  }}
/> */}

<Input
  id="buyer_order_date"
  type="date"
  value={safeParseToISO(buyerForm?.buyer_order_date)}
  {...register("invoice.buyer.buyer_order_date", {
    required: false,
    setValueAs: safeFormatDate
  })}
/>






                {errors?.invoice?.buyer?.buyer_order_date && (
                  <span className="text-red-500 text-sm">Required</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="poNo">PO NO.</Label>
              <Input
                id="poNo"
                value={buyerForm?.po_no || ""}
                {...register("invoice.buyer.po_no", { required: false })}
                // onChange={(e) => setPoNo(e.target.value)}
                placeholder="Enter PO number"
              />
              {errors?.invoice?.buyer?.po_no && (
                  <span className="text-red-500 text-sm">Required</span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="consignee">CONSIGNEE</Label>
                <Input
                  id="consignee"
                  value={buyerForm?.consignee || ""}
                  {...register("invoice.buyer.consignee", { required: true })}
                  // onChange={(e) => setConsignee(e.target.value)}
                  placeholder="Enter consignee details"
                />
                {errors?.invoice?.buyer?.consignee && (
                  <span className="text-red-500 text-sm">Required</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notifyParty">NOTIFY PARTY</Label>
                <Textarea
                  id="notifyParty"
                  value={buyerForm?.notify_party || ""}
                  {...register("invoice.buyer.notify_party", { value: "-" })}
                  // onChange={(e) => setNotifyParty(e.target.value)}
                  placeholder="Enter notify party details"
                  required={false}
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

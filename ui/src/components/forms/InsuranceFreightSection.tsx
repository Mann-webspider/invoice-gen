import React from "react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// InsuranceFreightSection Component
interface InsuranceFreightProps {
    paymentTerms: string;
    insuranceAmount: number;
    setInsuranceAmount: React.Dispatch<React.SetStateAction<number>>;
    freightAmount: number;
    setFreightAmount: React.Dispatch<React.SetStateAction<number>>;
  }
  
  export const InsuranceFreightSection: React.FC<InsuranceFreightProps> = ({
    paymentTerms,
    insuranceAmount,
    setInsuranceAmount,
    freightAmount,
    setFreightAmount,
  }) => (
    <>
      {paymentTerms === "CIF" && (
        <div className="flex justify-end border-b border-gray-200">
          <div className="w-1/3 text-right p-3 font-medium">Insurance</div>
          <div className="w-1/6 text-right p-3 font-medium border-l border-gray-200">
            <Input
              type="number"
              value={insuranceAmount}
              onChange={e => setInsuranceAmount(Number(e.target.value) || 0)}
              className="text-right border-0 p-0 h-6"
            />
          </div>
        </div>
      )}
      <div className="flex justify-end border-b border-gray-200">
        <div className="w-1/3 text-right p-3 font-medium">Freight</div>
        <div className="w-1/6 text-right p-3 font-medium border-l border-gray-200">
          <Input
            type="number"
            value={freightAmount}
            onChange={e => setFreightAmount(Number(e.target.value) || 0)}
            className="text-right border-0 p-0 h-6"
          />
        </div>
      </div>
      <Separator className="my-2" />
    </>
  );
  
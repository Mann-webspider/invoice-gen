import React from "react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ContainerDetails Component
interface ContainerDetailsProps {
  marksAndNosConfig: { first: string; third: string };
  setMarksAndNosConfig: React.Dispatch<React.SetStateAction<{ first: string; third: string }>>;
  numberOptions1: string[];
  numberOptions2: string[];
  containerType: string;
  setContainerType: React.Dispatch<React.SetStateAction<string>>;
  containerTypes: string[];
}

export const ContainerDetails: React.FC<ContainerDetailsProps> = ({
  marksAndNosConfig,
  setMarksAndNosConfig,
  numberOptions1,
  numberOptions2,
  containerType,
  setContainerType,
  containerTypes,
}) => (
  <div className="rounded-lg">
    <div className="space-y-4">
      <h4 className="font-medium">Marks & Nos.</h4>
      <div className="flex flex-row w-96 gap-1">
        <div className="flex flex-row gap-3 w-36">
          <Select
            value={marksAndNosConfig.first}
            onValueChange={(val) => setMarksAndNosConfig(prev => ({ ...prev, first: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select number" />
            </SelectTrigger>
            <SelectContent>
              {numberOptions1.map(num => (
                <SelectItem key={num} value={num}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center w-8 justify-center">
            <span className="text-md font-medium">X</span>
          </div>
        </div>
        <div className="w-1" />
        <div className="flex flex-row gap-10 w-64">
          <Select
            value={marksAndNosConfig.third}
            onValueChange={(val) => setMarksAndNosConfig(prev => ({ ...prev, third: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select number" />
            </SelectTrigger>
            <SelectContent>
              {numberOptions2.map(num => (
                <SelectItem key={num} value={num}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={containerType} onValueChange={setContainerType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {containerTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  </div>
);

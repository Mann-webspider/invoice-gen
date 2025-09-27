import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SectionTitleSelectorProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SectionTitleSelector: React.FC<SectionTitleSelectorProps> = ({
  value,
  options,
  onChange,
  disabled = false
}) => {
  return (
    <Select 
      value={value} 
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="border-0 bg-transparent font-bold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option} value={option}>{option}</SelectItem>
        ))}
        <SelectItem value="custom">Add Custom...</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default SectionTitleSelector;

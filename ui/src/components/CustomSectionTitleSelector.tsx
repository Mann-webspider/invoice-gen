import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomSectionTitleSelectorProps {
  currentTitle: string;
  options: string[];
  onTitleChange: (title: string) => void;
  disabled?: boolean;
}

const CustomSectionTitleSelector: React.FC<CustomSectionTitleSelectorProps> = ({
  currentTitle,
  options,
  onTitleChange,
  disabled = false
}) => {
  const handleChange = (value: string) => {
    if (value === 'custom') {
      // Show a prompt for custom title
      const customTitle = prompt("Enter a custom section title:");
      if (customTitle && customTitle.trim()) {
        onTitleChange(customTitle);
      }
    } else {
      onTitleChange(value);
    }
  };

  return (
    <Select 
      value={currentTitle} 
      onValueChange={handleChange}
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

export default CustomSectionTitleSelector;

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MarksAndNumbersProps {
  // Support both legacy and new styles of props
  onChange?: ((value: string) => void) | ((values: any) => void);
  initialContainerType?: string;
  initialLeftValue?: string;
  initialRightValue?: string;
  // Legacy prop support
  initialValues?: {
    containerType?: string;
    leftValue?: string;
    rightValue?: string;
  };
}

const MarksAndNumbers: React.FC<MarksAndNumbersProps> = ({ 
  onChange, 
  initialContainerType,
  initialLeftValue,
  initialRightValue,
  initialValues
}) => {
  // Initialize state with props, preferring direct props over initialValues
  const [containerType, setContainerType] = useState<string>(
    initialContainerType || 
    initialValues?.containerType || 
    'FCL'
  );
  
  const [leftValue, setLeftValue] = useState<string>(
    initialLeftValue || 
    initialValues?.leftValue || 
    '10'
  );
  
  const [rightValue, setRightValue] = useState<string>(
    initialRightValue || 
    initialValues?.rightValue || 
    '20 ft'
  );

  // Options for dropdowns
  const containerTypes = ["FCL", "LCL"];
  const leftOptions = Array.from({ length: 100 }, (_, i) => (i + 1).toString());
  // Only show 20 ft and 40 ft options for FCL
  const rightOptions = containerType === 'FCL' 
    ? ["20 ft", "40 ft"]
    : Array.from({ length: 30 }, (_, i) => (i + 1).toString());

  // Update parent component when values change
  const updateParent = () => {
    if (!onChange) return;
    
    try {
      if (containerType === 'LCL') {
        // For LCL, just pass the string 'LCL'
        (onChange as (value: string) => void)('LCL');
      } else {
        // For FCL, format as "10X20 ft FCL"
        const formattedValue = `${leftValue}X${rightValue} ${containerType}`;
        (onChange as (value: string) => void)(formattedValue);
      }
    } catch (e) {
      // Fallback for the object-based approach
      try {
        (onChange as (values: any) => void)({
          containerType,
          leftValue: containerType === 'LCL' ? '' : leftValue,
          rightValue: containerType === 'LCL' ? '' : rightValue
        });
      } catch (e) {
        console.error("Error in MarksAndNumbers onChange handler", e);
      }
    }
  };

  // Call updateParent when any value changes
  useEffect(() => {
    updateParent();
  }, [containerType, leftValue, rightValue]);

  // Check and update rightValue when container type changes
  useEffect(() => {
    if (containerType === 'FCL' && !rightValue.includes('ft')) {
      setRightValue('20 ft');
    } else if (containerType === 'LCL' && rightValue.includes('ft')) {
      setRightValue('1');
    }
  }, [containerType, rightValue]);

  const handleContainerTypeChange = (value: string) => {
    setContainerType(value);
  };

  const handleLeftValueChange = (value: string) => {
    setLeftValue(value);
  };

  const handleRightValueChange = (value: string) => {
    setRightValue(value);
  };

  return (
    <div>
      <Label className="font-medium mb-2 block">Marks & Nos.</Label>
      <div className="flex items-center space-x-2">
        {/* Show left dropdown only when containerType is FCL */}
        {containerType === 'FCL' && (
          <div className="w-28">
            <Select value={leftValue} onValueChange={handleLeftValueChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {leftOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Show X only when containerType is FCL */}
        {containerType === 'FCL' && (
          <span className="text-xl font-medium">X</span>
        )}

        {/* Show right dropdown only when containerType is FCL */}
        {containerType === 'FCL' && (
          <div className="w-28">
            <Select value={rightValue} onValueChange={handleRightValueChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {rightOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Container type dropdown (FCL/LCL) - always shown */}
        <div className="w-28 ml-4">
          <Select value={containerType} onValueChange={handleContainerTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {containerTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default MarksAndNumbers; 
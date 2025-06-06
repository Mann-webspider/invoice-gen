import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomSectionTitleProps {
  sectionId: string;
  currentTitle: string;
  sectionOptions: string[];
  readOnly: boolean;
  onTitleChange: (sectionId: string, title: string) => void;
  onAddCustomTitle: (title: string) => void;
}

const CustomSectionTitle: React.FC<CustomSectionTitleProps> = ({
  sectionId,
  currentTitle,
  sectionOptions,
  readOnly,
  onTitleChange,
  onAddCustomTitle
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelectChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true);
    } else {
      onTitleChange(sectionId, value);
    }
  };

  const handleSaveCustomTitle = () => {
    if (customTitle.trim()) {
      onAddCustomTitle(customTitle);
      onTitleChange(sectionId, customTitle);
      setShowCustomInput(false);
      setCustomTitle('');
    }
  };

  if (readOnly) {
    return <div className="text-center w-full flex justify-center items-center">{currentTitle}</div>;
  }

  if (showCustomInput) {
    return (
      <div className="flex items-center space-x-2">
        <Input 
          value={customTitle} 
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Enter custom title"
          className="border-0 bg-transparent font-bold text-center"
        />
        <Button 
          size="sm" 
          onClick={handleSaveCustomTitle}
        >
          Save
        </Button>
        <Button 
          size="sm"
          variant="outline" 
          onClick={() => setShowCustomInput(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Select 
      value={currentTitle} 
      onValueChange={handleSelectChange}
      disabled={readOnly}
    >
      <SelectTrigger className="border-0 bg-transparent font-bold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sectionOptions.map(option => (
          <SelectItem key={option} value={option}>{option}</SelectItem>
        ))}
        <SelectItem value="custom">Add Custom...</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default CustomSectionTitle;

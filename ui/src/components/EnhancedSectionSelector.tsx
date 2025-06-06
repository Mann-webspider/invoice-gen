import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EnhancedSectionSelectorProps {
  sectionId: string;
  currentTitle: string;
  options: string[];
  disabled?: boolean;
  onTitleChange: (sectionId: string, title: string) => void;
}

const EnhancedSectionSelector: React.FC<EnhancedSectionSelectorProps> = ({
  sectionId,
  currentTitle,
  options,
  disabled = false,
  onTitleChange
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  const handleSelectChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true);
    } else {
      onTitleChange(sectionId, value);
    }
  };

  const handleSaveCustomTitle = () => {
    if (customTitle.trim()) {
      onTitleChange(sectionId, customTitle);
      setShowCustomInput(false);
      setCustomTitle('');
    }
  };

  const handleCancel = () => {
    setShowCustomInput(false);
    setCustomTitle('');
  };

  if (showCustomInput) {
    return (
      <div className="flex items-center space-x-2">
        <Input 
          value={customTitle} 
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Enter custom title"
          className="border-0 bg-transparent font-bold text-center"
          autoFocus
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
          onClick={handleCancel}
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

export default EnhancedSectionSelector;

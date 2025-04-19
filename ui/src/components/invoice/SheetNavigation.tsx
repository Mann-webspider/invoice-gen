import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface SheetNavigationProps {
  currentSheet: number;
  totalSheets: number;
  onPrevious: () => void;
  onNext: () => void;
}

const SheetNavigation: React.FC<SheetNavigationProps> = ({
  currentSheet,
  totalSheets,
  onPrevious,
  onNext,
}) => {
  return (
    <div>
      {currentSheet < totalSheets && (
        <Button className="bg-gray-800 hover:bg-gray-700" onClick={onNext}>
          Next Sheet
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
      
      {currentSheet > 1 && (
        <Button variant="outline" onClick={onPrevious} className="mt-2">
          Back to Previous Sheet
        </Button>
      )}
    </div>
  );
};

export default SheetNavigation;

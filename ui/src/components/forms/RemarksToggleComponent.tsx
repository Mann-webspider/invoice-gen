import React, { useState } from "react";
import { Controller } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageSquare, Plus, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Edit3, FileText, ClipboardList, StickyNote, Pencil, NotebookPen} from 'lucide-react';

interface RemarksToggleComponentProps {
  form: any;
}

const RemarksToggleComponent: React.FC<RemarksToggleComponentProps> = ({ form }) => {
  const [showRemarks, setShowRemarks] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const remarksValue = form.watch("invoice.remarks") || "";
  const hasRemarks = remarksValue.trim().length > 0;

  return (
    <Card className="w-full border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-gray-100">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900">Remarks</h3>
              <p className="text-sm text-gray-500">
                Add additional notes or instructions
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium transition-colors duration-200",
                showRemarks ? "text-black" : "text-gray-500"
              )}>
                {showRemarks ? "Hide" : "Add"}
              </span>
              <button
                type="button"
                onClick={() => setShowRemarks(!showRemarks)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
                  showRemarks 
                    ? "bg-black" 
                    : "bg-gray-200"
                )}
                role="switch"
                aria-checked={showRemarks}
                aria-label="Toggle remarks section"
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200",
                    showRemarks ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {showRemarks && (
        <CardContent className="pt-0 pb-6 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label 
                htmlFor="remarks" 
                className="text-sm font-medium text-gray-700"
              >
                Additional Remarks
              </Label>
              
              <Controller
                control={form.control}
                name="invoice.remarks"
                defaultValue=""
                render={({ field }) => (
                  <textarea
                    {...field}
                    id="remarks"
                    rows={4}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={cn(
                      "w-full p-4 border rounded-lg resize-none transition-all duration-200",
                      "text-sm leading-relaxed placeholder:text-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent",
                      isFocused || field.value 
                        ? "border-gray-400 bg-gray-50/30" 
                        : "border-gray-300 bg-white hover:border-gray-400"
                    )}
                    placeholder="Enter any additional remarks, special instructions, delivery notes, or important information that should appear on the invoice..."
                    style={{ minHeight: '120px', maxHeight: '240px' }}
                  />
                )}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default RemarksToggleComponent;

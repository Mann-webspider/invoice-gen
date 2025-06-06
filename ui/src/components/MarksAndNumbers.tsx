import { useEffect } from 'react';
import { useFormContext, Controller,useWatch } from 'react-hook-form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const containerTypes = ["FCL", "LCL"];
const leftOptions = Array.from({ length: 100 }, (_, i) => (i + 1).toString());
const fclRightOptions = ["20 ft", "40 ft"];
const lclRightOptions = Array.from({ length: 30 }, (_, i) => (i + 1).toString());

const MarksAndNumbers = ({form}) => {
  const { control, watch, setValue } = form;

const containerType = useWatch({ control, name: "products.nos" });
const leftValue = useWatch({ control, name: "products.leftValue" });
const rightValue = useWatch({ control, name: "products.rightValue" });

  // Set the "marks" string whenever related fields change
useEffect(() => {
  const newMark = containerType === "LCL" ? "LCL" : `${leftValue} X ${rightValue}`;
  const currentMark = watch("products.marks");
  if (currentMark !== newMark) {
    setValue("products.marks", newMark);
  }
}, [containerType, leftValue, rightValue, setValue]);


  return (
    <div>
      <Label className="font-medium mb-2 block">Marks & Nos.</Label>
      <div className="flex items-center space-x-2">
        {/* Left value (only for FCL) */}
        {containerType === 'FCL' && (
          <div className="w-28">
            <Controller
              control={control}
              name="products.leftValue"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {leftOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        {containerType === 'FCL' && (
          <span className="text-xl font-medium">X</span>
        )}

        {/* Right value (only for FCL) */}
        {containerType === 'FCL' && (
          <div className="w-28">
            <Controller
              control={control}
              name="products.rightValue"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {fclRightOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        {/* Container type (FCL/LCL) */}
        <div className="w-28 ml-4">
          <Controller
            control={control}
            name="products.nos"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(val) => {
                field.onChange(val);

                // Optional: Reset left/right when changing type
                if (val === "FCL") {
                  setValue("products.rightValue", "20 ft");
                  setValue("products.leftValue", "10");
                } else {
                  setValue("products.rightValue", "1");
                  setValue("products.leftValue", "");
                }
              }}>
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
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default MarksAndNumbers;

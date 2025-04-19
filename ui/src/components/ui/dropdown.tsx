import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownOption } from "@/types/dropdowns";

interface DropdownProps {
  options: DropdownOption[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
}: DropdownProps) {
  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onChange(val)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value.toString()}
            value={option.value.toString()}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 
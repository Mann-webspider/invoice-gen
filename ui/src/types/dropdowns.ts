export interface DropdownOption {
  value: string | number;
  label: string;
}

export interface SizeOption extends DropdownOption {
  id: number;
}

export interface ShippingDropdowns {
  place_of_receipt: DropdownOption[];
  port_of_loading: DropdownOption[];
  port_of_discharge: DropdownOption[];
  final_destination: DropdownOption[];
}

export interface ExporterDropdowns {
  company_names: DropdownOption[];
  state_codes: DropdownOption[];
}

export interface SupplierDropdowns {
  suppliers: DropdownOption[];
}

export interface AllDropdownsData {
  size: SizeOption[];
  shipping: ShippingDropdowns;
  exporter: ExporterDropdowns;
  supplier: SupplierDropdowns;
}

export interface AllDropdownsResponse {
  status: string;
  data: AllDropdownsData;
} 
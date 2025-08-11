export interface CompanyProfile {
  id?: string;
  name: string;
  address: string;
  gstin: string;
  pan: string;
  logo?: string;
  email?: string;
  declarationText: string;
}

export interface Client {
  id?: string;
  consignee: string;
  notifyParty: string;
  buyerOrderNoFormat: string;
}

export interface Product {
  id: string;
  description: string;
  hsnCode: string;
  size: string;
  price: string;
  sqmPerBox: number;
  marksAndNos?: string;
  netWeight?: string;
  grossWeight?: string;
}

export interface ShippingTerm {
  id?: string;
  fob: string;
  port: string;
  euroRate: number;
}

export interface ProductSection {
  id: string;
  title: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  product: Product;
  quantity: number;
  unitType: string;
  totalSQM: number;
  totalFOB: number;
  sectionId?: string;
}

export interface Invoice {
  id?: string;
  invoiceNo: string;
  date: Date;
  client: Client;
  items: InvoiceItem[];
  shippingTerm: ShippingTerm;
  totalSQM: number;
  totalFOBEuro: number;
  amountInWords: string;
  taxPaymentOption?: "with" | "without";
  
  // Extended fields
  exporterRef?: string;
  ieCode?: string;
  panNo?: string;
  gstinNo?: string;
  stateCode?: string;
  buyersOrderNo?: string;
  poNo?: string;
  preCarriageBy?: string;
  placeOfReceipt?: string;
  vesselFlightNo?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  finalDestination?: string;
  countryOfOrigin?: string;
  originDetails?: string;
  countryOfFinalDestination?: string;
  termsOfDelivery?: string;
  paymentTerms?: string;
  shippingMethod?: string;
  noOfPackages?: string;
  grossWeight?: string;
  netWeight?: string;
  exportUnderDutyDrawback?: boolean;
  ftpIncentiveDeclaration?: string;
  exportUnderGstCircular?: string;
  lutNo?: string;
  lutDate?: string;
  supplierDetails1?: string;
  supplierDetails2?: string;
  supplierDetails3?: string;
  gstInvoiceNoDate?: string;
  authorizedName?: string;
  authorizedGstin?: string;
}

export interface InvoicePrintProps {
  invoice: Invoice;
  companyProfile: CompanyProfile;
}

export interface DropdownOption {
  id: string;
  value: string;
}

export interface DropdownCategory {
  id: string;
  name: string;
  options: DropdownOption[];
}

export interface DropdownOptionsState {
  categories: DropdownCategory[];
}

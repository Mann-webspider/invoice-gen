import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface InvoicePDFPreviewProps {
  // Invoice Header
  invoiceNo: string;
  date: string;
  exporterRef?: string;
  ieCode?: string;
  companyName: string;
  companyAddress: string;
  companyEmail?: string;
  taxId?: string;
  stateCode?: string;
  panNo?: string;
  gstinNo?: string;
  buyersOrderNo?: string;
  buyersOrderDate?: string;
  poNo?: string;
  consignee: string;
  notifyParty?: string;

  // Shipping Information
  termsOfDelivery?: string;
  paymentTerms?: string;
  shippingMethod?: string;
  placeOfReceipt?: string;
  preCarriageBy?: string;
  countryOfOrigin?: string;
  originDetails?: string;
  vesselFlightNo?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  finalDestination?: string;
  countryOfFinalDestination?: string;
  euroRate?: string;
  selectedCurrency?: string;

  // Product Information
  items: {
    id: number;
    srNo: number;
    marks: string;
    description: string;
    quantity: number;
    unitType: string;
    sqmPerBox: number;
    size: string;
    hsnCode: string;
    totalSqm: number;
    price: number;
    totalAmount: number;
  }[];

  // Package and Declaration
  noOfPackages?: string;
  grossWeight?: string;
  netWeight?: string;
  exportUnderDutyDrawback?: boolean;
  ftpIncentiveDeclaration?: string;
  exportUnderGstCircular?: string;
  lutNo?: string;
  lutDate?: string;
  fobEuro?: string;
  totalFobEuro: string;
  amountInWords: string;

  // Supplier Details
  supplierDetails1?: string;
  supplierDetails2?: string;
  supplierDetails3?: string;
  gstInvoiceNoDate?: string;
  companyNameFooter?: string;
  declarationText: string;
  authorizedName?: string;
  authorizedGstin?: string;
  integratedTaxOption?: "WITH" | "WITHOUT";
  currencyRate?: number;
  taxableValue?: number;
  gstAmount?: number;
}

const InvoicePDFPreview: React.FC<InvoicePDFPreviewProps> = (props) => {
  return (
    <Card className="w-full border-0 shadow-none print:shadow-none">
      <CardContent className="p-6 print:p-0">
        <div className="space-y-6 text-sm print:text-xs">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold uppercase">{props.companyName}</h1>
            <p className="text-sm">{props.companyAddress}</p>
            {props.companyEmail && <p className="text-sm">{props.companyEmail}</p>}
            <div className="grid grid-cols-3 gap-4 mt-2">
              {props.taxId && <p><span className="font-semibold">TAX ID:</span> {props.taxId}</p>}
              {props.stateCode && <p><span className="font-semibold">STATE CODE:</span> {props.stateCode}</p>}
              {props.panNo && <p><span className="font-semibold">PAN NO. #:</span> {props.panNo}</p>}
            </div>
            {props.gstinNo && <p><span className="font-semibold">GSTIN NO.#:</span> {props.gstinNo}</p>}
            
            <div className="border-t border-b border-black py-3 my-3">
              <h2 className="text-xl font-bold">CUSTOMS INVOICE</h2>
              <p className="text-xs">SUPPLY MEANT FOR EXPORT UNDER BOND & LUT- LETTER OF UNDERTAKING {props.integratedTaxOption === "WITH" ? "WITH" : "WITHOUT"} PAYMENT OF INTEGRATED TAX</p>
            </div>
          </div>

          {/* Invoice & Buyer Info */}
          <div className="grid grid-cols-2 gap-4 border-b border-black pb-2">
            <div>
              <p><span className="font-semibold">Invoice No.:</span> {props.invoiceNo}</p>
              <p><span className="font-semibold">Date:</span> {props.date}</p>
              {props.exporterRef && <p><span className="font-semibold">Exporter's Ref.:</span> {props.exporterRef}</p>}
              {props.ieCode && <p><span className="font-semibold">I.E. Code #:</span> {props.ieCode}</p>}
            </div>
            <div>
              {props.buyersOrderNo && <p><span className="font-semibold">Buyer's Order No.:</span> {props.buyersOrderNo}</p>}
              {props.buyersOrderDate && <p><span className="font-semibold">Buyer's Order Date:</span> {props.buyersOrderDate}</p>}
              {props.poNo && <p><span className="font-semibold">PO No.:</span> {props.poNo}</p>}
              <p><span className="font-semibold">Consignee:</span> {props.consignee}</p>
              {props.notifyParty && <p><span className="font-semibold">Notify Party:</span> {props.notifyParty}</p>}
            </div>
          </div>

          {/* Shipping Info */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p><span className="font-semibold">Pre-Carriage By:</span> {props.preCarriageBy || '-'}</p>
              <p><span className="font-semibold">Vessel/Flight No.:</span> {props.vesselFlightNo || '-'}</p>
              <p><span className="font-semibold">Port of Loading:</span> {props.portOfLoading || '-'}</p>
            </div>
            <div>
              <p><span className="font-semibold">Place of Receipt:</span> {props.placeOfReceipt || '-'}</p>
              <p><span className="font-semibold">Port of Discharge:</span> {props.portOfDischarge || '-'}</p>
              <p><span className="font-semibold">Final Destination:</span> {props.finalDestination || '-'}</p>
            </div>
            <div>
              <p><span className="font-semibold">Country of Origin:</span> {props.countryOfOrigin || '-'}</p>
              <p><span className="font-semibold">Country of Final Destination:</span> {props.countryOfFinalDestination || '-'}</p>
              <p><span className="font-semibold">Terms of Delivery:</span> {props.termsOfDelivery || '-'}</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 gap-2 text-xs">
            {props.paymentTerms && <p><span className="font-semibold">Payment Terms:</span> {props.paymentTerms}</p>}
            {props.shippingMethod && <p><span className="font-semibold">Shipping Method:</span> {props.shippingMethod}</p>}
            {props.euroRate && <p><span className="font-semibold">EURO RATE:</span> {props.euroRate}</p>}
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <Table className="border border-black">
              <TableHeader>
                <TableRow className="bg-gray-100 [&>th]:p-2 [&>th]:border [&>th]:border-black [&>th]:text-xs [&>th]:font-bold">
                  <TableHead className="text-center">SR NO</TableHead>
                  <TableHead>Marks & Nos.</TableHead>
                  <TableHead>Description of Goods</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">SQM/BOX</TableHead>
                  <TableHead className="text-center">TOTAL SQM</TableHead>
                  <TableHead className="text-center">PRICE/SQM</TableHead>
                  <TableHead className="text-center">AMOUNT (in Euros)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {props.items.map((item) => (
                  <TableRow key={item.id} className="[&>td]:p-2 [&>td]:border [&>td]:border-black [&>td]:text-xs">
                    <TableCell className="text-center">{item.srNo}</TableCell>
                    <TableCell>{item.marks}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.hsnCode}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell className="text-center">{item.quantity} {item.unitType}</TableCell>
                    <TableCell className="text-center">{item.sqmPerBox.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{item.totalSqm.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{item.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-gray-50 [&>td]:p-2 [&>td]:border [&>td]:border-black [&>td]:text-xs">
                  <TableCell colSpan={5} className="text-right">TOTAL:</TableCell>
                  <TableCell className="text-center">{props.items.reduce((sum, item) => sum + item.quantity, 0)} {props.items[0]?.unitType || ''}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center">{props.items.reduce((sum, item) => sum + item.totalSqm, 0).toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center">{props.items.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Packaging & Declaration */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p><span className="font-semibold">Nos. of Kind of Packages:</span> {props.noOfPackages || '-'}</p>
              <p><span className="font-semibold">GROSS WT. (KGS):</span> {props.grossWeight || '-'}</p>
              <p><span className="font-semibold">NET WT. (KGS):</span> {props.netWeight || '-'}</p>
            </div>
            <div>
              {props.exportUnderDutyDrawback && <p><span className="font-semibold">Export Under:</span> Duty Drawback Scheme</p>}
              {props.ftpIncentiveDeclaration && <p className="text-[9px]">{props.ftpIncentiveDeclaration}</p>}
              {props.exportUnderGstCircular && <p className="text-[9px]">{props.exportUnderGstCircular}</p>}
              {props.integratedTaxOption === "WITH" ? (
                <>
                  <p className="text-[9px]">SUPPLY MEANT FOR EXPORT ON PAYMENT OF IGST UNDER CLAIM OF REFUND RS. TOTAL : {props.gstAmount?.toFixed(2)}</p>
                  <p className="text-[9px]">(TAXABLE CIF INR VALUE {props.taxableValue?.toFixed(2)}@ 18%)</p>
                </>
              ) : (
                <>
                  {props.lutNo && <p className="text-[9px]">{props.lutNo}</p>}
                  {props.lutDate && <p className="text-[9px]">{props.lutDate}</p>}
                </>
              )}
            </div>
            <div>
              <p><span className="font-semibold">FOB {props.selectedCurrency}:</span> {props.fobEuro || props.totalFobEuro}</p>
              <p><span className="font-semibold">TOTAL {props.paymentTerms} {props.selectedCurrency}:</span> {props.totalFobEuro}</p>
              <p><span className="font-semibold">Amount in Words:</span> {props.amountInWords}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2 gap-4 border-t border-black pt-4 text-xs">
            <div>
              {props.supplierDetails1 && <p>{props.supplierDetails1}</p>}
              {props.supplierDetails2 && <p>{props.supplierDetails2}</p>}
              {props.gstInvoiceNoDate && <p>{props.gstInvoiceNoDate}</p>}
            </div>
            <div>
              <p className="font-semibold mb-2">{props.companyNameFooter || props.companyName}</p>
              <p className="mb-4">{props.declarationText}</p>
              <div className="mt-8 flex justify-end">
                <div className="text-center">
                  <p>Authorized Signatory</p>
                  {props.authorizedName && <p>{props.authorizedName}</p>}
                  {props.authorizedGstin && <p>{props.authorizedGstin}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoicePDFPreview;

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ProductSection } from "@/lib/types";

interface PackingListProps {
  invoiceNo: string;
  invoiceDate: Date;
  exporter: string;
  exporterRef: string;
  sections: ProductSection[];
  companyAddress: string;
  email: string;
  taxId: string;
  consignee: string;
  notifyParty: string;
  buyersOrderNo: string;
  buyersOrderDate: Date;
  poNo: string;
  ieCode: string;
  panNo: string;
  gstinNo: string;
  stateCode: string;
  preCarriageBy: string;
  placeOfReceipt: string;
  vesselFlightNo: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  countryOfOrigin: string;
  originDetails: string;
  countryOfFinalDestination: string;
  termsOfDelivery: string;
  paymentTerms: string;
  shippingMethod: string;
}

const PackingList: React.FC<PackingListProps> = ({
  invoiceNo,
  invoiceDate,
  exporter,
  exporterRef,
  sections,
  companyAddress,
  email,
  taxId,
  consignee,
  notifyParty,
  buyersOrderNo,
  buyersOrderDate,
  poNo,
  ieCode,
  panNo,
  gstinNo,
  stateCode,
  preCarriageBy,
  placeOfReceipt,
  vesselFlightNo,
  portOfLoading,
  portOfDischarge,
  finalDestination,
  countryOfOrigin,
  originDetails,
  countryOfFinalDestination,
  termsOfDelivery,
  paymentTerms,
  shippingMethod,
}) => {
  // Calculate totals
  const totalQuantity = sections.flatMap(section => section.items).reduce((sum, item) => sum + item.quantity, 0);
  const totalNetWeight = sections.flatMap(section => section.items).reduce((sum, item) => sum + (item.quantity * 0.116), 0);
  const totalGrossWeight = sections.flatMap(section => section.items).reduce((sum, item) => sum + (item.quantity * 0.118), 0);

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-bold">PACKING LIST</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border border-collapse">
            <TableBody>
              {/* Header Row 1 */}
              <TableRow className="border">
                <TableCell className="border font-semibold p-2" colSpan={2}>EXPORTER:</TableCell>
                <TableCell className="border font-semibold p-2">Invoice No. & Date:</TableCell>
                <TableCell className="border font-semibold p-2">Exporter's Ref.:</TableCell>
              </TableRow>
              
              {/* Header Row 2 */}
              <TableRow className="border">
                <TableCell className="border p-2" rowSpan={3}>
                  <div className="font-semibold">{exporter}</div>
                  <div className="whitespace-pre-line text-sm">{companyAddress}</div>
                </TableCell>
                <TableCell className="border p-2" rowSpan={3}>
                  <div className="text-sm">
                    <div>EMAIL: {email}</div>
                    <div>TAX ID: {taxId}</div>
                  </div>
                </TableCell>
                <TableCell className="border p-2">
                  {invoiceNo} - {format(invoiceDate, 'dd/MM/yyyy')}
                </TableCell>
                <TableCell className="border p-2">
                  <div>I.E. Code #: {ieCode}</div>
                  <div>PAN NO. #: {panNo}</div>
                  <div>GSTIN NO #: {gstinNo}</div>
                  <div>STATE CODE : {stateCode}</div>
                </TableCell>
              </TableRow>
              
              {/* Header Row 3 */}
              <TableRow className="border">
                <TableCell className="border p-2">
                  <div>Buyer's Order No. & Date:</div>
                  <div>{buyersOrderNo} - {format(buyersOrderDate, 'dd/MM/yyyy')}</div>
                </TableCell>
                <TableCell className="border p-2" rowSpan={2}>
                  <div>PO No: {poNo}</div>
                </TableCell>
              </TableRow>
              
              {/* Header Row 4 */}
              <TableRow className="border">
                <TableCell className="border p-2">
                  <div>Notify Party # :</div>
                  <div>{notifyParty}</div>
                </TableCell>
              </TableRow>
              
              {/* Consignee Row */}
              <TableRow className="border">
                <TableCell className="border font-semibold p-2" colSpan={1}>Consignee:</TableCell>
                <TableCell className="border p-2" colSpan={3}>
                  <div className="whitespace-pre-line">{consignee}</div>
                </TableCell>
              </TableRow>
              
              {/* Shipping Info Row 1 */}
              <TableRow className="border">
                <TableCell className="border font-semibold p-2 text-center">Pre-Carriage By</TableCell>
                <TableCell className="border font-semibold p-2 text-center">Place of Receipt by Pre-Carrier</TableCell>
                <TableCell className="border font-semibold p-2 text-center">Country of Origin of Goods : INDIA</TableCell>
                <TableCell className="border font-semibold p-2 text-center">Country of Final Destination</TableCell>
              </TableRow>
              
              {/* Shipping Info Row 2 */}
              <TableRow className="border">
                <TableCell className="border p-2 text-center">{preCarriageBy || "-"}</TableCell>
                <TableCell className="border p-2 text-center">{placeOfReceipt || "MORBI"}</TableCell>
                <TableCell className="border p-2 text-center">{originDetails || "DISTRICT MORBI, STATE GUJARAT"}</TableCell>
                <TableCell className="border p-2 text-center">{countryOfFinalDestination || "USA"}</TableCell>
              </TableRow>
              
              {/* Shipping Info Row 3 */}
              <TableRow className="border">
                <TableCell className="border font-semibold p-2 text-center">Vessel/Flight No.</TableCell>
                <TableCell className="border font-semibold p-2 text-center">Port of Loading</TableCell>
                <TableCell className="border font-semibold p-2 text-center" colSpan={2}>Terms of Delivery & Payment :</TableCell>
              </TableRow>
              
              {/* Shipping Info Row 4 */}
              <TableRow className="border">
                <TableCell className="border p-2 text-center">{vesselFlightNo || "-"}</TableCell>
                <TableCell className="border p-2 text-center">{portOfLoading || "MUNDRA"}</TableCell>
                <TableCell className="border p-2" colSpan={2}>
                  <div>{termsOfDelivery || "FOB AT MUNDRA PORT"}</div>
                  <div>PAYMENT : 100% 00 EURO ADVANCE REMAINING AGAINST SCAN OF BL</div>
                </TableCell>
              </TableRow>
              
              {/* Shipping Info Row 5 */}
              <TableRow className="border">
                <TableCell className="border font-semibold p-2 text-center">Port of Discharge</TableCell>
                <TableCell className="border font-semibold p-2 text-center">Final Destination</TableCell>
                <TableCell className="border p-2 text-center" colSpan={2} rowSpan={2}>
                  <div className="font-semibold">{shippingMethod || "SHIPPING - THROUGH SEA/AIR"}</div>
                </TableCell>
              </TableRow>
              
              {/* Shipping Info Row 6 */}
              <TableRow className="border">
                <TableCell className="border p-2 text-center">{portOfDischarge || "NEW YORK"}</TableCell>
                <TableCell className="border p-2 text-center">{finalDestination || "USA"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          {/* Products Table */}
          <Table className="border border-collapse mt-4">
            <TableHead>
              <TableRow className="border bg-gray-100">
                <TableHead className="border font-semibold p-2 text-center">Marks & Nos.</TableHead>
                <TableHead className="border font-semibold p-2 text-center">Description of Goods</TableHead>
                <TableHead className="border font-semibold p-2 text-center" colSpan={2}>QUANTITY<br/>BOX</TableHead>
                <TableHead className="border font-semibold p-2 text-center">NET WT.<br/>IN KGS</TableHead>
                <TableHead className="border font-semibold p-2 text-center">GRS.WT.<br/>IN KGS</TableHead>
              </TableRow>
              <TableRow className="border">
                <TableHead className="border font-semibold p-2 text-center">10X20 FCL/LCL</TableHead>
                <TableHead className="border font-semibold p-2 text-center"></TableHead>
                <TableHead className="border font-semibold p-2 text-center" colSpan={2}></TableHead>
                <TableHead className="border font-semibold p-2 text-center"></TableHead>
                <TableHead className="border font-semibold p-2 text-center"></TableHead>
              </TableRow>
              <TableRow className="border">
                <TableHead className="border font-semibold p-2 text-center">SR NO. HSN CODE</TableHead>
                <TableHead className="border font-semibold p-2 text-center"></TableHead>
                <TableHead className="border font-semibold p-2 text-center" colSpan={2}></TableHead>
                <TableHead className="border font-semibold p-2 text-center"></TableHead>
                <TableHead className="border font-semibold p-2 text-center"></TableHead>
              </TableRow>
            </TableHead>
            <TableBody>
              {sections.flatMap((section, sectionIndex) => [
                // Section header
                <TableRow key={`section-${section.id}`} className="border">
                  <TableCell className="border p-2 text-center" colSpan={6}>
                    <div className="font-semibold">{section.title}</div>
                  </TableCell>
                </TableRow>,
                // Section items
                ...section.items.map((item, itemIndex) => {
                  const globalIndex = sections.slice(0, sectionIndex).reduce((sum, s) => sum + s.items.length, 0) + itemIndex + 1;
                  return (
                    <TableRow key={item.id} className="border">
                      <TableCell className="border p-2 text-center">
                        <div>{globalIndex}</div>
                        <div>{item.product.hsnCode}</div>
                      </TableCell>
                      <TableCell className="border p-2">
                        <div className="font-semibold">{item.product.description || "Glazed porcelain Floor Tiles"}</div>
                        <div>{item.product.size}</div>
                      </TableCell>
                      <TableCell className="border p-2 text-center" colSpan={2}>{item.quantity.toLocaleString()}</TableCell>
                      <TableCell className="border p-2 text-center bg-yellow-200">{(item.quantity * 0.116).toFixed(2)}</TableCell>
                      <TableCell className="border p-2 text-center bg-yellow-200">{(item.quantity * 0.118).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              ])}
              
              {/* Container Information */}
              <TableRow className="border">
                <TableCell className="border p-2 text-center font-semibold" colSpan={6}>
                  Export Under Duty Drawback Scheme
                </TableCell>
              </TableRow>
              <TableRow className="border">
                <TableCell className="border p-2 text-center" colSpan={6}>
                  I/we shall claim under chapter 3 incentive of FTP as admissible at time policy in force - MEIS, RODTEP
                </TableCell>
              </TableRow>
              
              {/* Container Details */}
              <TableRow className="border bg-gray-100">
                <TableCell className="border p-2 text-center font-semibold">CONTAINER NO.</TableCell>
                <TableCell className="border p-2 text-center font-semibold">LINE SEAL NO.</TableCell>
                <TableCell className="border p-2 text-center font-semibold">RFID SEAL #</TableCell>
                <TableCell className="border p-2 text-center font-semibold">Design no</TableCell>
                <TableCell className="border p-2 text-center font-semibold">QTY</TableCell>
                <TableCell className="border p-2 text-center font-semibold">NET WT</TableCell>
                <TableCell className="border p-2 text-center font-semibold">GRS WT</TableCell>
              </TableRow>
              
              {/* Sample Container Rows */}
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={`container-${i}`} className="border">
                  <TableCell className="border p-2 text-center">SC********</TableCell>
                  <TableCell className="border p-2 text-center bg-yellow-200">JL ********</TableCell>
                  <TableCell className="border p-2 text-center bg-yellow-200">SPPL **** ****</TableCell>
                  <TableCell className="border p-2 text-center">TILES</TableCell>
                  <TableCell className="border p-2 text-center">2000</TableCell>
                  <TableCell className="border p-2 text-center">{(2000 * 0.116).toFixed(2)}</TableCell>
                  <TableCell className="border p-2 text-center">{(2000 * 0.118).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              
              {/* Totals Row */}
              <TableRow className="border">
                <TableCell className="border p-2 text-center font-semibold">Nos. of Kind of Packages</TableCell>
                <TableCell className="border p-2 text-center font-semibold">Total</TableCell>
                <TableCell className="border p-2 text-center font-semibold" colSpan={2}>TOTAL PALLET - 1" NOS</TableCell>
                <TableCell className="border p-2 text-center">{totalQuantity}</TableCell>
                <TableCell className="border p-2 text-center">{totalNetWeight.toFixed(2)}</TableCell>
                <TableCell className="border p-2 text-center">{totalGrossWeight.toFixed(2)}</TableCell>
              </TableRow>
              
              {/* Units Row */}
              <TableRow className="border">
                <TableCell className="border p-2 text-center" colSpan={4}></TableCell>
                <TableCell className="border p-2 text-center font-semibold">BOX</TableCell>
                <TableCell className="border p-2 text-center font-semibold">KGS</TableCell>
                <TableCell className="border p-2 text-center font-semibold">KGS</TableCell>
              </TableRow>
              
              {/* Declaration */}
              <TableRow className="border">
                <TableCell className="border p-2" colSpan={6}>
                  <div className="mt-4">
                    <div>Declaration: We declare that this invoice shows the actual price of the goods</div>
                    <div>described and that all particulars are true and correct.</div>
                  </div>
                  <div className="flex justify-end mt-8">
                    <div className="text-right">
                      <div>AUTHORISED SIGN.</div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PackingList;

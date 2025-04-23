import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductSection } from '@/lib/types';
import { format } from 'date-fns';

interface AnnexureProps {
  onBack: () => void;
  importedSections?: ProductSection[];
  markNumber?: string;
  invoiceHeader?: {
    invoiceNo: string;
    invoiceDate: Date;
    email: string;
    taxid: string;
    ieCode: string;
    panNo: string;
    gstinNo: string;
    stateCode: string;
    selectedExporter: string;
    companyAddress: string;
  };
  buyerInfo?: {
    consignee: string;
    notifyParty: string;
    buyersOrderNo: string;
    buyersOrderDate: Date;
    poNo: string;
  };
  shippingInfo?: {
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
    selectedCurrency: string;
    currencyRate: string;
  };
  containerInfo?: {
    containerRows: any[];
    totalPalletCount: string;
  };
}

// Define manufacturer data type
interface ManufacturerData {
  name: string;
  address: string;
  gstin: string;
  permitNumber: string;
  permitDate: string;
  issuedBy: string;
}

const Annexure = ({
  onBack,
  importedSections,
  markNumber,
  invoiceHeader,
  buyerInfo,
  shippingInfo,
  containerInfo
}: AnnexureProps) => {
  // State for user-editable form data
  const [range, setRange] = useState('MORBI');
  const [division, setDivision] = useState('MORBI II');
  const [commissionerate, setCommissionerate] = useState('RAJKOT');
  const [examDate, setExamDate] = useState(invoiceHeader?.invoiceDate 
      ? format(new Date(invoiceHeader.invoiceDate), 'dd.MM.yyyy')
      : format(new Date(), 'dd.MM.yyyy'));
  const [invoiceDate, setInvoiceDate] = useState(invoiceHeader?.invoiceDate 
      ? format(new Date(invoiceHeader.invoiceDate), 'dd.MM.yyyy')
      : format(new Date(), 'dd.MM.yyyy'));
  const [netWeight, setNetWeight] = useState('281900');
  const [grossWeight, setGrossWeight] = useState('287440');
  const [totalPackages, setTotalPackages] = useState('14000');
  const [officeDesignation1, setOfficeDesignation1] = useState('SELF SEALING');
  const [officeDesignation2, setOfficeDesignation2] = useState('SELF SEALING');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [containerSizes, setContainerSizes] = useState<string[]>([]);
  const [lutDate, setLutDate] = useState('27/03/2024');
  const [locationCode, setLocationCode] = useState('');
  const [sampleSealNo, setSampleSealNo] = useState('N/A');
  const [question9a, setQuestion9a] = useState('YES');
  const [question9b, setQuestion9b] = useState('NO');
  const [sealType1, setSealType1] = useState('SELF SEALING');
  const [sealType2, setSealType2] = useState('SELF SEALING');

  // Predefined manufacturer options
  const manufacturers: Record<string, ManufacturerData> = {
    'DEMO VITRIFIED PVT LTD': {
      name: 'DEMO VITRIFIED PVT LTD',
      address: 'Survey No. 304/P1, test address test address test address\ntest addresstest addresstest addresstest addresstest address',
      gstin: '24AAVCA********',
      permitNumber: '***/****/****/33/2024-Tech-0/o ***************, SSP NO.**** /****/****/2023-**',
      permitDate: '16.02.2024',
      issuedBy: 'The ****/********************, Custom (PREV.), *******'
    },
    'ZERIC CERAMICA': {
      name: 'ZERIC CERAMICA',
      address: '123 Ceramic Road, Industrial Area, Morbi, Gujarat\nIndia - 363642',
      gstin: '24AAQCA********',
      permitNumber: '***/****/****/33/2024-Tech-0/o ***************, SSP NO.**** /****/****/2023-**',
      permitDate: '16.02.2024',
      issuedBy: 'The ****/********************, Custom (PREV.), *******'
    }
  };

  const [manufacturerData, setManufacturerData] = useState<ManufacturerData>(manufacturers['DEMO VITRIFIED PVT LTD']);

  // Container size options
  const sizeOptions = ["1 x 20'", "1 x 40'", "1 x 40' HC"];

  useEffect(() => {
    // Calculate total from container info if available
    if (containerInfo?.containerRows) {
      const totalNet = containerInfo.containerRows.reduce(
        (sum, row) => sum + parseFloat(row.netWeight || "0"), 0
      ).toFixed(0);
      
      const totalGross = containerInfo.containerRows.reduce(
        (sum, row) => sum + parseFloat(row.grossWeight || "0"), 0
      ).toFixed(0);
      
      const totalQty = containerInfo.containerRows.reduce(
        (sum, row) => sum + (row.quantity || 0), 0
      );
      
      setNetWeight(totalNet);
      setGrossWeight(totalGross);
      setTotalPackages(totalQty.toString());

      // Initialize container sizes based on packaging list data
      setContainerSizes(containerInfo.containerRows.map((row) => row.size || "1 x 20'"));
      
      // Initialize manufacturer selection
      setSelectedManufacturer('DEMO VITRIFIED PVT LTD');
    }
  }, [containerInfo]);

  useEffect(() => {
    // Update manufacturer data when selection changes
    if (selectedManufacturer && manufacturers[selectedManufacturer]) {
      setManufacturerData(manufacturers[selectedManufacturer]);
    }
  }, [selectedManufacturer]);

  // Handle form submission - same functionality as PackagingList submit
  const handleSubmit = () => {
    localStorage.setItem("taxDialogBox", "true");
    console.log(localStorage.getItem("taxDialogBox"));
  };

  // Handle container size change
  const handleSizeChange = (index: number, size: string) => {
    const newSizes = [...containerSizes];
    newSizes[index] = size;
    setContainerSizes(newSizes);
  };

  return (
    <div className="space-y-6">
      {/* Header - App-themed styling but maintaining the image layout */}
      <div className="bg-white p-6 shadow-sm border rounded-lg">
        <h1 className="text-3xl font-bold text-center mb-2">ANNEXURE</h1>
        <div className="text-center font-semibold mt-2 mb-4">
          OFFICE OF THE SUPERITENTNDENT OF GST
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-center">
            <span className="font-medium mr-2">RANGE:</span>
            <Input 
              value={range} 
              onChange={(e) => setRange(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">DIVISION:</span>
            <Input 
              value={division} 
              onChange={(e) => setDivision(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">COMMISSIONERATE:</span>
            <Input 
              value={commissionerate} 
              onChange={(e) => setCommissionerate(e.target.value)}
            />
          </div>
        </div>
        <div className="text-center font-semibold bg-gray-50 p-2 rounded">
          EXAMINATION REPORT FOR FACTORY SEALED CONTAINER
        </div>
      </div>

      {/* Form in table format - Sections 1-8 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            {/* Row 1: Name of Exporter */}
            <tr className="border">
              <td className="border p-3 w-1/3 align-top">
                <div className="font-medium">1 NAME OF EXPORTER</div>
              </td>
              <td className="border p-3">
                <div className="font-medium">{invoiceHeader?.selectedExporter || 'ZERIC CERAMICA'}</div>
                <div className="mt-1">TAX ID: {invoiceHeader?.taxid || '24AACJ********'}</div>
              </td>
            </tr>

            {/* Row 2: Exporter's Code Section */}
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">2 (a) I.E.CODE No.</div>
                <div className="mt-8">(b) BRANCH CODE No.</div>
                <div className="mt-8">(c) BIN No.</div>
              </td>
              <td className="border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">I. E. Code #:</span> {invoiceHeader?.ieCode || 'AA********'}
                  </div>
                  <div>
                    <span className="font-medium ">PAN NO. #:</span> {invoiceHeader?.panNo || 'AA********'}
                  </div>
                  <div>
                    <span className="font-medium">GSTIN NO.#:</span> {invoiceHeader?.gstinNo || '24AACFZ********'}
                  </div>
                  <div>
                    <span className="font-medium">STATE CODE:</span> {invoiceHeader?.stateCode || '**'}
                  </div>
                </div>
                <div className="mt-3 border-t pt-3">
                  <Input placeholder="Enter branch code" className="mt-1" />
                </div>
                <div className="mt-3 border-t pt-3">
                  <Input placeholder="Enter BIN number" className="mt-1" />
                </div>
              </td>
            </tr>

            {/* Row 3: Manufacturer Section */}
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">3 NAME OF THE MANUFACTURER</div>
                <div className="ml-3">(DIFFERENCE FROM THE EXPORTER)</div>
                <div className="mt-12 font-medium">FACTORY ADDRESS</div>
              </td>
              <td className="border p-3">
                <div>
                  <Select 
                    value={selectedManufacturer} 
                    onValueChange={setSelectedManufacturer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(manufacturers).map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2">{manufacturerData?.address}</div>
                </div>
                <div className="mt-2">
                  <div className="flex">
                    <span className="font-medium w-16">GST:</span>
                    <span>{manufacturerData?.gstin}</span>
                  </div>
                </div>
              </td>
            </tr>

            {/* Row 4: Examination Date */}
            <tr className="border">
              <td className="border p-3">
                <div className="font-medium">4 DATE OF EXAMINATION</div>
              </td>
              <td className="border p-3">
                <div>Dt. {examDate}</div>
              </td>
            </tr>

            {/* Row 5: Officer Information */}
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">5 NAME AND DESIGNATION OF THE EXAMINING</div>
                <div className="ml-3 mt-1">OFFICER / INSPECTOR / EO / PO</div>
              </td>
              <td className="border p-3">
                <Select value={officeDesignation1} onValueChange={setOfficeDesignation1}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELF SEALING">SELF SEALING</SelectItem>
                    <SelectItem value="INSPECTOR">INSPECTOR</SelectItem>
                    <SelectItem value="OFFICER">OFFICER</SelectItem>
                    <SelectItem value="EO">EO</SelectItem>
                    <SelectItem value="PO">PO</SelectItem>
                  </SelectContent>
                </Select>
              </td>
            </tr>

            {/* Row 6: Officer Information */}
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">6 NAME AND DESIGNATION OF THE EXAMINING</div>
                <div className="ml-3 mt-1">OFFICER / APPRAISER / SUPERINTENDENT</div>
              </td>
              <td className="border p-3">
                <Select value={officeDesignation2} onValueChange={setOfficeDesignation2}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELF SEALING">SELF SEALING</SelectItem>
                    <SelectItem value="APPRAISER">APPRAISER</SelectItem>
                    <SelectItem value="SUPERINTENDENT">SUPERINTENDENT</SelectItem>
                    <SelectItem value="OFFICER">OFFICER</SelectItem>
                  </SelectContent>
                </Select>
              </td>
            </tr>

            {/* Row 7: Commissioner Information */}
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">7 (a) NAME OF COMMISERATE / DIVISION / RANGE</div>
                <div className="mt-8">(b) LOCATION CODE</div>
              </td>
              <td className="border p-3">
                <div>{`${commissionerate} /DIV-${division.includes("II") ? "II" : "I"},${range} / ${range}`}</div>
                <div className="mt-3 pt-3 border-t">
                  <Input 
                    value={locationCode}
                    onChange={(e) => setLocationCode(e.target.value)}
                    placeholder="Enter location code"
                    
                  />
                </div>
              </td>
            </tr>

            {/* Row 8: Invoice Information */}
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">8 PARTICULARS OF EXPORT INVOICE</div>
                <div className="mt-3">(a) EXPORT INVOICE No</div>
                <div className="mt-3">(b) TOTAL No. OF PACKAGES</div>
                <div className="mt-3">(c) NAME AND ADDRESS OF THE CONSIGNEE</div>
              </td>
              <td className="border p-3">
                <div className="h-4"></div>
                <div className="border-t pt-2">{`INV/${invoiceHeader?.invoiceNo || '01**'}/2024-25 Dt. ${invoiceDate}`}</div>
                <div className="border-t pt-2 mt-2">{totalPackages}</div>
                <div className="border-t pt-2 mt-2">
                  <div>{buyerInfo?.consignee || 'XYZ'}</div>
                  <div>{shippingInfo?.finalDestination || 'USA'}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Form in table format - Sections 9-10 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden mt-6">
        <table className="w-full border-collapse">
          <tbody>
            {/* Row 9: Export Invoice Questions */}
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">9. (a) IS THE DESCRIPTION OF THE GOODS THE QUANTITY AND THERE VALUE AS PER PARTICULARS FURNISHED IN THE EXPORT INVOICE</div>
              </td>
              <td className="border p-3">
                <Select value={question9a} onValueChange={setQuestion9a}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">YES</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                  </SelectContent>
                </Select>
              </td>
            </tr>
            
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">(b) WHETHER SAMPLES IS DRAWN FOR BEING FORWARDED TO PORT OF EXPORT</div>
              </td>
              <td className="border p-3">
                <Select value={question9b} onValueChange={setQuestion9b}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">YES</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                  </SelectContent>
                </Select>
              </td>
            </tr>
            
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">(c) IF YES THE No. OF THE SEAL OF THE PACKAGE CONTAINING THE SAMPLE</div>
              </td>
              <td className="border p-3">
                <Input 
                  value={sampleSealNo}
                  onChange={(e) => setSampleSealNo(e.target.value)}
                />
              </td>
            </tr>
            
            {/* Row 10: Seal Information */}
            <tr className="border">
              <td className="border p-3 align-top" colSpan={2}>
                <div className="font-medium">10. CENTRAL EXCISE / CUSTOM SEAL No.</div>
              </td>
            </tr>
            
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">(a) FOR NON CONTAINERIZED CARGO No.OF PACKAGES</div>
              </td>
              <td className="border p-3">
                <Select value={sealType1} onValueChange={setSealType1}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELF SEALING">SELF SEALING</SelectItem>
                    <SelectItem value="CUSTOM SEAL">CUSTOM SEAL</SelectItem>
                  </SelectContent>
                </Select>
              </td>
            </tr>
            
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">(b) FOR CONTAINERAISED CARGO</div>
              </td>
              <td className="border p-3">
                <Select value={sealType2} onValueChange={setSealType2}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELF SEALING">SELF SEALING</SelectItem>
                    <SelectItem value="CUSTOM SEAL">CUSTOM SEAL</SelectItem>
                  </SelectContent>
                </Select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Container Table and Remaining Sections */}
      <Card className="mt-6">
        <CardContent className="space-y-6 pt-6">
          {/* Container Table */}
          <div className="pt-4">
            <Label className="block mb-4 font-medium">Container Information</Label>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-3 text-center font-medium text-gray-600">CONTAINER NO.</th>
                    <th className="border p-3 text-center font-medium text-gray-600">LINE SEAL NO.</th>
                    <th className="border p-3 text-center font-medium text-gray-600">RFID SEAL</th>
                    <th className="border p-3 text-center font-medium text-gray-600">Design no</th>
                    <th className="border p-3 text-center font-medium text-gray-600">QUANTITY<br/>BOX</th>
                  </tr>
                </thead>
                <tbody>
                  {containerInfo?.containerRows ? (
                    containerInfo.containerRows.map((row, index) => (
                      <tr key={row.id || index} className="border-b">
                        <td className="border p-3 text-center">{row.containerNo || 'Sp***********'}</td>
                        <td className="border p-3 text-center">{row.lineSealNo || 'R ********'}</td>
                        <td className="border p-3 text-center">{row.rfidSeal || 'SPPL **** ****'}</td>
                        <td className="border p-3 text-center">TILES</td>
                        <td className="border p-3 text-center">{row.quantity || 1000}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b">
                      <td className="border p-3 text-center">Sp***********</td>
                      <td className="border p-3 text-center">R ********</td>
                      <td className="border p-3 text-center">SPPL **** ****</td>
                      <td className="border p-3 text-center">TILES</td>
                      <td className="border p-3 text-center">1000</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Permission Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>11. S.S. PERMISSION No.</Label>
              <div className="text-center p-2 border rounded">
                {manufacturerData?.permitNumber} Dt.: {manufacturerData?.permitDate}
              </div>
              <div className="text-center text-red-500 mt-1">
                Issued by {manufacturerData?.issuedBy}
              </div>
            </div>
          </div>
          
          {/* GST Circular */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>12. EXPORT UNDER GST CIRCULAR NO. 26/2017 Customs DT.01/07/2017</Label>
            </div>
          </div>
          
          {/* Undertaking Details */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>13. LETTER OF UNDERTAKING DETAILS</Label>
              <div className="p-2 border rounded">
                <div>LETTER OF UNDERTAKING NO.ACKNOWLEDGMENT FOR LUT APPLICATION REFERENCE NUMBER (ARN) AD240324********</div>
                <div className="flex items-center mt-2">
                  <Label className="w-10">DT:</Label>
                  <Input 
                    value={lutDate}
                    onChange={(e) => setLutDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
              <div className="mt-2">
                EXAMINED THE EXPORT GOODS COVERED UNDER THIS INVOICE, DESCRIPTION OF THE GOODS WITH REFERENCE TO DBK & MEIS SCHEME & NET WAIGHT OF ALL Tiles ARE AS UNDER
              </div>
            </div>
          </div>
          
          {/* Self Sealing Notice */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="text-center font-bold p-2 border rounded">
                EXPORT UNDER SELF SEALING UNDER Circular No. : 59/2010 Dated : 23.12.2010
              </div>
            </div>
          </div>
          
          {/* Certification Text */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2 text-sm p-2 border rounded">
              Certified that the description and value of the goods coverd by this invoice have been checked by me and the goods have been packed and sealed with lead seal one time lock seal checked by me and the goods have been packed and sealed with lead seal/ one time lock seal.
            </div>
          </div>
          
          {/* Weights Section without signature */}
          <div className="pt-4 border-t">
            <div className="text-center">
              <div className="p-2 border rounded mb-2">
                NET WEIGHT: {netWeight} KGS
              </div>
              <div className="p-2 border rounded">
                GROSS WEIGHT: {grossWeight} KGS
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Footer Buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button variant="default" onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  );
};

export default Annexure; 
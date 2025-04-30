import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format } from 'date-fns';

interface VgmFormProps {
  onBack: () => void;
  containerInfo?: {
    containerRows: any[];
    totalPalletCount: string;
  };
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
}

const VgmForm = ({
  onBack,
  containerInfo,
  invoiceHeader
}: VgmFormProps) => {
  // State for shipper information
  const [selectedShipper, setSelectedShipper] = useState<string>('');
  const [shipperRegistration, setShipperRegistration] = useState<string>('');
  const [shipperOfficial, setShipperOfficial] = useState<string>('');
  const [contactDetails, setContactDetails] = useState<string>('');
  const [weighingDate, setWeighingDate] = useState<string>(format(new Date(), 'dd.MM.yyyy'));
  const [weighingTime, setWeighingTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [containerSize, setContainerSize] = useState<string>("20'");
  const [containerNumber, setContainerNumber] = useState<string>("AS PER ANNEXURE");
  const [weighBridgeNo, setWeighBridgeNo] = useState<string>("AS PER ANNEXURE");
  const [verifiedGrossMass, setVerifiedGrossMass] = useState<string>("method-1");
  const [unitOfMeasure, setUnitOfMeasure] = useState<string>("KG");
  const [weighingSlipNo, setWeighingSlipNo] = useState<string>("AS PER ANNEXURE");
  const [containerType, setContainerType] = useState<string>("NORMAL");
  const [hazardousClass, setHazardousClass] = useState<string>("NA");

  // State for booking numbers and tare weights for each container
  const [bookingNumbers, setBookingNumbers] = useState<string[]>([]);
  const [tareWeights, setTareWeights] = useState<string[]>([]);
  
  // Predefined shipper options
  const shippers: {[key: string]: any} = {
    'ZERIC CERAMICA': {
      registration: 'I. E. Code #: AA********',
      official: 'ROHIT KACHADIYA',
      contact: '**12******'
    },
    'DEMO VITRIFIED PVT LTD': {
      registration: 'I. E. Code #: BB********',
      official: 'JOHN DOE',
      contact: '**13******'
    }
  };

  useEffect(() => {
    // Initialize with containerInfo data if available
    if (containerInfo?.containerRows) {
      // Default shipper to the one from invoice header
      if (invoiceHeader?.selectedExporter) {
        handleShipperSelect(invoiceHeader.selectedExporter);
      }
      
      // Initialize booking numbers and tare weights arrays
      const newBookingNumbers = containerInfo.containerRows.map(() => 'EI*********');
      const newTareWeights = containerInfo.containerRows.map(() => '2180');
      
      setBookingNumbers(newBookingNumbers);
      setTareWeights(newTareWeights);
    }
  }, [containerInfo, invoiceHeader]);

  const handleShipperSelect = (shipper: string) => {
    setSelectedShipper(shipper);
    
    // Auto-fill related fields based on selected shipper
    if (shipper in shippers) {
      const shipperInfo = shippers[shipper];
      setShipperRegistration(shipperInfo.registration);
      setShipperOfficial(shipperInfo.official);
      setContactDetails(shipperInfo.contact);
    }
  };

  const handleBookingNumberChange = (index: number, value: string) => {
    const newBookingNumbers = [...bookingNumbers];
    newBookingNumbers[index] = value;
    setBookingNumbers(newBookingNumbers);
  };

  const handleTareWeightChange = (index: number, value: string) => {
    const newTareWeights = [...tareWeights];
    newTareWeights[index] = value;
    setTareWeights(newTareWeights);
  };

  const handleSubmit = () => {
   
    
    // Here you can add logic to submit the form
    alert("Form submitted successfully!");
  };

  // Calculate total VGM (Gross Weight + Tare Weight)
  const calculateTotalVGM = (grossWeight: string, tareWeight: string) => {
    const gross = parseFloat(grossWeight || '0');
    const tare = parseFloat(tareWeight || '0');
    return (gross + tare).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 shadow-sm border rounded-lg">
        <h1 className="text-3xl font-bold text-center mb-2">VGM</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">INFORMATION ABOUT VERIFIED GROSS MASS OF CONTAINER</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form fields in numbered format */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">1. Name of the shipper</Label>
                <Select value={selectedShipper} onValueChange={handleShipperSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Shipper" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZERIC CERAMICA">ZERIC CERAMICA</SelectItem>
                    <SelectItem value="DEMO VITRIFIED PVT LTD">DEMO VITRIFIED PVT LTD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-red-600">{selectedShipper}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">2. Shipper Registration /License no.( IEC No/CIN No)**</Label>
                <Input 
                  value={shipperRegistration} 
                  readOnly 
                  className="bg-gray-50" 
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">{shipperRegistration}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">3. Name and designation of official of the shipper authorized</Label>
                <Input 
                  value={shipperOfficial} 
                  readOnly 
                  className="bg-gray-50" 
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">{shipperOfficial}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">4. 24 x 7 contact details of authorised official of shipper</Label>
                <Input 
                  value={contactDetails} 
                  readOnly 
                  className="bg-gray-50" 
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">{contactDetails}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">5. Container No.</Label>
                <Input 
                  value={containerNumber} 
                  onChange={(e) => setContainerNumber(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">{containerNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">6. Container Size ( TEU/FEU/other)</Label>
                <Select value={containerSize} onValueChange={setContainerSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20'">20'</SelectItem>
                    <SelectItem value="40'">40'</SelectItem>
                    <SelectItem value="40' HC">40' HC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="font-medium">{containerSize}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">7. Maximum permissible weight of container as per the CSC plate</Label>
                <Input 
                  value="AS PER ANNEXURE" 
                  onChange={(e) => {}} 
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">AS PER ANNEXURE</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">8. Weighbridge registration no. & Address of Weighbridge</Label>
                <Input 
                  value={weighBridgeNo} 
                  onChange={(e) => setWeighBridgeNo(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">{weighBridgeNo}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">9. Verified gross mass of container (method-1/method-2)</Label>
                <Select value={verifiedGrossMass} onValueChange={setVerifiedGrossMass}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="method-1">method-1</SelectItem>
                    <SelectItem value="method-2">method-2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="font-medium">{verifiedGrossMass}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">10. Unit of measure (KG / MT/ LBS)</Label>
                <Select value={unitOfMeasure} onValueChange={setUnitOfMeasure}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="LBS">LBS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="font-medium">{unitOfMeasure}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">11. Date and time of weighing</Label>
                <div className="flex gap-2">
                  <Input 
                    value={`Dt. ${weighingDate}`} 
                    readOnly 
                    className="bg-gray-50" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Dt. {weighingDate}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">12. Weighing slip no.</Label>
                <Input 
                  value={weighingSlipNo} 
                  onChange={(e) => setWeighingSlipNo(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">{weighingSlipNo}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">13. Type (Normal/Reefer/Hazardous/others)</Label>
                <Select value={containerType} onValueChange={setContainerType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">NORMAL</SelectItem>
                    <SelectItem value="REEFER">REEFER</SelectItem>
                    <SelectItem value="HAZARDOUS">HAZARDOUS</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="font-medium">{containerType}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">14. If Hazardous  UN NO.IMDG class</Label>
                <Input 
                  value={hazardousClass} 
                  onChange={(e) => setHazardousClass(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">{hazardousClass}</div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-2 gap-6 border-t pt-6">
            <div className="space-y-2">
              <div className="font-medium">Signature of authorised person of shipper</div>
              <div className="font-medium mt-4">NAME: {shipperOfficial}</div>
              <div className="font-medium">DATE: Dt. {weighingDate}</div>
            </div>
          </div>

          {/* VGM Table */}
          <div className="mt-6 border-t pt-6">
            <Table className="border w-full">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="border font-medium text-center">BOOKING NO</TableHead>
                  <TableHead className="border font-medium text-center">CONTAINER NUMBER</TableHead>
                  <TableHead className="border font-medium text-center">VGM (KGS)<br/>( CARGO+TARE WEIGHT)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containerInfo?.containerRows ? (
                  containerInfo.containerRows.map((row, index) => (
                    <TableRow key={index} className="border-b hover:bg-gray-50">
                      <TableCell className="border p-0">
                        <Input
                          value={bookingNumbers[index] || ''}
                          onChange={(e) => handleBookingNumberChange(index, e.target.value)}
                          className="h-10 border-0 text-center"
                        />
                      </TableCell>
                      <TableCell className="border text-center">
                        {row.containerNo || 'S***********'}
                      </TableCell>
                      <TableCell className="border">
                        <div className="flex items-center justify-center">
                          <div className="text-right pr-2 w-1/3">{row.grossWeight || '0.00'}</div>
                          <div className="px-2">+</div>
                          <Input
                            value={tareWeights[index] || ''}
                            onChange={(e) => handleTareWeightChange(index, e.target.value)}
                            className="h-10 border-0 text-center w-20"
                          />
                          <div className="px-2">=</div>
                          <div className="text-right pl-2 w-1/3 font-medium">
                            {calculateTotalVGM(row.grossWeight || '0', tareWeights[index] || '0')}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-b hover:bg-gray-50">
                    <TableCell className="border p-0">
                      <Input
                        value="EI*********"
                        onChange={(e) => {}}
                        className="h-10 border-0 text-center"
                      />
                    </TableCell>
                    <TableCell className="border text-center">
                      S***********
                    </TableCell>
                    <TableCell className="border">
                      <div className="flex items-center justify-center">
                        <div className="text-right pr-2 w-1/3">111111.00</div>
                        <div className="px-2">+</div>
                        <Input
                          value="2180"
                          onChange={(e) => {}}
                          className="h-10 border-0 text-center w-20"
                        />
                        <div className="px-2">=</div>
                        <div className="text-right pl-2 w-1/3 font-medium">113291.00</div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={()=>{
              localStorage.setItem("taxDialogBox","false")
              handleSubmit()
            }}>
              Submit
        </Button>
      </div>
    </div>
  );
};

export default VgmForm; 
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

// Handle date-fns import with try-catch to avoid TypeScript errors
let format: (date: Date | number, format: string) => string;
try {
  const dateFns = require('date-fns');
  format = dateFns.format;
} catch (error) {
  format = (date, fmt) => new Date(date).toLocaleDateString();
}

import { useForm } from '@/context/FormContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { getCurrentFormId, loadFormSection, getValueFromSection, saveFormSection } from "@/lib/formDataUtils";

// Handle toast notifications with error handling to avoid import errors
let toast: any = {
  success: (message: string) => console.log(`[SUCCESS] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`)
};
try {
  const sonner = require('sonner');
  toast = sonner.toast;
} catch (error) {
  // Use default console implementation
}


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
  gstin_number: string;
  permission: string;
 
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
  const {formData, setAnnexureData, ensureFormDataFromLocalStorage} = useForm();
  let invoice = formData.invoice
  let packaging = formData.packagingList
  let buyer = formData.invoice.buyer
  let shipping = formData.invoice.shipping
  
  // Get current form ID for localStorage
  const currentFormId = invoiceHeader?.invoiceNo || getCurrentFormId();
  
  // Load all form data from localStorage on component mount
  useEffect(() => {
    if (currentFormId) {
      ensureFormDataFromLocalStorage(currentFormId);
    }
  }, [currentFormId, ensureFormDataFromLocalStorage]);
  
  // Function to save a field to localStorage
  const saveFieldToLocalStorage = (field: string, value: any) => {
    try {
      // Load current annexure data
      const annexureData = loadFormSection(currentFormId, 'annexure') || {};
      
      // Update the field
      annexureData[field] = value;
      
      // Save back to localStorage
      saveFormSection(currentFormId, 'annexure', annexureData);
      
      // Update form context
      setAnnexureData(annexureData);
    } catch (error) {
      console.error(`Error saving ${field} to localStorage:`, error);
    }
  };
  
  // State for user-editable form data
  const [range, setRange] = useState(() => {
    return getValueFromSection('annexure', 'range', 'MORBI');
  });
  const [division, setDivision] = useState(() => {
    return getValueFromSection('annexure', 'division', 'MORBI II');
  });
  const [commissionerate, setCommissionerate] = useState(() => {
    return getValueFromSection('annexure', 'commissionerate', 'RAJKOT');
  });
  const [examDate, setExamDate] = useState(() => {
    return getValueFromSection('annexure', 'examDate', 
      invoiceHeader?.invoiceDate 
        ? format(new Date(invoiceHeader.invoiceDate), 'dd.MM.yyyy')
        : format(new Date(), 'dd.MM.yyyy')
    );
  });
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return getValueFromSection('annexure', 'invoiceDate', 
      invoiceHeader?.invoiceDate 
        ? format(new Date(invoiceHeader.invoiceDate), 'dd.MM.yyyy')
        : format(new Date(), 'dd.MM.yyyy')
    );
  });
  
  // Get weights and packages from packaging list if available
  const [netWeight, setNetWeight] = useState(() => {
    return getValueFromSection('packagingList', 'net_weight', '281900');
  });
  const [grossWeight, setGrossWeight] = useState(() => {
    return getValueFromSection('packagingList', 'gross_weight', '287440');
  });
  const [totalPackages, setTotalPackages] = useState(() => {
    return getValueFromSection('packagingList', 'total_packages', '14000');
  });
  
  const [officeDesignation1, setOfficeDesignation1] = useState(() => {
    return getValueFromSection('annexure', 'officeDesignation1', 'SELF SEALING');
  });
  const [officeDesignation2, setOfficeDesignation2] = useState(() => {
    return getValueFromSection('annexure', 'officeDesignation2', 'SELF SEALING');
  });
  const [selectedManufacturer, setSelectedManufacturer] = useState(() => {
    return getValueFromSection('annexure', 'selectedManufacturer', '');
  });
  const [containerSizes, setContainerSizes] = useState<string[]>(() => {
    return getValueFromSection('annexure', 'containerSizes', []);
  });
  const [lutDate, setLutDate] = useState(() => {
    return getValueFromSection('annexure', 'lutDate', '27/03/2024');
  });
  const [arn, setArn] = useState(() => {
    return getValueFromSection('annexure', 'arn', 'AD240324********');
  });
  const [locationCode, setLocationCode] = useState(() => {
    return getValueFromSection('annexure', 'locationCode', '');
  });
  const [sampleSealNo, setSampleSealNo] = useState(() => {
    return getValueFromSection('annexure', 'sampleSealNo', 'N/A');
  });
  const [question9a, setQuestion9a] = useState(() => {
    return getValueFromSection('annexure', 'question9a', 'YES');
  });
  const [question9b, setQuestion9b] = useState(() => {
    return getValueFromSection('annexure', 'question9b', 'NO');
  });
  const [sealType1, setSealType1] = useState(() => {
    return getValueFromSection('annexure', 'sealType1', 'SELF SEALING');
  });
  const [sealType2, setSealType2] = useState(() => {
    return getValueFromSection('annexure', 'sealType2', 'SELF SEALING');
  });
  const navigate = useNavigate();
  // Predefined manufacturer options
  const manufacturers: Record<string, ManufacturerData> = {
    
  };

  const [manufacturerData, setManufacturerData] = useState<ManufacturerData>({
    name: '',
    address: '',
    gstin_number: '',
    permission: ''});
  const [availableSuppliers, setAvailableSuppliers] = useState<ManufacturerData[]>([]);
  // Container size options
  const sizeOptions = ["1 x 20'", "1 x 40'", "1 x 40' HC"];
  async function getSuppliers() {
    let res = await api.get("/supplier")
    if (res.status !== 200) {
      return "error"
    }
    return res.data.data
  }
  async function getArn() {
    let res = await api.get("/arn")
    if (res.status !== 200) {
      return "error"
    }
    return res.data.data
  }
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
      (async () => {
        try {
          const fetchedSuppliers = await getSuppliers();
          // const fetchedArn = await getArn();
          setAvailableSuppliers(fetchedSuppliers);
        }
        catch (error) {
          // Failed to fetch suppliers - handled with toast
        }
      })()
      setNetWeight(totalNet);
      setGrossWeight(totalGross);
      setTotalPackages(totalQty.toString());

      // Initialize container sizes based on packaging list data
      setContainerSizes(containerInfo.containerRows.map((row) => row.size || "1 x 20'"));
      
      // Initialize manufacturer selection
      setSelectedManufacturer('DEMO VITRIFIED PVT LTD');
    }
  }, [containerInfo]);

  // useEffect(() => {
  //   // Update manufacturer data when selection changes
  //   if (selectedManufacturer && manufacturers[selectedManufacturer]) {
  //     setManufacturerData(manufacturers[selectedManufacturer]);
  //   }
  // }, [selectedManufacturer]);

  // Handle form submission - navigate to VGM form
  const handleSubmit = () => {
    // Store data for VGM form
    const vgmData = {
      containerInfo,
      invoiceHeader,
      netWeight,
      grossWeight
    };
    localStorage.setItem('vgmData', JSON.stringify(vgmData));
    
    // Navigate to the VGM form page
    
    navigate('/vgm-form');
  };

  // Handle container size change
  const handleSizeChange = (index: number, size: string) => {
    const newSizes = [...containerSizes];
    newSizes[index] = size;
    setContainerSizes(newSizes);
  };
  
  const handleSupplierSelect = (value: string) => {
    const selectedSupplier = availableSuppliers.find(s => s.name === value);
    const updatedManufacturerData = {
      name: selectedSupplier?.name || '',
      address: selectedSupplier?.address || '',
      gstin_number: selectedSupplier?.gstin_number || '',
      permission: selectedSupplier?.permission || '',
    };
    
    // Update state
    setManufacturerData(updatedManufacturerData);
    
    // Save to localStorage
    saveFieldToLocalStorage('selected_manufacturer', updatedManufacturerData);
  };
  // add all the annexure data to the formData
  useEffect(() => {
    // Update formData with annexure data'
    setAnnexureData({
      range:range,
      division:division,
      commissionerate:commissionerate,
      exam_date:examDate,
      invoice_date:invoiceDate,
      net_weight:netWeight,
      gross_weight:grossWeight,
      total_packages:totalPackages,
      officer_designation1:officeDesignation1,
      officer_designation2:officeDesignation2,
      selected_manufacturer:manufacturerData,
      
      lut_date:lutDate,
      location_code:locationCode,
      question9c:sampleSealNo,
      question9a:question9a,
      question9b:question9b,
      
      non_containerized:sealType1,
      containerized:sealType2
      
    });
    
  }
  , [range, division, commissionerate, examDate, invoiceDate, netWeight, grossWeight, totalPackages, officeDesignation1, officeDesignation2, selectedManufacturer, lutDate, locationCode, sampleSealNo, question9a, question9b, sealType1, sealType2]);

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
                <div className="font-medium">{invoice?.exporter.company_name || 'ZERIC CERAMICA'}</div>
                <div className="mt-1">TAX ID: {invoice?.exporter.tax_id }</div>
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
                    <span className="font-medium">I. E. Code #:</span> {invoice?.exporter.ie_code }
                  </div>
                  <div>
                    <span className="font-medium ">PAN NO. #:</span> {invoice?.exporter.pan_number }
                  </div>
                  <div>
                    <span className="font-medium">GSTIN NO.#:</span> {invoice?.exporter.gstin_number }
                  </div>
                  <div>
                    <span className="font-medium">STATE CODE:</span> {invoice?.exporter.state_code }
                  </div>
                </div>
                <div className="mt-3 border-t pt-3">
                  <Input placeholder="Enter branch code"  className="mt-1" />
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
                    value={manufacturerData.name|| ''} 
                    onValueChange={(value) => handleSupplierSelect(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Manufacturer"  />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSuppliers.map(supplier => (
                        <SelectItem key={supplier.name} value={supplier.name}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2">{manufacturerData?.address}</div>
                </div>
                <div className="mt-2">
                  <div className="flex">
                    <span className="font-medium w-16">GST:</span>
                    <span>{manufacturerData?.gstin_number}</span>
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
                <Select value={officeDesignation1} onValueChange={(value) => {
                  setOfficeDesignation1(value);
                  saveFieldToLocalStorage('officer_designation1', value);
                }}>
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
                <Select value={officeDesignation2} onValueChange={(value) => {
                  setOfficeDesignation2(value);
                  saveFieldToLocalStorage('officer_designation2', value);
                }}>
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
                    onChange={(e) => {
                      setLocationCode(e.target.value);
                      saveFieldToLocalStorage('location_code', e.target.value);
                    }}
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
                <div className="border-t pt-2">{`${invoiceHeader?.invoiceNo }/2024-25 Dt. ${invoiceDate}`}</div>
                <div className="border-t pt-2 mt-2">{totalPackages}</div>
                <div className="border-t pt-2 mt-2">
                  <div>{buyer?.consignee }</div>
                  <div>{shipping?.final_destination }</div>
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
                <Select value={question9a} onValueChange={(value) => {
                  setQuestion9a(value);
                  saveFieldToLocalStorage('question9a', value);
                }}>
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
                <Select value={question9b} onValueChange={(value) => {
                  setQuestion9b(value);
                  saveFieldToLocalStorage('question9b', value);
                }}>
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
                  onChange={(e) => {
                    setSampleSealNo(e.target.value);
                    saveFieldToLocalStorage('sample_seal_no', e.target.value);
                  }}
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
                <Select value={sealType1} onValueChange={(value) => {
                  setSealType1(value);
                  saveFieldToLocalStorage('seal_type1', value);
                }}>
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
                <Select value={sealType2} onValueChange={(value) => {
                  setSealType2(value);
                  saveFieldToLocalStorage('seal_type2', value);
                }}>
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
                    <th className="border p-3 text-center font-medium text-gray-600">Sr. No.</th>
                    <th className="border p-3 text-center font-medium text-gray-600">CONTAINER NO.</th>
                    <th className="border p-3 text-center font-medium text-gray-600">LINE SEAL NO.</th>
                    <th className="border p-3 text-center font-medium text-gray-600">RFID SEAL</th>
                    <th className="border p-3 text-center font-medium text-gray-600">Design no</th>
                    <th className="border p-3 text-center font-medium text-gray-600">NO OF<br/>PACKAGES</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.packagingList?.containerRows ? (
                    formData.packagingList.containerRows.map((row, index) => {
                      // Get the package type from the packaging list data
                      const packageType = 'BOX';
                      
                      return (
                        <tr key={row.id || index} className="border-b">
                          <td className="border p-3 text-center">{index + 1}</td>
                          <td className="border p-3 text-center">{row.containerNo || ''}</td>
                          <td className="border p-3 text-center">{row.lineSealNo || ''}</td>
                          <td className="border p-3 text-center">{row.rfidSeal || ''}</td>
                          <td className="border p-3 text-center">TILES</td>
                          <td className="border p-3 text-center">{row.quantity || 0} {packageType}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="border-b">
                      <td className="border p-3 text-center">1</td>
                      <td className="border p-3 text-center">Sp***********</td>
                      <td className="border p-3 text-center">R ********</td>
                      <td className="border p-3 text-center">SPPL **** ****</td>
                      <td className="border p-3 text-center">TILES</td>
                      <td className="border p-3 text-center">1000 Box</td>
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
              <div className="text-center text-red-500  p-2 border rounded">
              {manufacturerData?.permission }
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
                <div>LETTER OF UNDERTAKING NO.ACKNOWLEDGMENT FOR LUT APPLICATION REFERENCE NUMBER (ARN) {arn}</div>
                <div className="flex items-center mt-2">
                  <Label className="w-10">DT:</Label>
                  <Input 
                    value={lutDate}
                    onChange={(e) => {
                      setLutDate(e.target.value);
                      saveFieldToLocalStorage('lut_date', e.target.value);
                    }}
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
              <div className="text-center font-bold underline p-2 border rounded">
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
        <Button variant="default" onClick={handleSubmit}>Next</Button>
      </div>
    </div>
  );
};

export default Annexure; 
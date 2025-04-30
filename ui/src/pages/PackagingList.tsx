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
import { Plus, Trash } from 'lucide-react';
import { Product, InvoiceItem, ProductSection } from '@/lib/types';
import { format } from 'date-fns';
import MarksAndNumbers from '@/components/MarksAndNumbers';
import { useForm } from '@/context/FormContext';

// Update the props interface to receive data from InvoiceGenerator
interface PackagingListProps {
  onBack: () => void;
  importedSections?: ProductSection[];
  markNumber?: string;
  readOnly?: boolean;
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
}

const PackagingList = ({ 
  onBack, 
  importedSections, 
  markNumber, 
  readOnly = false,
  invoiceHeader,
  buyerInfo,
  shippingInfo
}: PackagingListProps) => {
  const {formData, setInvoiceData,setPackagingListData} = useForm();
  let exporter = formData.invoice.exporter;
  let buyer = formData.invoice.buyer;
  let shipping = formData.invoice.shipping;
  console.log(buyer);
  console.log(shipping);
  // HSN codes mapping to section titles  
  const [hsnCodes] = useState<{ [key: string]: string }>({
    "Glazed porcelain Floor Tiles": "69072100",
    "Glazed Ceramic Wall tiles": "69072300",
    "Polished Vitrified Tiles": "69072200",
    "Digital Floor Tiles": "69072100"
  });

  // Size options
  const [sizes] = useState<string[]>([
    "600X1200", "600X600", "300X600"
  ]);

  // Parse imported mark number or use default
  const [markParts, setMarkParts] = useState<string[]>(['10', '20', 'FCLLCL']);
  
  useEffect(() => {
    if (markNumber) {
      // Try to parse the mark number format (e.g., "10X20FCLLCL")
      const match = markNumber.match(/^(\d+)X(\d*)([A-Za-z]+)$/);
      if (match) {
        setMarkParts([match[1], match[2], match[3]]);
      }
    }
  }, [markNumber]);

  // Section options
  const [sectionOptions] = useState<string[]>([
    "Glazed porcelain Floor Tiles",
    "Glazed Ceramic Wall tiles",
    "Polished Vitrified Tiles",
    "Digital Floor Tiles"
  ]);

  // Initialize state with imported sections or defaults
  const [sections, setSections] = useState<ProductSection[]>([
    {
      id: '1',
      title: 'Glazed porcelain Floor Tiles',
      items: []
    },
    {
      id: '2',
      title: 'Glazed Ceramic Wall tiles',
      items: []
    }
  ]);

  // Use effect to update sections when importedSections changes
  useEffect(() => {
    if (importedSections && importedSections.length > 0) {
      // Process imported sections to ensure they have the required properties
      const processedSections = importedSections.map(section => {
        // Get the HSN code for the section title
        const sectionHsnCode = hsnCodes[section.title] || "69072100";

        // Process items to ensure they have net weight and gross weight and correct HSN codes
        const processedItems = section.items.map(item => {
          return {
            ...item,
            product: {
              ...item.product,
              // Keep the original HSN code if it exists, otherwise use the section's HSN code
              hsnCode: item.product.hsnCode || sectionHsnCode,
              netWeight: item.product.netWeight || calculateNetWeight(item),
              grossWeight: item.product.grossWeight || calculateGrossWeight(item)
            }
          };
        });

        return {
          ...section,
          items: processedItems
        };
      });

      setSections(processedSections);
    }
  }, [importedSections, hsnCodes]);

  // Helper functions to calculate weights if they are not provided
  const calculateNetWeight = (item: InvoiceItem): string => {
    // Simplified logic - in real app, you'd have a more sophisticated calculation
    const isWallTile = item.product.hsnCode === '69072300';
    return isWallTile ? '13950.00' : '27100.00';
  };

  const calculateGrossWeight = (item: InvoiceItem): string => {
    // Simplified logic
    const isWallTile = item.product.hsnCode === '69072300';
    return isWallTile ? '14200.00' : '27500.00';
  };

  // Update section title and auto-fill HSN codes for all items in that section
  const handleSectionTitleChange = (sectionId: string, title: string) => {
    if (readOnly) return; // Prevent updating if read-only

    // Get the HSN code for the selected title
    const hsnCode = hsnCodes[title] || "";
    
    setSections(currentSections => {
      const updatedSections = currentSections.map(section => {
        if (section.id === sectionId) {
          // Update all items in the section with the new HSN code
          const updatedItems = section.items.map(item => ({
            ...item,
            product: {
              ...item.product,
              hsnCode
            }
          }));
          
          return { 
            ...section, 
            title,
            items: updatedItems 
          };
        }
        return section;
      });
      
      return updatedSections;
    });
  };

  // Add a new section
  const addNewSection = () => {
    if (readOnly) return; // Prevent adding if read-only

    const newSectionId = Date.now().toString();
    setSections([
      ...sections,
      {
        id: newSectionId,
        title: sectionOptions[0],
        items: []
      }
    ]);
  };

  // Add a new row to a section with the correct HSN code based on section title
  const addNewRow = (sectionId: string) => {
    if (readOnly) return; // Prevent adding if read-only

    setSections(currentSections => {
      return currentSections.map(section => {
        if (section.id === sectionId) {
          const isWallTile = section.title.includes("Wall");
          // Get the HSN code based on the section title
          const hsnCode = hsnCodes[section.title] || (isWallTile ? '69072300' : '69072100');
          
          const newItem: InvoiceItem = {
            id: Date.now().toString(),
            product: {
              id: Date.now().toString(),
              description: isWallTile ? '1621' : 'LUCKY PANDA',
              hsnCode: hsnCode,
              size: isWallTile ? '300X600' : '600X1200',
              price: 0,
              sqmPerBox: 0,
              marksAndNos: `${markParts[0]}X${markParts[1]}${markParts[2]}`,
              netWeight: isWallTile ? '13950.00' : '27100.00',
              grossWeight: isWallTile ? '14200.00' : '27500.00'
            },
            quantity: 1000,
            unitType: 'BOX',
            totalSQM: 0,
            totalFOB: 0
          };
          
          return {
            ...section,
            items: [...section.items, newItem]
          };
        }
        return section;
      });
    });
  };

  // Remove a row from a section
  const removeRow = (sectionId: string, itemId: string) => {
    if (readOnly) return; // Prevent removing if read-only

    setSections(currentSections => {
      const updatedSections = currentSections.map(section => {
        if (section.id === sectionId) {
          const updatedItems = section.items.filter(item => item.id !== itemId);
          return { ...section, items: updatedItems };
        }
        return section;
      });
      return updatedSections;
    });
  };

  // Update product description
  const handleDescriptionChange = (sectionId: string, itemId: string, description: string) => {
    if (readOnly) return; // Prevent updating if read-only

    setSections(currentSections =>
      currentSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        description
                      }
                    }
                  : item
              )
            }
          : section
      )
    );
  };

  // Update HSN code
  const handleHSNChange = (sectionId: string, itemId: string, hsnCode: string) => {
    if (readOnly) return; // Prevent updating if read-only

    setSections(currentSections =>
      currentSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        hsnCode
                      }
                    }
                  : item
              )
            }
          : section
      )
    );
  };

  // Update size
  const handleSizeChange = (sectionId: string, itemId: string, size: string) => {
    if (readOnly) return; // Prevent updating if read-only

    setSections(currentSections =>
      currentSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        size
                      }
                    }
                  : item
              )
            }
          : section
      )
    );
  };

  // Update quantity
  const handleQuantityChange = (sectionId: string, itemId: string, quantity: number) => {
    if (readOnly) return; // Prevent updating if read-only

    setSections(currentSections =>
      currentSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      quantity
                    }
                  : item
              )
            }
          : section
      )
    );
  };

  // Update net weight - Always allowed regardless of readOnly
  const handleNetWeightChange = (sectionId: string, itemId: string, weight: string) => {
    // Do not check readOnly for this field
    
    setSections(currentSections =>
      currentSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        netWeight: weight
                      }
                    }
                  : item
              )
            }
          : section
      )
    );
  };

  // Update gross weight - Always allowed regardless of readOnly
  const handleGrossWeightChange = (sectionId: string, itemId: string, weight: string) => {
    // Do not check readOnly for this field
    
    setSections(currentSections =>
      currentSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        grossWeight: weight
                      }
                    }
                  : item
              )
            }
          : section
      )
    );
  };

  // Container information state
  interface ContainerInfo {
    id: string;
    containerNo: string;
    lineSealNo: string;
    rfidSeal: string;
    designNo: string;
    quantity: number;
    netWeight: string;
    grossWeight: string;
  }

  // Add state for the total pallet number instead of the full text
  const [totalPalletCount, setTotalPalletCount] = useState<string>("000");

  const [containerRows, setContainerRows] = useState<ContainerInfo[]>([
    {
      id: '1',
      containerNo: 'Sp***********',
      lineSealNo: 'R ********',
      rfidSeal: 'SPPL **** ****',
      designNo: 'TILES',
      quantity: 1000,
      netWeight: '27300.00',
      grossWeight: '28430.00'
    }
  ]);

  // Add new container row
  const addContainerRow = () => {
    let newRow: ContainerInfo;
    
    // If there are existing rows, copy values from the last row
    if (containerRows.length > 0) {
      const lastRow = containerRows[containerRows.length - 1];
      newRow = {
        id: Date.now().toString(),
        containerNo: lastRow.containerNo,
        lineSealNo: lastRow.lineSealNo,
        rfidSeal: lastRow.rfidSeal,
        designNo: lastRow.designNo,
        quantity: lastRow.quantity,
        netWeight: lastRow.netWeight,
        grossWeight: lastRow.grossWeight
      };
    } else {
      // Default values for first row
      newRow = {
        id: Date.now().toString(),
        containerNo: 'SE***********',
        lineSealNo: 'R ********',
        rfidSeal: 'SPPL **** ****',
        designNo: 'TILES',
        quantity: 1000,
        netWeight: '27300.00',
        grossWeight: '28430.00'
      };
    }
    
    setContainerRows([...containerRows, newRow]);
  };

  // Remove container row
  const removeContainerRow = (id: string) => {
    
    setContainerRows(containerRows.filter(row => row.id !== id));
  };

  // Update container row field
  const updateContainerField = (id: string, field: keyof ContainerInfo, value: string | number) => {
    // Remove readOnly check to make all fields always editable
    
    setContainerRows(containerRows.map(row => {
      if (row.id === id) {
        return {
          ...row,
          [field]: value
        };
      }
      return row;
    }));
  };

  // Update to handle container type
  const [containerType, setContainerType] = useState<string>('FCL');

  // Extract container type from markNumber
  useEffect(() => {
    if (markNumber) {
      if (markNumber.includes('LCL')) {
        setContainerType('LCL');
      } else if (markNumber.includes('FCL')) {
        setContainerType('FCL');
      }
    }
  }, [markNumber]);

  // Add a handler for when the marks and numbers change
  const handleMarksAndNumbersChange = (value: string) => {
    if (value === 'LCL') {
      setContainerType('LCL');
      setMarkParts(['', '', 'LCL']);
    } else {
      // Parse the value in the format "10X20 FCL"
      const parts = value.match(/^(\d+)X(\d+)\s+(\w+)$/);
      if (parts) {
        setContainerType(parts[3]);
        setMarkParts([parts[1], parts[2], parts[3]]);
      }
    }
  };
  
  
  
  return (
    <div className="space-y-6">
      {/* Add the Customs Invoice Header */}
      <div className="bg-white p-6 shadow-sm border rounded-lg">
        <h1 className="text-3xl font-bold text-center mb-2">PACKAGING LIST</h1>
      </div>
      
      {/* Invoice Header Section */}
      {formData && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Exporter</Label>
                  <Input value={exporter.company_name} readOnly className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>Company Address</Label>
                  <textarea 
                    className="w-full p-2 rounded-md border bg-gray-50" 
                    value={exporter.company_address} 
                    readOnly 
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={exporter.email} readOnly className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>Tax ID</Label>
                  <Input value={exporter.tax_id} readOnly className="bg-gray-50" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input value={formData.invoice.invoice_number} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Date</Label>
                    <Input 
                      value={formData.invoice.invoice_date ? format(new Date(formData.invoice.invoice_date), 'PP') : ''} 
                      readOnly 
                      className="bg-gray-50" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Exporter's Ref.</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>I.E. Code #</Label>
                    <Input value={exporter.ie_code} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN No. #</Label>
                    <Input value={exporter.pan_number} readOnly className="bg-gray-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GSTIN No. #</Label>
                    <Input value={exporter.gstin_number} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>State Code</Label>
                    <Input value={exporter.state_code} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buyer Information */}
      {buyer && (
        <Card>
          <CardHeader>
            <CardTitle>Buyer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Buyer's Order No. & Date</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Order No.</Label>
                    <Input value={buyer.buyer_order_no} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Order Date</Label>
                    <Input 
                      value={buyer.buyer_order_date ? format(new Date(buyer.buyer_order_date), 'PP') : ''} 
                      readOnly 
                      className="bg-gray-50" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>PO No.</Label>
                  <Input value={buyer.po_no} readOnly className="bg-gray-50" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <Label>Consignee</Label>
                    <Input value={buyer.consignee} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notify Party</Label>
                    <Input value={buyer.notify_party} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Information */}
      {shipping && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Pre-Carriage By</Label>
                <Input value={shippingInfo.preCarriageBy} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Place of Receipt</Label>
                <Input value={shippingInfo.placeOfReceipt} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Origin Details</Label>
                <Input value={shippingInfo.originDetails} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Vessel/Flight No.</Label>
                <Input value={shippingInfo.vesselFlightNo} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Port of Loading</Label>
                <Input value={shippingInfo.portOfLoading} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Port of Discharge</Label>
                <Input value={shippingInfo.portOfDischarge} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Final Destination</Label>
                <Input value={shippingInfo.finalDestination} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Country of Final Destination</Label>
                <Input value={shippingInfo.countryOfFinalDestination} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Country of Origin</Label>
                <Input value={shippingInfo.countryOfOrigin} readOnly className="bg-gray-50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Terms of Delivery</Label>
                <Input value={shippingInfo.termsOfDelivery} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input value={shippingInfo.paymentTerms} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Shipping Method</Label>
                <Input value={shippingInfo.shippingMethod} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={shippingInfo.selectedCurrency} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Currency Rate</Label>
                <Input value={shippingInfo.currencyRate} readOnly className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product Information</CardTitle>
          {!readOnly && (
            <Button 
              variant="outline" 
              onClick={addNewSection}
              className="border-2 rounded-xl px-6 py-5 font-semibold flex gap-2 items-center"
            >
              <Plus className="h-5 w-5" /> Add Section
            </Button>
          )}
      </CardHeader>
      <CardContent>
          <div className="space-y-6">
            {/* Mark Number Display */}
            <div className="border p-4">
              {readOnly ? (
                <div className="flex justify-between items-center mb-2">
                  <Label className="font-bold text-base">Marks & Nos.</Label>
                  <div className="font-bold">
                    {containerType === 'LCL' ? 'LCL' : `${markParts[0]}X${markParts[1]} ${markParts[2]}`}
                  </div>
                </div>
              ) : (
                <MarksAndNumbers 
                  initialContainerType={containerType}
                  initialLeftValue={markParts[0]}
                  initialRightValue={markParts[1]}
                  onChange={handleMarksAndNumbersChange}
                />
              )}
            </div>

            {/* Product Sections */}
            {sections.map((section, sectionIndex) => (
              <div key={section.id} className="space-y-4 border">
                <Table className="border">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="border font-bold text-center w-16">SR NO</TableHead>
                      <TableHead className="border font-bold text-center">HSN CODE</TableHead>
                      <TableHead className="border font-bold text-center">Description of Goods</TableHead>
                      <TableHead className="border font-bold text-center w-32">Size</TableHead>
                      <TableHead className="w-[140px] border font-bold text-center">QUANTITY BOX</TableHead>
                      <TableHead className="w-[140px] border font-bold text-center">NET.WT. IN KGS.</TableHead>
                      <TableHead className="w-[140px] border font-bold text-center">GRS.WT. IN KGS.</TableHead>
                      {!readOnly && (
                        <TableHead className="w-[60px] border font-bold text-center">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Section Title Row */}
                    {sectionIndex === 0 && (
                      <TableRow className="bg-gray-100">
                        <TableCell colSpan={4} className="border font-bold text-center">
                          {readOnly ? (
                            <div>{section.title}</div>
                          ) : (
                            <Select 
                              value={section.title} 
                              onValueChange={(value) => handleSectionTitleChange(section.id, value)}
                              disabled={readOnly}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {sectionOptions.map(option => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell colSpan={readOnly ? 3 : 4} className="border"></TableCell>
                      </TableRow>
                    )}
                    
                    {/* Zero row for second section - Make title selectable */}
                    {sectionIndex === 1 && (
                      <TableRow className="bg-gray-100">
                        <TableCell className="border text-center font-bold">0</TableCell>
                        <TableCell className="border text-center font-bold">0</TableCell>
                        <TableCell colSpan={readOnly ? 5 : 6} className="border font-bold text-center">
                          {readOnly ? (
                            <div>{section.title}</div>
                          ) : (
                            <Select 
                              value={section.title} 
                              onValueChange={(value) => handleSectionTitleChange(section.id, value)}
                              disabled={readOnly}
                            >
                              <SelectTrigger className="border-0 bg-transparent font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {sectionOptions.map(option => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {section.items.map((item, itemIndex) => {
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="border text-center p-0">
                            <div className="p-2">
                              {sectionIndex === 0 ? itemIndex + 1 : itemIndex + sections[0].items.length + 1}
                            </div>
                          </TableCell>
                          <TableCell className="border p-0">
                            {readOnly ? (
                              <div className="p-2 text-center">{item.product.hsnCode}</div>
                            ) : (
                              <Input
                                value={item.product.hsnCode}
                                onChange={(e) => handleHSNChange(section.id, item.id, e.target.value)}
                                className="h-9 border-0"
                                readOnly={readOnly}
                              />
                            )}
                          </TableCell>
                          <TableCell className="border p-0">
                            {readOnly ? (
                              <div className="p-2">{item.product.description}</div>
                            ) : (
                              <Input
                                value={item.product.description}
                                onChange={(e) => handleDescriptionChange(section.id, item.id, e.target.value)}
                                className="h-9 border-0"
                                readOnly={readOnly}
                              />
                            )}
                          </TableCell>
                          <TableCell className="border p-0">
                            {readOnly ? (
                              <div className="p-2 text-center">{item.product.size}</div>
                            ) : (
                              <Select 
                                value={item.product.size}
                                onValueChange={(value) => handleSizeChange(section.id, item.id, value)}
                                disabled={readOnly}
                              >
                                <SelectTrigger className="h-9 border-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {sizes.map(size => (
                                    <SelectItem key={size} value={size}>{size}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="border p-0">
                            {readOnly ? (
                              <div className="p-2 text-center">{item.quantity}</div>
                            ) : (
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(section.id, item.id, parseInt(e.target.value) || 0)}
                                className="h-9 border-0 text-center"
                                readOnly={readOnly}
                              />
                            )}
                          </TableCell>
                          <TableCell className="border p-0">
                            {/* NET.WT. IN KGS. column - Always editable */}
                            <Input
                              value={item.product.netWeight || ""}
                              onChange={(e) => handleNetWeightChange(section.id, item.id, e.target.value)}
                              className="h-9 border-0 text-center bg-white w-full hover:bg-gray-50 focus:bg-white"
                              placeholder="Enter net weight"
                              title="This field is always editable"
                              readOnly={false} // Force editable regardless of form state
                            />
                          </TableCell>
                          <TableCell className="border p-0">
                            {/* GRS.WT. IN KGS. column - Always editable */}
                            <Input
                              value={item.product.grossWeight || ""}
                              onChange={(e) => handleGrossWeightChange(section.id, item.id, e.target.value)}
                              className="h-9 border-0 text-center bg-white w-full hover:bg-gray-50 focus:bg-white"
                              placeholder="Enter gross weight"
                              title="This field is always editable"
                              readOnly={false} // Force editable regardless of form state
                            />
                          </TableCell>
                          {!readOnly && (
                            <TableCell className="border p-0 text-center">
                              <Button
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeRow(section.id, item.id)}
                                disabled={readOnly}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                    
                    {section.items.length === 0 && sectionIndex !== 1 && (
                      <TableRow>
                        <TableCell colSpan={readOnly ? 7 : 8} className="text-center py-4 border">
                          No items added. {!readOnly && "Click \"Add Row\" to add a new row."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {!readOnly && (
                  <div className="flex justify-end p-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addNewRow(section.id)}
                      className="flex items-center"
                      disabled={readOnly}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Row
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {/* Container Information Table */}
            <div className="space-y-4 border">
              <div className="flex justify-between items-center p-3">
                <h3 className="font-bold text-lg">Container Information</h3>
              </div>
              
              <Table className="border w-full">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="border font-bold text-center w-[15%]">CONTAINER NO.</TableHead>
                    <TableHead className="border font-bold text-center w-[12%]">LINE SEAL NO.</TableHead>
                    <TableHead className="border font-bold text-center w-[12%]">RFID SEAL</TableHead>
                    <TableHead className="border font-bold text-center w-[12%]">Design no</TableHead>
                    <TableHead className="border font-bold text-center w-[10%]">QUANTITY BOX</TableHead>
                    <TableHead className="border font-bold text-center w-[15%]">NET.WT. IN KGS.</TableHead>
                    <TableHead className="border font-bold text-center w-[15%]">GRS.WT. IN KGS.</TableHead>
                    <TableHead className="w-[60px] border font-bold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containerRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="border p-0">
                        <Input
                          value={row.containerNo}
                          onChange={(e) => updateContainerField(row.id, 'containerNo', e.target.value)}
                          className="h-10 border-0 text-center bg-white w-full"
                          placeholder="Enter container no."
                        />
                      </TableCell>
                      <TableCell className="border p-0">
                        <Input
                          value={row.lineSealNo}
                          onChange={(e) => updateContainerField(row.id, 'lineSealNo', e.target.value)}
                          className="h-10 border-0 text-center bg-white w-full"
                          placeholder="Enter line seal no."
                        />
                      </TableCell>
                      <TableCell className="border p-0">
                        <Input
                          value={row.rfidSeal}
                          onChange={(e) => updateContainerField(row.id, 'rfidSeal', e.target.value)}
                          className="h-10 border-0 text-center bg-white w-full"
                          placeholder="Enter RFID seal"
                        />
                      </TableCell>
                      <TableCell className="border p-0">
                        <Input
                          value={row.designNo}
                          onChange={(e) => updateContainerField(row.id, 'designNo', e.target.value)}
                          className="h-10 border-0 text-center bg-white w-full"
                          placeholder="Enter design no."
                        />
                      </TableCell>
                      <TableCell className="border p-0">
                        <Input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => updateContainerField(row.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="h-10 border-0 text-center bg-white w-full"
                          placeholder="Enter quantity"
                        />
                      </TableCell>
                      <TableCell className="border p-0">
                        <Input
                          value={row.netWeight}
                          onChange={(e) => updateContainerField(row.id, 'netWeight', e.target.value)}
                          className="h-10 border-0 text-center bg-white w-full"
                          placeholder="Enter net weight"
                        />
                      </TableCell>
                      <TableCell className="border p-0">
                        <Input
                          value={row.grossWeight}
                          onChange={(e) => updateContainerField(row.id, 'grossWeight', e.target.value)}
                          className="h-10 border-0 text-center bg-white w-full"
                          placeholder="Enter gross weight"
                        />
                      </TableCell>
                      <TableCell className="border p-0 text-center">
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeContainerRow(row.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Summary Row */}
                  <TableRow>
                    <TableCell className="text-[16px] text-center font-bold">
                      Nos. of Kind Packages
                    </TableCell>
                    <TableCell className="text-[16px] text-center font-bold">
                      Total &nbsp;&nbsp;&nbsp; &gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;
                    </TableCell>
                    <TableCell colSpan={2} className="border p-4 text-center bg-gray-50 text-lg">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-[16px] text-center font-bold">TOTAL PALLET -</span>
                        <Input
                          value={totalPalletCount}
                          onChange={(e) => setTotalPalletCount(e.target.value)}
                          className="h-8 border-0 text-center bg-gray-50 font-bold w-14 p-0 mx-1"
                        />
                        <span className="text-[16px] text-center font-bold">NOS</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[16px] text-center font-bold">
                      {containerRows.reduce((sum, row) => sum + row.quantity, 0)}
                    </TableCell>
                    <TableCell className="text-[16px] text-center font-bold">
                      {containerRows.reduce((sum, row) => sum + parseFloat(row.netWeight || "0"), 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-[16px] text-center font-bold">
                      {containerRows.reduce((sum, row) => sum + parseFloat(row.grossWeight || "0"), 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="border bg-gray-50"></TableCell>
                  </TableRow>
                  
                  {/* Unit Row */}
                  <TableRow>
                    <TableCell colSpan={4} className="border bg-gray-100"></TableCell>
                    <TableCell className="border p-2 text-center font-medium bg-gray-100">
                      BOX
                    </TableCell>
                    <TableCell className="border p-2 text-center font-medium bg-gray-100">
                      KGS
                    </TableCell>
                    <TableCell className="border p-2 text-center font-medium bg-gray-100">
                      KGS
                    </TableCell>
                    <TableCell className="border bg-gray-100"></TableCell>
                  </TableRow>
                  
                  {/* Add Row Button Row */}
                  <TableRow>
                    <TableCell colSpan={8} className="border p-0">
                      <Button 
                        variant="ghost"
                        onClick={addContainerRow}
                        className="w-full h-12 flex items-center justify-center gap-2 hover:bg-gray-50"
                      >
                        <Plus className="h-5 w-5" /> 
                        <span>Add Row</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
          </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={onBack}>Back</Button>
            <Button variant="default" onClick={() => {
              // Store container data and other necessary data in localStorage
              const annexureData = {
                containerRows,
                totalPalletCount,
                sections,
                markNumber,
                invoiceHeader,
                buyerInfo,
                shippingInfo
              };
              localStorage.setItem('annexureData', JSON.stringify(annexureData));
              
              // Navigate to the annexure page
              window.location.href = '/annexure';
            }}>Next</Button>
          </div>
      </CardContent>
      </Card>
      </div>
  );
};

export default PackagingList;
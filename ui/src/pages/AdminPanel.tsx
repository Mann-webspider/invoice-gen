import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { 
  getDropdownOptions, 
  addDropdownOption, 
  updateDropdownOption, 
  deleteDropdownOption 
} from "@/lib/dataService";
import { DropdownCategory, DropdownOption } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

// Define sections based on the images provided
const sections = [
  {
    id: "exporter",
    name: "Exporter Section",
    categories: [
      "exporter",
      "ieCode",
      "panNo",
      "gstinNo",
      "stateCode",
      "buyersOrderNoFormat",
      "poNo",
      "email",
      "taxId"
    ]
  },
  {
    id: "shipping",
    name: "Shipping Details",
    categories: [
      "preCarriageBy",
      "placeOfReceipt",
      "countryOfOrigin",
      "countryOfFinalDestination",
      "vesselFlightNo",
      "portOfLoading",
      "portOfDischarge",
      "finalDestination",
      "termsOfDelivery",
      "shippingMethod",
      "euroRate"
    ]
  },
  {
    id: "table",
    name: "Table Information",
    categories: [
      "marksAndNos",
      "size",
      "sanitaryTilesMix",
      "unit",
      "hsnCode"
    ]
  },
  {
    id: "supplier",
    name: "Supplier Details",
    categories: [
      "supplierName",
      "supplierGstin",
      "taxInvoiceFormat"
    ]
  },
  {
    id: "arn",
    name: "ARN & Declaration",
    categories: [
      "exportUnderGstCircular",
      "applicationReferenceNumber"
    ]
  }
];

const AdminPanel = () => {
  const { toast } = useToast();
  const [dropdownOptions, setDropdownOptions] = useState(getDropdownOptions());
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [editOption, setEditOption] = useState<DropdownOption | null>(null);
  const [editOptionValue, setEditOptionValue] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newFieldValue, setNewFieldValue] = useState("");

  // Get categories for the active section
  const activeSectionData = sections.find(section => section.id === activeSection);
  const categoriesInSection = activeSectionData?.categories || [];
  
  // Filter dropdown categories to only show those in the active section
  const filteredCategories = dropdownOptions.categories.filter(
    category => categoriesInSection.includes(category.id)
  );

  // Set the first category of the section as selected by default when section changes
  React.useEffect(() => {
    if (filteredCategories.length > 0 && (!selectedCategory || !categoriesInSection.includes(selectedCategory))) {
      setSelectedCategory(filteredCategories[0].id);
    }
  }, [activeSection, filteredCategories]);

  const selectedCategoryData = dropdownOptions.categories.find(
    (category) => category.id === selectedCategory
  );

  const handleAddOption = () => {
    if (!newOptionValue.trim()) {
      toast({
        title: "Error",
        description: "Option value cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const updatedOptions = addDropdownOption(selectedCategory, {
      id: "",
      value: newOptionValue.trim(),
    });

    setDropdownOptions(updatedOptions);
    setNewOptionValue("");
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Option added successfully",
    });
  };

  const handleEditOption = () => {
    if (!editOption || !editOptionValue.trim()) {
      toast({
        title: "Error",
        description: "Option value cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const updatedOptions = updateDropdownOption(
      selectedCategory,
      editOption.id,
      { value: editOptionValue.trim() }
    );

    setDropdownOptions(updatedOptions);
    setEditOption(null);
    setEditOptionValue("");
    setIsEditDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Option updated successfully",
    });
  };

  const handleDeleteOption = (optionId: string) => {
    if (confirm("Are you sure you want to delete this option?")) {
      const updatedOptions = deleteDropdownOption(selectedCategory, optionId);
      setDropdownOptions(updatedOptions);
      
      toast({
        title: "Success",
        description: "Option deleted successfully",
      });
    }
  };

  const openEditDialog = (option: DropdownOption) => {
    setEditOption(option);
    setEditOptionValue(option.value);
    setIsEditDialogOpen(true);
  };

  const startEditing = (categoryId: string) => {
    setEditingField(categoryId);
    const category = dropdownOptions.categories.find(c => c.id === categoryId);
    if (category && category.options.length > 0) {
      setNewFieldValue(category.options[0].value);
    } else {
      setNewFieldValue("");
    }
  };

  const handleSaveField = (categoryId: string) => {
    if (!newFieldValue.trim()) {
      toast({
        title: "Error",
        description: "Field value cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Check if option already exists
    const category = dropdownOptions.categories.find(c => c.id === categoryId);
    if (category) {
      if (category.options.length > 0) {
        // Update existing option
        updateDropdownOption(categoryId, category.options[0].id, { value: newFieldValue.trim() });
      } else {
        // Add new option
        addDropdownOption(categoryId, { id: "", value: newFieldValue.trim() });
      }
    }

    // Refresh dropdown options
    setDropdownOptions(getDropdownOptions());
    setEditingField(null);
    
    toast({
      title: "Success",
      description: "Field value saved successfully",
    });
  };

  // Render the Exporter section with a form layout similar to the invoice form
  const renderExporterSection = () => {
    // Helper function to get the first option value for a category
    const getCategoryValue = (categoryId: string) => {
      const category = dropdownOptions.categories.find(c => c.id === categoryId);
      if (category && category.options.length > 0) {
        return category.options[0].value;
      }
      return "";
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4 border rounded-md p-4 bg-white">
            <div className="bg-blue-100 p-3 -m-4 mb-4 border-b">
              <h3 className="font-bold uppercase text-sm">EXPORTER</h3>
            </div>
            
            <div>
              <Label htmlFor="exporter-select">Select exporter</Label>
              <Select>
                <SelectTrigger id="exporter-select" className="mt-1">
                  <SelectValue placeholder="Select exporter" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions.categories.find(c => c.id === "exporter")?.options.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="company-address" className="uppercase text-xs font-bold">Company Address</Label>
              <Textarea 
                id="company-address" 
                className="mt-1 h-24" 
                placeholder="Enter company address"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="uppercase text-xs font-bold">Email</Label>
              <Input 
                id="email" 
                placeholder="e.g., yourmail@gmail.com" 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="tax-id" className="uppercase text-xs font-bold">Tax ID</Label>
              <Input 
                id="tax-id" 
                placeholder="e.g., 24AACF********" 
                className="mt-1"
              />
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-4 border rounded-md p-4 bg-white">
            <div className="bg-blue-100 p-3 -m-4 mb-4 border-b">
              <h3 className="font-bold uppercase text-sm">EXPORTER DETAILS</h3>
            </div>
            
            <div>
              <Label htmlFor="exporter-ref" className="uppercase text-xs font-bold">Exporter's Ref.</Label>
              <Input 
                id="exporter-ref" 
                placeholder="Enter exporter reference" 
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ie-code" className="uppercase text-xs font-bold">I.E. Code #</Label>
                <Input 
                  id="ie-code" 
                  placeholder="1234567890" 
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="pan-no" className="uppercase text-xs font-bold">PAN NO. #</Label>
                <Input 
                  id="pan-no" 
                  placeholder="Enter PAN number" 
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gstin-no" className="uppercase text-xs font-bold">GSTIN NO. #</Label>
                <Input 
                  id="gstin-no" 
                  placeholder="Enter GSTIN number" 
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="state-code" className="uppercase text-xs font-bold">STATE CODE</Label>
                <Input 
                  id="state-code" 
                  placeholder="24" 
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyers-order-no" className="uppercase text-xs font-bold">Buyer's Order No.</Label>
                <Input 
                  id="buyers-order-no" 
                  placeholder="Exp/****/2024-25" 
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="po-no" className="uppercase text-xs font-bold">PO NO.</Label>
                <Input 
                  id="po-no" 
                  placeholder="ABC123" 
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the Shipping section with a form layout similar to the invoice form
  const renderShippingSection = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4 border rounded-md p-4 bg-white">
            <div className="bg-orange-100 p-3 -m-4 mb-4 border-b">
              <h3 className="font-bold uppercase text-sm">Shipping Details</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pre-carriage" className="uppercase text-xs font-bold">Pre-Carriage By</Label>
                <Input 
                  id="pre-carriage" 
                  placeholder="Pre-Carriage" 
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="place-receipt" className="uppercase text-xs font-bold">Place of Receipt</Label>
                <Input 
                  id="place-receipt" 
                  placeholder="MORBI" 
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vessel-flight" className="uppercase text-xs font-bold">Vessel Flight No.</Label>
                <Input 
                  id="vessel-flight" 
                  placeholder="Vessel Flight No." 
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="port-loading" className="uppercase text-xs font-bold">Port of Loading</Label>
                <Input 
                  id="port-loading" 
                  placeholder="MUNDRA" 
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="port-discharge" className="uppercase text-xs font-bold">Port of Discharge</Label>
                <Input 
                  id="port-discharge" 
                  placeholder="NEW YORK" 
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="final-destination" className="uppercase text-xs font-bold">Final Destination</Label>
                <Input 
                  id="final-destination" 
                  placeholder="USA" 
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-4 border rounded-md p-4 bg-white">
            <div className="bg-orange-100 p-3 -m-4 mb-4 border-b">
              <h3 className="font-bold uppercase text-sm">Additional Details</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country-origin" className="uppercase text-xs font-bold">Country of Origin</Label>
                <Input 
                  id="country-origin" 
                  placeholder="INDIA" 
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="country-destination" className="uppercase text-xs font-bold">Country of Final Destination</Label>
                <Input 
                  id="country-destination" 
                  placeholder="USA" 
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="terms-delivery" className="uppercase text-xs font-bold">Terms of Delivery & Payment</Label>
              <Input 
                id="terms-delivery" 
                placeholder="FOB AT MUNDRA PORT" 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="shipping-method" className="uppercase text-xs font-bold">SHIPPING - THROUGH SEA/AIR</Label>
              <Input 
                id="shipping-method" 
                placeholder="SEA" 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="euro-rate" className="uppercase text-xs font-bold">EURO RATE</Label>
              <Input 
                id="euro-rate" 
                placeholder="88.95" 
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the Table Information section with a form layout similar to the invoice form
  const renderTableSection = () => {
    return (
      <div className="space-y-6">
        <div className="border rounded-md p-4 bg-white">
          <div className="bg-green-100 p-3 -m-4 mb-4 border-b">
            <h3 className="font-bold uppercase text-sm">Table Information</h3>
          </div>
          
          <div className="mb-6">
            <div className="mb-4">
              <Label htmlFor="marks-nos" className="block text-sm font-medium">Marks & Nos.</Label>
              <div className="mt-1 flex space-x-2">
                <Select>
                  <SelectTrigger id="marks-nos-1" className="w-24">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                  </SelectContent>
                </Select>
                <span className="flex items-center">X</span>
                <Select>
                  <SelectTrigger id="marks-nos-2" className="w-24">
                    <SelectValue placeholder="20" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger id="marks-nos-3" className="w-24">
                    <SelectValue placeholder="FCL" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FCL">FCL</SelectItem>
                    <SelectItem value="LCL">LCL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description" className="block text-sm font-medium">Description</Label>
              <Select>
                <SelectTrigger id="description" className="mt-1 w-full">
                  <SelectValue placeholder="Glazed porcelain Floor Tiles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="glazed-porcelain">Glazed porcelain Floor Tiles</SelectItem>
                  <SelectItem value="ceramic">Ceramic Tiles</SelectItem>
                  <SelectItem value="vitrified">Vitrified Tiles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">SR NO</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Type</TableHead>
                  <TableHead>SQM/BOX</TableHead>
                  <TableHead>Total SQM</TableHead>
                  <TableHead>Price (EUR)</TableHead>
                  <TableHead>Total FOB (EUR)</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Input defaultValue="1" className="w-12" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="Glazed porcelain Floor Tiles" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="69072100" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="600 X 1200" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="1000" type="number" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="Box" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="1.44" type="number" step="0.01" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="1440" type="number" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="8.50" type="number" step="0.01" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="12,240.00" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Input defaultValue="2" className="w-12" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="Ceramic Wall Tiles" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="69072200" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="300 X 600" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="2000" type="number" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="Box" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="1.08" type="number" step="0.01" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="2160" type="number" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="7.25" type="number" step="0.01" />
                  </TableCell>
                  <TableCell>
                    <Input defaultValue="15,660.00" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className="text-right font-medium">Total:</TableCell>
                  <TableCell>
                    <Input defaultValue="3600" type="number" />
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <Input defaultValue="27,900.00" />
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hsn-code" className="block text-sm font-medium">HSN Code</Label>
              <Select>
                <SelectTrigger id="hsn-code" className="mt-1">
                  <SelectValue placeholder="69072100" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="69072100">69072100</SelectItem>
                  <SelectItem value="69072200">69072200</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="size" className="block text-sm font-medium">Size</Label>
              <Select>
                <SelectTrigger id="size" className="mt-1">
                  <SelectValue placeholder="600 X 1200" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="600x1200">600 X 1200</SelectItem>
                  <SelectItem value="300x600">300 X 600</SelectItem>
                  <SelectItem value="600x600">600 X 600</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="unit-type" className="block text-sm font-medium">Unit Type</Label>
              <Select>
                <SelectTrigger id="unit-type" className="mt-1">
                  <SelectValue placeholder="Box" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="pallet">Pallet</SelectItem>
                  <SelectItem value="piece">Piece</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the Supplier Details section with a form layout similar to the invoice form
  const renderSupplierSection = () => {
    return (
      <div className="space-y-6">
        <div className="border rounded-md p-4 bg-white">
          <div className="bg-purple-100 p-3 -m-4 mb-4 border-b">
            <h3 className="font-bold uppercase text-sm">Supplier Details</h3>
          </div>
          
          <div className="space-y-6">
            <div className="border-b pb-4">
              <div className="flex items-start">
                <Label htmlFor="supplier-name" className="uppercase text-xs font-bold w-20 pt-2">NAME :</Label>
                <div className="flex-1">
                  <Input 
                    id="supplier-name" 
                    placeholder="ABC" 
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="border-b pb-4">
              <div className="flex items-start">
                <Label htmlFor="gstin-no" className="uppercase text-xs font-bold w-20 pt-2">GSTIN NO. :</Label>
                <div className="flex-1">
                  <Input 
                    id="gstin-no" 
                    placeholder="XXXXXXXXXXX" 
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-b pb-4">
                <div className="flex items-start">
                  <Label htmlFor="tax-invoice-no" className="uppercase text-xs font-bold w-32 pt-2">TAX INVOICE NO :</Label>
                  <div className="flex-1">
                    <Input 
                      id="tax-invoice-no" 
                      placeholder="GST/XXX" 
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <div className="flex items-start">
                  <Label htmlFor="invoice-date" className="uppercase text-xs font-bold w-20 pt-2">DATE :</Label>
                  <div className="flex-1">
                    <div className="relative">
                      <Input 
                        id="invoice-date" 
                        placeholder="mm/dd/yyyy" 
                        className="mt-1 pr-10"
                        type="date"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the ARN & Declaration section with a form layout similar to the invoice form
  const renderARNSection = () => {
    return (
      <div className="space-y-6">
        <div className="border rounded-md p-4 bg-white">
          <div className="bg-amber-100 p-3 -m-4 mb-4 border-b">
            <h3 className="font-bold uppercase text-sm">ARN & Declaration</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Export Under GST Circular</h4>
              <div className="border-b pb-4">
                <Input 
                  id="gst-circular" 
                  placeholder="EXPORT UNDER GST CIRCULAR NO. XX/20XX Customs DT.XX/XX/20XX" 
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Application Reference Number</h4>
              <div className="border-b pb-4">
                <Input 
                  id="application-reference-number" 
                  placeholder="ACXXXXXXXXXXXXXXX" 
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        description="Manage dropdown options for invoice forms"
        action={
          <Button asChild>
            <a href="/">Back to Dashboard</a>
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dropdown Options Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="grid grid-cols-5 mb-6">
              {sections.map((section) => (
                <TabsTrigger key={section.id} value={section.id}>
                  {section.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="exporter" className="space-y-4">
              {renderExporterSection()}
            </TabsContent>

            <TabsContent value="shipping" className="space-y-4">
              {renderShippingSection()}
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              {renderTableSection()}
            </TabsContent>

            <TabsContent value="supplier" className="space-y-4">
              {renderSupplierSection()}
            </TabsContent>

            <TabsContent value="arn" className="space-y-4">
              {renderARNSection()}
            </TabsContent>

            {sections.filter(s => s.id !== "exporter" && s.id !== "shipping" && s.id !== "table" && s.id !== "supplier" && s.id !== "arn").map((section) => (
              <TabsContent key={section.id} value={section.id} className="space-y-4">
                <div className="mb-4">
                  <Label htmlFor="category-select">Select Field</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger id="category-select" className="w-full md:w-[300px]">
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategoryData && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">
                        Options for {selectedCategoryData.name}
                      </h3>
                      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Option</DialogTitle>
                            <DialogDescription>
                              Add a new option for {selectedCategoryData.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="new-option-value">Option Value</Label>
                            <Input
                              id="new-option-value"
                              value={newOptionValue}
                              onChange={(e) => setNewOptionValue(e.target.value)}
                              placeholder="Enter option value"
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddOption}>Add</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Value</TableHead>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCategoryData.options.length > 0 ? (
                          selectedCategoryData.options.map((option) => (
                            <TableRow key={option.id}>
                              <TableCell>{option.value}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(option)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteOption(option.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                              No options available. Click "Add Option" to create one.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Option</DialogTitle>
                <DialogDescription>
                  Update the option value
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="edit-option-value">Option Value</Label>
                <Input
                  id="edit-option-value"
                  value={editOptionValue}
                  onChange={(e) => setEditOptionValue(e.target.value)}
                  placeholder="Enter option value"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditOption}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use this panel to manage dropdown options that will appear in the invoice form. 
            Select a section tab, then choose a field from the dropdown to edit its options.
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground">
            <li>Navigate between sections using the tabs at the top</li>
            <li>For each section, you'll see a preview of the form layout</li>
            <li>Select a specific field to edit from the dropdown</li>
            <li>Click "Add Option" to add a new option to the selected field</li>
            <li>Click the pencil icon to edit an existing option</li>
            <li>Click the trash icon to delete an option</li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            These options will be available as dropdown selections when creating new invoices.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;

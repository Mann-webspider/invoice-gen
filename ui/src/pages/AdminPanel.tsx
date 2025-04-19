import  React, { useState ,useEffect} from "react";
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
  
  // Add state for form data
  const [exporterData, setExporterData] = useState({
    exporterName: "",
    companyAddress: "",
    email: "",
    taxId: "",
    ieCode: "",
    panNo: "",
    gstinNo: "",
    stateCode: ""
  });
  
  const [supplierData, setSupplierData] = useState({
    supplierName: "",
    gstinNo: "",
    taxInvoiceNo: ""
  });
  
  const [arnData, setArnData] = useState({
    gstCircular: "",
    applicationReferenceNumber: ""
  });
  
  // Add state for shipping details
  const [shippingData, setShippingData] = useState({
    placeOfReceipt: "",
    portOfLoading: "",
    portOfDischarge: "",
    finalDestination: ""
  });
  
  // Add state for table information
  const [tableData, setTableData] = useState({
    marksNos1: "",
    marksNos2: "",
    description: "",
    hsnCode: "",
    size: "",
    unitType: ""
  });
  
  // Add handlers for saving each section
  const handleSaveExporterSection = () => {
    // Here you would typically save the data to your backend
    // For now, we'll just show a success toast
    toast({
      title: "Success",
      description: "Exporter section saved successfully",
    });
  };
  
  const handleSaveSupplierSection = () => {
    // Here you would typically save the data to your backend
    // For now, we'll just show a success toast
    toast({
      title: "Success",
      description: "Supplier details saved successfully",
    });
  };
  
  const handleSaveARNSection = () => {
    // Here you would typically save the data to your backend
    // For now, we'll just show a success toast
    toast({
      title: "Success",
      description: "ARN & Declaration saved successfully",
    });
  };

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

  // Add handlers for saving individual shipping fields
  const handleSavePlaceOfReceipt = () => {
    toast({
      title: "Success",
      description: "Place of Receipt saved successfully",
    });
  };
  
  const handleSavePortOfLoading = () => {
    toast({
      title: "Success",
      description: "Port of Loading saved successfully",
    });
  };
  
  const handleSavePortOfDischarge = () => {
    toast({
      title: "Success",
      description: "Port of Discharge saved successfully",
    });
  };
  
  const handleSaveFinalDestination = () => {
    toast({
      title: "Success",
      description: "Final Destination saved successfully",
    });
  };

  // Add handlers for saving table information fields
  const handleSaveMarksNos1 = () => {
    toast({
      title: "Success",
      description: "Marks & Nos. (1) saved successfully",
    });
  };
  
  const handleSaveMarksNos2 = () => {
    toast({
      title: "Success",
      description: "Marks & Nos. (2) saved successfully",
    });
  };
  
  const handleSaveDescriptionAndHsnCode = () => {
    toast({
      title: "Success",
      description: "Description and HSN Code saved successfully",
    });
  };
  
  const handleSaveSize = () => {
    toast({
      title: "Success",
      description: "Size saved successfully",
    });
  };
  
  const handleSaveUnitType = () => {
    toast({
      title: "Success",
      description: "Unit Type saved successfully",
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
              <Label htmlFor="exporter-select" className="uppercase text-xs font-bold">Exporter Name</Label>
              <Input 
                id="email" 
                placeholder="Company Name"
                className="mt-1"
                value={exporterData.exporterName}
                onChange={(e) => setExporterData({...exporterData, exporterName: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="company-address" className="uppercase text-xs font-bold">Company Address</Label>
              <Textarea 
                id="company-address" 
                className="mt-1 h-24" 
                placeholder="Enter company address"
                value={exporterData.companyAddress}
                onChange={(e) => setExporterData({...exporterData, companyAddress: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="uppercase text-xs font-bold">Email</Label>
              <Input 
                id="email" 
                placeholder="e.g., yourmail@gmail.com" 
                className="mt-1"
                value={exporterData.email}
                onChange={(e) => setExporterData({...exporterData, email: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="tax-id" className="uppercase text-xs font-bold">Tax ID</Label>
              <Input 
                id="tax-id" 
                placeholder="e.g., 24AACF********" 
                className="mt-1"
                value={exporterData.taxId}
                onChange={(e) => setExporterData({...exporterData, taxId: e.target.value})}
              />
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-4 border rounded-md p-4 bg-white">
            <div className="bg-blue-100 p-3 -m-4 mb-4 border-b">
              <h3 className="font-bold uppercase text-sm">EXPORTER DETAILS</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ie-code" className="uppercase text-xs font-bold">I.E. Code #</Label>
                <Input 
                  id="ie-code" 
                  placeholder="1234567890" 
                  className="mt-1"
                  value={exporterData.ieCode}
                  onChange={(e) => setExporterData({...exporterData, ieCode: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="pan-no" className="uppercase text-xs font-bold">PAN NO. #</Label>
                <Input 
                  id="pan-no" 
                  placeholder="Enter PAN number" 
                  className="mt-1"
                  value={exporterData.panNo}
                  onChange={(e) => setExporterData({...exporterData, panNo: e.target.value})}
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
                  value={exporterData.gstinNo}
                  onChange={(e) => setExporterData({...exporterData, gstinNo: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="state-code" className="uppercase text-xs font-bold">STATE CODE</Label>
                <Input 
                  id="state-code" 
                  placeholder="24" 
                  className="mt-1"
                  value={exporterData.stateCode}
                  onChange={(e) => setExporterData({...exporterData, stateCode: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Save button for Exporter section */}
        <div className="flex justify-end mt-4">
          <Button onClick={() => toast({
            title: "Success",
            description: "Exporter section saved successfully",
          })} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Exporter Section
          </Button>
        </div>
      </div>
    );
  };

  // Render the Shipping section with a form layout similar to the invoice form
  const renderShippingSection = () => {
    return (
      <div className="space-y-6">
          <div className="space-y-4 border rounded-md p-4 bg-white">
            <div className="bg-orange-100 p-3 -m-4 mb-4 border-b">
              <h3 className="font-bold uppercase text-sm">Shipping Details</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="place-receipt" className="uppercase text-xs font-bold">Place of Receipt</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="place-receipt" 
                    placeholder="MORBI" 
                    className="mt-1"
                    value={shippingData.placeOfReceipt}
                    onChange={(e) => setShippingData({...shippingData, placeOfReceipt: e.target.value})}
                  />
                  <Button 
                    onClick={handleSavePlaceOfReceipt} 
                    size="sm" 
                    className="mt-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="port-loading" className="uppercase text-xs font-bold">Port of Loading</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="port-loading" 
                    placeholder="MUNDRA" 
                    className="mt-1"
                    value={shippingData.portOfLoading}
                    onChange={(e) => setShippingData({...shippingData, portOfLoading: e.target.value})}
                  />
                  <Button 
                    onClick={handleSavePortOfLoading} 
                    size="sm" 
                    className="mt-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="port-discharge" className="uppercase text-xs font-bold">Port of Discharge</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="port-discharge" 
                    placeholder="NEW YORK" 
                    className="mt-1"
                    value={shippingData.portOfDischarge}
                    onChange={(e) => setShippingData({...shippingData, portOfDischarge: e.target.value})}
                  />
                  <Button 
                    onClick={handleSavePortOfDischarge} 
                    size="sm" 
                    className="mt-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="final-destination" className="uppercase text-xs font-bold">Final Destination</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="final-destination" 
                    placeholder="USA" 
                    className="mt-1"
                    value={shippingData.finalDestination}
                    onChange={(e) => setShippingData({...shippingData, finalDestination: e.target.value})}
                  />
                  <Button 
                    onClick={handleSaveFinalDestination} 
                    size="sm" 
                    className="mt-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
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
        <div className="border rounded-md p-4 bg-white shadow-sm">
          <div className="bg-green-100 p-3 -m-4 mb-4 border-b flex items-center">
            <h3 className="font-bold uppercase text-sm">Table Information</h3>
          </div>
          
          <div className="space-y-8">
            {/* Marks & Nos. section with individual save buttons */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <Label htmlFor="marks-nos" className="block text-sm font-medium mb-2">Marks & Nos.</Label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center gap-2">
                  <Input 
                    id="marks-nos-1" 
                    placeholder="10" 
                    className="w-24 h-9"
                    value={tableData.marksNos1}
                    onChange={(e) => setTableData({...tableData, marksNos1: e.target.value})}
                  />
                  <Button 
                    onClick={handleSaveMarksNos1} 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 h-9 w-9 p-0 flex items-center justify-center"
                    title="Save Marks & Nos. (1)"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
                <span className="flex items-center text-gray-500 font-medium">X</span>
                <div className="flex items-center gap-2">
                  <Input 
                    id="marks-nos-2" 
                    placeholder="20" 
                    className="w-24 h-9"
                    value={tableData.marksNos2}
                    onChange={(e) => setTableData({...tableData, marksNos2: e.target.value})}
                  />
                  <Button 
                    onClick={handleSaveMarksNos2} 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 h-9 w-9 p-0 flex items-center justify-center"
                    title="Save Marks & Nos. (2)"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Description and HSN Code with a single save button between them */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="description" className="block text-sm font-medium mb-2">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="Glazed porcelain Floor Tiles" 
                    className="h-9"
                    value={tableData.description}
                    onChange={(e) => setTableData({...tableData, description: e.target.value})}
                  />
                </div>
                
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="hsn-code" className="block text-sm font-medium mb-2">HSN Code</Label>
                    <Input 
                      id="hsn-code" 
                      placeholder="69072100" 
                      className="h-9"
                      value={tableData.hsnCode}
                      onChange={(e) => setTableData({...tableData, hsnCode: e.target.value})}
                    />
                  </div>
                  <Button 
                    onClick={handleSaveDescriptionAndHsnCode} 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 h-9 w-9 p-0 flex items-center justify-center mb-1"
                    title="Save Description and HSN Code"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Size and Unit Type with individual save buttons */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor="size" className="block text-sm font-medium mb-2">Size</Label>
                    <Input 
                      id="size" 
                      placeholder="600 X 1200" 
                      className="h-9"
                      value={tableData.size}
                      onChange={(e) => setTableData({...tableData, size: e.target.value})}
                    />
                  </div>
                  <Button 
                    onClick={handleSaveSize} 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 h-9 w-9 p-0 flex items-center justify-center mt-6"
                    title="Save Size"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor="unit-type" className="block text-sm font-medium mb-2">Unit Type</Label>
                    <Input 
                      id="unit-type" 
                      placeholder="Box" 
                      className="h-9"
                      value={tableData.unitType}
                      onChange={(e) => setTableData({...tableData, unitType: e.target.value})}
                    />
                  </div>
                  <Button 
                    onClick={handleSaveUnitType} 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 h-9 w-9 p-0 flex items-center justify-center mt-6"
                    title="Save Unit Type"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
                    value={supplierData.supplierName}
                    onChange={(e) => setSupplierData({...supplierData, supplierName: e.target.value})}
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
                    value={supplierData.gstinNo}
                    onChange={(e) => setSupplierData({...supplierData, gstinNo: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            
              <div className="border-b pb-4">
                <div className="flex items-start">
                  <Label htmlFor="tax-invoice-no" className="uppercase text-xs font-bold w-32 pt-2">TAX INVOICE NO :</Label>
                  <div className="flex-1">
                    <Input 
                      id="tax-invoice-no" 
                      placeholder="GST/XXX" 
                      className="mt-1"
                      value={supplierData.taxInvoiceNo}
                      onChange={(e) => setSupplierData({...supplierData, taxInvoiceNo: e.target.value})}
                    />
                  </div>
                </div>
              
              
            </div>
          </div>
          
          {/* Save button for Supplier Details section */}
          <div className="flex justify-end mt-4">
            <Button onClick={() => toast({
              title: "Success",
              description: "Supplier details saved successfully",
            })} className="bg-purple-600 hover:bg-purple-700">
              <Save className="h-4 w-4 mr-2" />
              Save Supplier Details
            </Button>
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
          
          {/* Save button for ARN & Declaration section */}
          <div className="flex justify-end mt-4">
            <Button onClick={() => toast({
              title: "Success",
              description: "ARN & Declaration saved successfully",
            })} className="bg-amber-600 hover:bg-amber-700">
              <Save className="h-4 w-4 mr-2" />
              Save ARN & Declaration
            </Button>
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

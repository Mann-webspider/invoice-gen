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
import api from "@/lib/axios";

// Define sections based on the images provided
const sections = [
  {
    id: "exporter",
    name: "Exporter Section",
    categories: [
      "exporter",
      "ie_code",
      "pan_number",
      "gstin_number",
      "state_code",
      "buyersOrderNoFormat",
      "poNo",
      "email",
      "tax_id"
    ]
  },
  {
    id: "shipping",
    name: "Shipping Details",
    categories: [
      "preCarriageBy",
      "place_of_receipt",
      "countryOfOrigin",
      "countryOffinal_destination",
      "vesselFlightNo",
      "port_of_loading",
      "port_of_discharge",
      "final_destination",
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
      "supplier_name",
      "supplierGstin",
      "taxInvoiceFormat"
    ]
  },
  {
    id: "arn",
    name: "ARN & Declaration",
    categories: [
      "exportUndergst_circular",
      "application_ref_number"
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
    company_name: "",
    company_address: "",
    email: "",
    tax_id: "",
    ie_code: "",
    pan_number: "",
    gstin_number: "",
    state_code: "",
    invoiceNumber: ""
  });

  // Add state for multiple exporters
  const [exporters, setExporters] = useState<Array<{
    id: string;
    company_name: string;
    company_address: string;
    email: string;
    tax_id: string;
    ie_code: string;
    pan_number: string;
    gstin_number: string;
    state_code: string;
  }>>([]);

  // Add state for selected exporter in dropdown
  const [selectedExporterId, setSelectedExporterId] = useState<string>("default-exporter");

  // Add state for multiple suppliers
  const [suppliers, setSuppliers] = useState<Array<{
    id: string;
    supplier_name: string;
    gstin_number: string;
    tax_invoice_no: string;
  }>>([]);

  // Add state for selected supplier in dropdown
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

  // Add state for multiple ARN entries
  const [arnEntries, setArnEntries] = useState<Array<{
    id: string;
    gst_circular: string;
    application_ref_number: string;
  }>>([]);

  // Add state for selected ARN entry in dropdown
  const [selectedArnId, setSelectedArnId] = useState<string>("");

  const [supplierData, setSupplierData] = useState({
    supplier_name: "",
    gstin_number: "",
    tax_invoice_no: ""
  });

  const [arnData, setArnData] = useState({
    gst_circular: "",
    application_ref_number: ""
  });

  // Add state for shipping details
  const [shippingData, setShippingData] = useState({
    place_of_receipt: "",
    port_of_loading: "",
    port_of_discharge: "",
    final_destination: ""
  });

  // Add state for table information
  const [tableData, setTableData] = useState({
    marksNos1: "",
    marksNos2: "",
    description: "",
    hsnCode: "",
    size: "",
    sqm: "",
    unitType: ""
  });

  // Add handlers for saving each section
  const handleSaveExporterSection = () => {
    // Here you would typically save the data to your backend
    // For now, we'll just show a success toast
    toast({
      title: "Success",
      description: "All exporter fields (except invoice number) saved successfully",
    });
  };

  const handleSaveSupplierSection = async () => {
    // Here you would typically save the data to your backend
    // For now, we'll just show a success toast
    try {
      // Supplier data ready for submission - handled silently
      
      const res = await api.post("/supplier", supplierData);
      if(res.status !== 201){
        throw new Error("Failed to save supplier");
      }
      console.log(res.data);
      
      toast({
        title: "Success",
        description: "Supplier details saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save supplier",
        variant: "destructive",
      });
    }
    
   
  };

  const handleSaveARNSection = async () => {
    // Here you would typically save the data to your backend
    // For now, we'll just show a success toast
    try {
      const res = await api.post("/arn", arnData);
      if(res.status !== 201){
        throw new Error("Failed to save ARN");
      }
      console.log(res.data);
      
      toast({
        title: "Success",
        description: "ARN details saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save ARN",
        variant: "destructive",
      });
    }
  };

  // Get categories for the active section
  const activeSectionData = sections.find(section => section.id === activeSection);
  const categoriesInSection = activeSectionData?.categories || [];

  // Filter dropdown categories to only show those in the active section
  const filteredCategories = dropdownOptions.categories.filter(
    category => categoriesInSection.includes(category.id)
  );

  // ________________________________________________________________________
  // custom made by Mann
  async function getExporters(){

    let res = await api.get("/exporter")
    if(res.status !== 200){
      return "error"
    }
    return res.data
  }
  async function getSuppliers(){
    let res = await api.get("/supplier")
    if(res.status !== 200){
      return "error"
    }
    return res.data
  }
  async function getArns(){
    let res = await api.get("/arn")
    if(res.status !== 200){
      return "error"
    }
    return res.data
  }
  React.useEffect(() => {
    (async () => {
      try {
        const exporter_res = await getExporters();
        const supplier_res = await getSuppliers();
        const arn_res = await getArns();
        setExporters(exporter_res);
        setSuppliers(supplier_res);
        setArnEntries(arn_res);
      } catch (error) {
        // Failed to fetch exporters - handled silently
      }
    })();
  }, []);




  // ________________________________________________________________________
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
  const handleSavePlaceOfReceipt = async () => {
    try {
     
      let data = {
        'category':"place_of_receipt",
        'value': shippingData.place_of_receipt
      }
      let res = await api.post("/dropdown-options", data)
      if(res.status !== 201){
        toast({
          title: "Error",
          description: "Failed to save Place of Receipt",
          variant: "destructive",
        });
        return "error"
      }
      return res.data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Place of Receipt",
        variant: "destructive",
      });
    }
    toast({
      title: "Success",
      description: "Place of Receipt saved successfully",
    });
  };

  const handleSavePortOfLoading = async () => {
    try {
     
      let data = {
        'category':"port_of_loading",
        'value': shippingData.port_of_loading
      }
      let res = await api.post("/dropdown-options", data)
      if(res.status !== 201){
        toast({
          title: "Error",
          description: "Failed to save Port of Loading",
          variant: "destructive",
        });
        return "error"
      }
      return res.data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Port of Loading",
        variant: "destructive",
      });
    }
    toast({
      title: "Success",
      description: "Port of Loading saved successfully",
    });
  };

  const handleSavePortOfDischarge = async () => {
    try {
     
      let data = {
        'category':"port_of_discharge",
        'value': shippingData.port_of_discharge
      }
      let res = await api.post("/dropdown-options", data)
      if(res.status !== 201){
        toast({
          title: "Error",
          description: "Failed to save Port of Discharge",
          variant: "destructive",
        });
        return "error"
      }
      return res.data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Port of Discharge",
        variant: "destructive",
      });
    }
    toast({
      title: "Success",
      description: "Port of Discharge saved successfully",
    });
  };

  const handleSaveFinalDestination = async () => {
    try {
     
      let data = {
        'category':"final_destination",
        'value': shippingData.final_destination
      }
      let res = await api.post("/dropdown-options", data)
      if(res.status !== 201){
        toast({
          title: "Error",
          description: "Failed to save Final Destination",
          variant: "destructive",
        });
        return "error"
      }
      shippingData.final_destination = ""
      toast({
        title: "Success",
        description: " Final Destinatione saved successfully",
      });
      return res.data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save  Final Destination",
        variant: "destructive",
      });
    }
  };

  

  const handleSaveDescriptionAndHsnCode = () => {
    toast({
      title: "Success",
      description: "Description and HSN Code saved successfully",
    });
  };

  

  const handleSaveUnitType = () => {
    toast({
      title: "Success",
      description: "Unit Type saved successfully",
    });
  };

  

 

 

  const handleSaveInvoiceNumber = () => {
    toast({
      title: "Success",
      description: "Invoice Number saved successfully",
    });
  };

  // Function to add a new exporter
  const handleAddExporter = async () => {
    let res = await api.post("/exporter",exporterData)
    
    
    // Validate required fields
    if (!exporterData.company_name.trim()) {
      toast({
        title: "Error",
        description: "Exporter Name is required",
        variant: "destructive",
      });
      return;
    }

   
    
    
    // Clear the form for next entry
    setExporterData({
      company_name: "",
      company_address: "",
      email: "",
      tax_id: "",
      ie_code: "",
      pan_number: "",
      gstin_number: "",
      state_code: "",
      invoiceNumber: ""
    });

    toast({
      title: "Success",
      description: "Exporter added successfully",
    });
  };

  // Function to handle exporter selection from dropdown
  const handleExporterSelect = (exporterId: string) => {
    setSelectedExporterId(exporterId);
  };

  // Get the selected exporter data for display in the table
  const selectedExporter = selectedExporterId
    ? exporters.find(exp => exp.id === selectedExporterId)
    : exporters.length > 0 ? exporters[0] : null;

  // Function to add a new supplier
  const handleAddSupplier = () => {
    // Validate required fields
    if (!supplierData.supplier_name.trim()) {
      toast({
        title: "Error",
        description: "Supplier Name is required",
        variant: "destructive",
      });
      return;
    }

    // Create new supplier with current form data
    const newSupplier = {
      id: Date.now().toString(),
      ...supplierData
    };

    // Add to suppliers array
    setSuppliers([...suppliers, newSupplier]);

    // Set the newly added supplier as selected
    setSelectedSupplierId(newSupplier.id);

    // Clear the form for next entry
    setSupplierData({
      supplier_name: "",
      gstin_number: "",
      tax_invoice_no: ""
    });

    toast({
      title: "Success",
      description: "Supplier added successfully",
    });
  };

  // Function to handle supplier selection from dropdown
  const handleSupplierSelect = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
  };

  // Function to add a new ARN entry
  const handleAddARN = () => {
    // Validate required fields
    if (!arnData.application_ref_number.trim()) {
      toast({
        title: "Error",
        description: "Application Reference Number is required",
        variant: "destructive",
      });
      return;
    }

    // Create new ARN entry with current form data
    const newARN = {
      id: Date.now().toString(),
      ...arnData
    };

    // Add to ARN entries array
    setArnEntries([...arnEntries, newARN]);

    // Set the newly added ARN as selected
    setSelectedArnId(newARN.id);

    // Clear the form for next entry
    setArnData({
      gst_circular: "",
      application_ref_number: ""
    });

    toast({
      title: "Success",
      description: "ARN & Declaration added successfully",
    });
  };

  // Function to handle ARN selection from dropdown
  const handleARNSelect = (arnId: string) => {
    setSelectedArnId(arnId);
  };

  // Get the selected supplier data for display in the table
  const selectedSupplier = selectedSupplierId
    ? suppliers.find(sup => sup.id === selectedSupplierId)
    : suppliers.length > 0 ? suppliers[0] : null;

  // Get the selected ARN data for display in the table
  const selectedARN = selectedArnId
    ? arnEntries.find(arn => arn.id === selectedArnId)
    : arnEntries.length > 0 ? arnEntries[0] : null;

  // Function to handle saving size and SQM together
  const handleSaveSizeAndSQM = () => {
    toast({
      title: "Success",
      description: "Size and SQM saved successfully",
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
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  placeholder="Company Name"
                  className="mt-1"
                  value={exporterData.company_name}
                  onChange={(e) => setExporterData({ ...exporterData, company_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company-address" className="uppercase text-xs font-bold">Company Address</Label>
              <div className="flex items-start gap-2">
                <Textarea
                  id="company-address"
                  className="mt-1 h-24"
                  placeholder="Enter company address"
                  value={exporterData.company_address}
                  onChange={(e) => setExporterData({ ...exporterData, company_address: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="uppercase text-xs font-bold">Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  placeholder="e.g., yourmail@gmail.com"
                  className="mt-1"
                  value={exporterData.email}
                  onChange={(e) => setExporterData({ ...exporterData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tax-id" className="uppercase text-xs font-bold">Tax ID</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tax-id"
                  placeholder="e.g., 24AACF********"
                  className="mt-1"
                  value={exporterData.tax_id}
                  onChange={(e) => setExporterData({ ...exporterData, tax_id: e.target.value })}
                />
              </div>
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
                <div className="flex items-center gap-2">
                  <Input
                    id="ie-code"
                    placeholder="1234567890"
                    className="mt-1"
                    value={exporterData.ie_code}
                    onChange={(e) => setExporterData({ ...exporterData, ie_code: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pan-no" className="uppercase text-xs font-bold">PAN NO. #</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pan-no"
                    placeholder="Enter PAN number"
                    className="mt-1"
                    value={exporterData.pan_number}
                    onChange={(e) => setExporterData({ ...exporterData, pan_number: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gstin-no" className="uppercase text-xs font-bold">GSTIN NO. #</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="gstin-no"
                    placeholder="Enter GSTIN number"
                    className="mt-1"
                    value={exporterData.gstin_number}
                    onChange={(e) => setExporterData({ ...exporterData, gstin_number: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="state-code" className="uppercase text-xs font-bold">STATE CODE</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="state-code"
                    placeholder="24"
                    className="mt-1"
                    value={exporterData.state_code}
                    onChange={(e) => setExporterData({ ...exporterData, state_code: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNo">INVOICE NUMBER</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="invoiceNo"
                  value={exporterData.invoiceNumber}
                  onChange={(e) => setExporterData({ ...exporterData, invoiceNumber: e.target.value })}
                  placeholder="e.g., EXP/001/2024"
                  required
                />
                <Button
                  onClick={handleSaveInvoiceNumber}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-3 w-3" />
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* Save button for Exporter section */}
        <div className="flex justify-end mt-4 space-x-4">
          <Button onClick={handleAddExporter} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save All Exporter Fields
          </Button>
          {/* <Button onClick={handleSaveExporterSection} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save All Exporter Fields
          </Button> */}
        </div>

        {/* Table to display saved exporter data */}
        <div className="mt-8 border rounded-md p-4 bg-white">
          <div className="bg-blue-100 p-3 -m-4 mb-4 border-b">
            <h3 className="font-bold uppercase text-sm">Saved Exporter Information</h3>
          </div>

          {exporters.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No additional exporters saved yet. Fill the form above and click "Save All Exporter Fields".
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Label htmlFor="exporter-selector" className="mb-2 block">Select Exporter:</Label>
                <Select
                  value={selectedExporterId || exporters[0]?.id || ""}
                  onValueChange={handleExporterSelect}
                >
                  <SelectTrigger id="exporter-selector" className="w-full">
                    <SelectValue placeholder="Select an exporter" />
                  </SelectTrigger>
                  <SelectContent>
                    {exporters.map(exporter => (
                      <SelectItem key={exporter.id} value={exporter.id}>
                        {exporter.company_name || "Unnamed Exporter"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedExporter && (
                    <>
                      <TableRow>
                        <TableCell className="font-medium">Exporter Name</TableCell>
                        <TableCell>{selectedExporter.company_name || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Company Address</TableCell>
                        <TableCell>{selectedExporter.company_address || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Email</TableCell>
                        <TableCell>{selectedExporter.email || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Tax ID</TableCell>
                        <TableCell>{selectedExporter.tax_id || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">I.E. Code #</TableCell>
                        <TableCell>{selectedExporter.ie_code || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">PAN NO. #</TableCell>
                        <TableCell>{selectedExporter.pan_number || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">GSTIN NO. #</TableCell>
                        <TableCell>{selectedExporter.gstin_number || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">State Code</TableCell>
                        <TableCell>{selectedExporter.state_code || "-"}</TableCell>
                      </TableRow>
                      {/* <TableRow>
                        <TableCell className="font-medium">Invoice Number</TableCell>
                        <TableCell>{selectedExporter.invoiceNumber || "-"}</TableCell>
                      </TableRow> */}
                    </>
                  )}
                </TableBody>
              </Table>
            </>
          )}
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
                  value={shippingData.place_of_receipt}
                  onChange={(e) => setShippingData({ ...shippingData, place_of_receipt: e.target.value })}
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
                  value={shippingData.port_of_loading}
                  onChange={(e) => setShippingData({ ...shippingData, port_of_loading: e.target.value })}
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
                  value={shippingData.port_of_discharge}
                  onChange={(e) => setShippingData({ ...shippingData, port_of_discharge: e.target.value })}
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
                  value={shippingData.final_destination}
                  onChange={(e) => setShippingData({ ...shippingData, final_destination: e.target.value })}
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
                    onChange={(e) => setTableData({ ...tableData, description: e.target.value })}
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
                      onChange={(e) => setTableData({ ...tableData, hsnCode: e.target.value })}
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

            {/* Size and SQM with a single save button */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="size" className="block text-sm font-medium mb-2">Size</Label>
                  <Input
                    id="size"
                    placeholder="600 X 1200"
                    className="h-9"
                    value={tableData.size}
                    onChange={(e) => setTableData({ ...tableData, size: e.target.value })}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="sqm" className="block text-sm font-medium mb-2">SQM</Label>
                    <Input
                      id="sqm"
                      type="number"
                      placeholder="0.72"
                      className="h-9"
                      value={tableData.sqm}
                      onChange={(e) => setTableData({ ...tableData, sqm: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={handleSaveSizeAndSQM}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 h-9 w-9 p-0 flex items-center justify-center mb-1"
                    title="Save Size and SQM"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Unit Type with individual save button */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor="unit-type" className="block text-sm font-medium mb-2">Unit Type</Label>
                  <Input
                    id="unit-type"
                    placeholder="Box"
                    className="h-9"
                    value={tableData.unitType}
                    onChange={(e) => setTableData({ ...tableData, unitType: e.target.value })}
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
                    value={supplierData.supplier_name}
                    onChange={(e) => setSupplierData({ ...supplierData, supplier_name: e.target.value })}
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
                    value={supplierData.gstin_number}
                    onChange={(e) => setSupplierData({ ...supplierData, gstin_number: e.target.value })}
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
                    value={supplierData.tax_invoice_no}
                    onChange={(e) => setSupplierData({ ...supplierData, tax_invoice_no: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save button for Supplier Details section */}
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveSupplierSection} className="bg-purple-600 hover:bg-purple-700">
              <Save className="h-4 w-4 mr-2" />
              Save Supplier Details
            </Button>
          </div>
        </div>

        {/* Table to display saved supplier data */}
        <div className="mt-8 border rounded-md p-4 bg-white">
          <div className="bg-purple-100 p-3 -m-4 mb-4 border-b">
            <h3 className="font-bold uppercase text-sm">Saved Supplier Information</h3>
          </div>
          
          {suppliers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No suppliers saved yet. Fill the form above and click "Save Supplier Details".
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Label htmlFor="supplier-selector" className="mb-2 block">Select Supplier:</Label>
                <Select
                  value={selectedSupplierId || suppliers[0]?.id || ""}
                  onValueChange={handleSupplierSelect}
                >
                  <SelectTrigger id="supplier-selector" className="w-full">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplier_name || "Unnamed Supplier"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSupplier && (
                    <>
                      <TableRow>
                        <TableCell className="font-medium">Supplier Name</TableCell>
                        <TableCell>{selectedSupplier.supplier_name || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">GSTIN No.</TableCell>
                        <TableCell>{selectedSupplier.gstin_number || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Tax Invoice No.</TableCell>
                        <TableCell>{selectedSupplier.tax_invoice_no || "-"}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </>
          )}
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
                  value={arnData.gst_circular}
                  onChange={(e) => setArnData({ ...arnData, gst_circular: e.target.value })}
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
                  value={arnData.application_ref_number}
                  onChange={(e) => setArnData({ ...arnData, application_ref_number: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Save button for ARN & Declaration section */}
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveARNSection} className="bg-amber-600 hover:bg-amber-700">
              <Save className="h-4 w-4 mr-2" />
              Save ARN & Declaration
            </Button>
          </div>
        </div>

        {/* Table to display saved ARN data */}
        <div className="mt-8 border rounded-md p-4 bg-white">
          <div className="bg-amber-100 p-3 -m-4 mb-4 border-b">
            <h3 className="font-bold uppercase text-sm">Saved ARN & Declaration Information</h3>
          </div>
          
          {arnEntries.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No ARN entries saved yet. Fill the form above and click "Save ARN & Declaration".
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Label htmlFor="arn-selector" className="mb-2 block">Select ARN Entry:</Label>
                <Select
                  value={selectedArnId || arnEntries[0]?.id || ""}
                  onValueChange={handleARNSelect}
                >
                  <SelectTrigger id="arn-selector" className="w-full">
                    <SelectValue placeholder="Select an ARN entry" />
                  </SelectTrigger>
                  <SelectContent>
                    {arnEntries.map((entry, index) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {`ARN Entry ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedARN && (
                    <>
                      <TableRow>
                        <TableCell className="font-medium">Export Under GST Circular</TableCell>
                        <TableCell>{selectedARN.gst_circular || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Application Reference Number</TableCell>
                        <TableCell>{selectedARN.application_ref_number || "-"}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </>
          )}
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

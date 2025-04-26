import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash, Plus, Save, ArrowUpDown, ExternalLink, FileText, Edit2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type DropdownOption = {
  id: string;
  value: string;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
  options: DropdownOption[];
};

type DropdownOptions = {
  categories: Category[];
};

type Exporter = {
  id: string;
  exporterName: string;
  companyAddress: string;
  email: string;
  taxId: string;
  ieCode: string;
  panNo: string;
  gstinNo: string;
  stateCode: string;
  invoiceNumber: string;
  authorizedName: string;
  authorizedDesignation: string;
  contactNumber: string;
  createdAt: string;
  updatedAt: string;
};

// Mock recent invoices data
const recentInvoices = [
  { id: '1', number: 'EXP/642/2025', date: '4/14/2025', totalAmount: 0, items: 0 },
  { id: '2', number: 'EXP/642/2025', date: '4/14/2025', totalAmount: 0, items: 0 },
  { id: '3', number: 'EXP/642/2025', date: '4/14/2025', totalAmount: 0, items: 0 },
];

// Mock initial exporters data
const initialExporters: Exporter[] = [
  {
    id: "1",
    exporterName: "Zeric Ceramic",
    companyAddress: "SECOND FLOOR, OFFICE NO 7,\nISHAN CERAMIC ZONE WING D,\nLALPAR, MORBI,\nGujarat, 363642\nINDIA",
    email: "info@zericceramic.com",
    taxId: "24AACF*********",
    ieCode: "AACFZ6****",
    panNo: "AACFZ6****",
    gstinNo: "24AACF*********",
    stateCode: "24",
    invoiceNumber: "EXP/001/2024",
    authorizedName: "John Doe",
    authorizedDesignation: "Export Manager",
    contactNumber: "+91 98765 43210",
    createdAt: "2024-01-01",
    updatedAt: "2024-04-15"
  },
  {
    id: "2",
    exporterName: "Nexa International",
    companyAddress: "PLOT NO. 123, CERAMIC ZONE,\nMORBI-RAJKOT HIGHWAY,\nMORBI, Gujarat, 363641\nINDIA",
    email: "exports@nexainternational.com",
    taxId: "24ABCDE*******",
    ieCode: "ABNEX1****",
    panNo: "ABNEX1****",
    gstinNo: "24ABCDE*******",
    stateCode: "24",
    invoiceNumber: "NI/001/2024",
    authorizedName: "Sarah Smith",
    authorizedDesignation: "Director",
    contactNumber: "+91 98765 12345",
    createdAt: "2024-02-15",
    updatedAt: "2024-04-10"
  }
];

// Section definitions
const sections = [
  { id: "exporter", label: "Exporter Section" },
  { id: "shipping", label: "Shipping Details" },
  { id: "table", label: "Table Information" },
  { id: "supplier", label: "Supplier Details" },
  { id: "arn", label: "ARN & Declaration" }
];

// Placeholder function for dropdown options
const getDropdownOptions = (): DropdownOptions => {
  return {
    categories: [
      {
        id: "exporters",
        name: "Exporters",
        options: [
          { id: "exporter1", value: "Zeric Ceramic", categoryId: "exporters" },
          { id: "exporter2", value: "Nexa International", categoryId: "exporters" }
        ]
      },
      {
        id: "shippingTerms",
        name: "Shipping Terms",
        options: [
          { id: "term1", value: "FOB", categoryId: "shippingTerms" },
          { id: "term2", value: "CIF", categoryId: "shippingTerms" },
          { id: "term3", value: "CFR", categoryId: "shippingTerms" }
        ]
      }
    ]
  };
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("exporter");
  const [exporters, setExporters] = useState<Exporter[]>(initialExporters);
  const [selectedExporter, setSelectedExporter] = useState<Exporter | null>(null);
  const [isAddExporterDialogOpen, setIsAddExporterDialogOpen] = useState(false);
  const [isEditExporterDialogOpen, setIsEditExporterDialogOpen] = useState(false);
  const [isViewExporterDialogOpen, setIsViewExporterDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [exporterToDelete, setExporterToDelete] = useState<string | null>(null);
  
  // Form state for adding/editing exporters
  const [formData, setFormData] = useState<Omit<Exporter, 'id' | 'createdAt' | 'updatedAt'>>({
    exporterName: "",
    companyAddress: "",
    email: "",
    taxId: "",
    ieCode: "",
    panNo: "",
    gstinNo: "",
    stateCode: "",
    invoiceNumber: "",
    authorizedName: "",
    authorizedDesignation: "",
    contactNumber: ""
  });

  // Mock shipping details data
  const [shippingDetails, setShippingDetails] = useState({
    placesOfReceipt: ["MORBI", "THANGADH", "RAJKOT", "DHORAJI", "BHAVNAGAR"],
    portsOfLoading: ["MUNDRA", "KANDLA", "PIPAVAV", "Jawaharlal Nehru Port", "SINGAPORE", "SHANGHAI"],
    portsOfDischarge: ["NEW YORK", "NHAVA SHEVA", "CHENNAI", "KOLKATA", "VIZAG"],
    finalDestinations: ["USA", "GERMANY", "NETHERLANDS", "UAE", "SINGAPORE", "CHINA"]
  });

  // State for adding new values
  const [newValue, setNewValue] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isAddValueDialogOpen, setIsAddValueDialogOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemValue, setEditingItemValue] = useState("");
  const [isEditValueDialogOpen, setIsEditValueDialogOpen] = useState(false);

  // Add table information data
  const [tableInfo, setTableInfo] = useState({
    descriptionHsnPairs: [
      { id: "1", description: "Glazed porcelain Floor Tiles", hsnCode: "69072100" },
      { id: "2", description: "Polished Vitrified Tiles", hsnCode: "69072200" },
      { id: "3", description: "Ceramic Wall Tiles", hsnCode: "69072300" },
      { id: "4", description: "Digital Floor Tiles", hsnCode: "69072100" }
    ],
    sizeSqmPairs: [
      { id: "1", size: "600 X 1200", sqm: "1.44" },
      { id: "2", size: "600 X 600", sqm: "0.72" },
      { id: "3", size: "800 X 800", sqm: "1.28" },
      { id: "4", size: "300 X 600", sqm: "0.36" },
      { id: "5", size: "300 X 300", sqm: "0.18" }
    ],
    unitTypes: ["Box", "Pallet", "Carton", "Piece"]
  });

  // State for adding/editing table information
  const [newDescHsnPair, setNewDescHsnPair] = useState({ description: "", hsnCode: "" });
  const [newSizeSqmPair, setNewSizeSqmPair] = useState({ size: "", sqm: "" });
  const [newUnitType, setNewUnitType] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddDescHsnDialogOpen, setIsAddDescHsnDialogOpen] = useState(false);
  const [isEditDescHsnDialogOpen, setIsEditDescHsnDialogOpen] = useState(false);
  const [isAddSizeSqmDialogOpen, setIsAddSizeSqmDialogOpen] = useState(false);
  const [isEditSizeSqmDialogOpen, setIsEditSizeSqmDialogOpen] = useState(false);
  const [isAddUnitTypeDialogOpen, setIsAddUnitTypeDialogOpen] = useState(false);
  const [isEditUnitTypeDialogOpen, setIsEditUnitTypeDialogOpen] = useState(false);
  const [editingUnitTypeIndex, setEditingUnitTypeIndex] = useState<number | null>(null);
  const [editingUnitTypeValue, setEditingUnitTypeValue] = useState("");

  // Add supplier details state
  const [suppliers, setSuppliers] = useState([
    {
      id: "1",
      name: "ABC Ceramics Pvt. Ltd.",
      gstin: "24ABCDE1234F1Z5",
      address: "123 Ceramic Zone, Morbi, Gujarat, India - 363642",
      permission: "SSP/MRB/2023/1234"
    },
    {
      id: "2",
      name: "XYZ Exports",
      gstin: "24XYZAB5678G1Z7",
      address: "456 Industrial Area, Thangadh, Gujarat, India - 363530",
      permission: "SSP/THG/2023/5678"
    }
  ]);
  
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [isEditSupplierDialogOpen, setIsEditSupplierDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    gstin: "",
    address: "",
    permission: ""
  });

  // Add ARN & Declaration state
  const [arnDeclaration, setArnDeclaration] = useState({
    gstCircular: "",
    applicationRefNumber: ""
  });

  // Function to handle ARN & Declaration changes
  const handleArnDeclarationChange = (field: string, value: string) => {
    setArnDeclaration(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to save ARN & Declaration
  const handleSaveArnDeclaration = () => {
    // Here you would save to database
    toast({
      title: "Success",
      description: "ARN & Declaration saved successfully",
    });
  };

  // Initialize form data when editing an exporter
  useEffect(() => {
    if (selectedExporter && isEditExporterDialogOpen) {
      setFormData({
        exporterName: selectedExporter.exporterName,
        companyAddress: selectedExporter.companyAddress,
        email: selectedExporter.email,
        taxId: selectedExporter.taxId,
        ieCode: selectedExporter.ieCode,
        panNo: selectedExporter.panNo,
        gstinNo: selectedExporter.gstinNo,
        stateCode: selectedExporter.stateCode,
        invoiceNumber: selectedExporter.invoiceNumber,
        authorizedName: selectedExporter.authorizedName,
        authorizedDesignation: selectedExporter.authorizedDesignation,
        contactNumber: selectedExporter.contactNumber
      });
    }
  }, [selectedExporter, isEditExporterDialogOpen]);

  // Reset form data when closing dialogs
  const resetFormData = () => {
    setFormData({
      exporterName: "",
      companyAddress: "",
      email: "",
      taxId: "",
      ieCode: "",
      panNo: "",
      gstinNo: "",
      stateCode: "",
      invoiceNumber: "",
      authorizedName: "",
      authorizedDesignation: "",
      contactNumber: ""
    });
  };

  const handleAddExporter = () => {
    // Validate required fields
    if (!formData.exporterName.trim()) {
      toast({
        title: "Error",
        description: "Exporter Name is required",
        variant: "destructive",
      });
      return;
    }

    // Create new exporter
    const newExporter: Exporter = {
      id: (exporters.length + 1).toString(),
      ...formData,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    // Add to exporters array
    setExporters([...exporters, newExporter]);
    setIsAddExporterDialogOpen(false);
    resetFormData();

    toast({
      title: "Success",
      description: "Exporter added successfully",
    });
  };

  const handleEditExporter = () => {
    if (!selectedExporter) return;

    // Validate required fields
    if (!formData.exporterName.trim()) {
      toast({
        title: "Error",
        description: "Exporter Name is required",
        variant: "destructive",
      });
      return;
    }

    // Update the exporter
    const updatedExporters = exporters.map(exporter => {
      if (exporter.id === selectedExporter.id) {
        return {
          ...exporter,
          ...formData,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return exporter;
    });

    setExporters(updatedExporters);
    setIsEditExporterDialogOpen(false);
    setSelectedExporter(null);
    resetFormData();

    toast({
      title: "Success",
      description: "Exporter updated successfully",
    });
  };

  const handleDeleteExporter = () => {
    if (!exporterToDelete) return;

    // Filter out the exporter to delete
    const updatedExporters = exporters.filter(exporter => exporter.id !== exporterToDelete);
    setExporters(updatedExporters);
    setIsDeleteDialogOpen(false);
    setExporterToDelete(null);

    toast({
      title: "Success",
      description: "Exporter deleted successfully",
    });
  };

  const openEditDialog = (exporter: Exporter) => {
    setSelectedExporter(exporter);
    setIsEditExporterDialogOpen(true);
  };

  const openViewDialog = (exporter: Exporter) => {
    setSelectedExporter(exporter);
    setIsViewExporterDialogOpen(true);
  };

  const openDeleteDialog = (exporterId: string) => {
    setExporterToDelete(exporterId);
    setIsDeleteDialogOpen(true);
  };

  const handleAddShippingValue = () => {
    if (!editingCategory || !newValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a value",
        variant: "destructive",
      });
      return;
    }

    setShippingDetails(prev => {
      const updated = { ...prev };
      if (editingCategory === "placesOfReceipt") {
        updated.placesOfReceipt = [...prev.placesOfReceipt, newValue];
      } else if (editingCategory === "portsOfLoading") {
        updated.portsOfLoading = [...prev.portsOfLoading, newValue];
      } else if (editingCategory === "portsOfDischarge") {
        updated.portsOfDischarge = [...prev.portsOfDischarge, newValue];
      } else if (editingCategory === "finalDestinations") {
        updated.finalDestinations = [...prev.finalDestinations, newValue];
      }
      return updated;
    });

    setNewValue("");
    setIsAddValueDialogOpen(false);
    setEditingCategory(null);

    toast({
      title: "Success",
      description: "Value added successfully",
    });
  };

  const handleEditShippingValue = () => {
    if (!editingCategory || !editingItemValue.trim() || editingItemIndex === null) {
      toast({
        title: "Error",
        description: "Please enter a value",
        variant: "destructive",
      });
      return;
    }

    setShippingDetails(prev => {
      const updated = { ...prev };
      if (editingCategory === "placesOfReceipt") {
        const newArray = [...prev.placesOfReceipt];
        newArray[editingItemIndex] = editingItemValue;
        updated.placesOfReceipt = newArray;
      } else if (editingCategory === "portsOfLoading") {
        const newArray = [...prev.portsOfLoading];
        newArray[editingItemIndex] = editingItemValue;
        updated.portsOfLoading = newArray;
      } else if (editingCategory === "portsOfDischarge") {
        const newArray = [...prev.portsOfDischarge];
        newArray[editingItemIndex] = editingItemValue;
        updated.portsOfDischarge = newArray;
      } else if (editingCategory === "finalDestinations") {
        const newArray = [...prev.finalDestinations];
        newArray[editingItemIndex] = editingItemValue;
        updated.finalDestinations = newArray;
      }
      return updated;
    });

    setEditingItemValue("");
    setIsEditValueDialogOpen(false);
    setEditingCategory(null);
    setEditingItemIndex(null);

    toast({
      title: "Success",
      description: "Value updated successfully",
    });
  };

  const handleDeleteShippingValue = (category: string, index: number) => {
    setShippingDetails(prev => {
      const updated = { ...prev };
      if (category === "placesOfReceipt") {
        updated.placesOfReceipt = prev.placesOfReceipt.filter((_, i) => i !== index);
      } else if (category === "portsOfLoading") {
        updated.portsOfLoading = prev.portsOfLoading.filter((_, i) => i !== index);
      } else if (category === "portsOfDischarge") {
        updated.portsOfDischarge = prev.portsOfDischarge.filter((_, i) => i !== index);
      } else if (category === "finalDestinations") {
        updated.finalDestinations = prev.finalDestinations.filter((_, i) => i !== index);
      }
      return updated;
    });

    toast({
      title: "Success",
      description: "Value deleted successfully",
    });
  };

  const openEditValueDialog = (category: string, index: number, value: string) => {
    setEditingCategory(category);
    setEditingItemIndex(index);
    setEditingItemValue(value);
    setIsEditValueDialogOpen(true);
  };

  const openAddValueDialog = (category: string) => {
    setEditingCategory(category);
    setNewValue("");
    setIsAddValueDialogOpen(true);
  };

  // Add a function to sort values alphabetically
  const getSortedValues = (values: string[]) => {
    return [...values].sort((a, b) => a.localeCompare(b));
  };

  // Handle add/edit/delete functions for table information
  const handleAddDescHsnPair = () => {
    if (!newDescHsnPair.description.trim() || !newDescHsnPair.hsnCode.trim()) {
      toast({
        title: "Error",
        description: "Both Description and HSN Code are required",
        variant: "destructive",
      });
      return;
    }

    setTableInfo(prev => ({
      ...prev,
      descriptionHsnPairs: [
        ...prev.descriptionHsnPairs,
        {
          id: Date.now().toString(),
          description: newDescHsnPair.description,
          hsnCode: newDescHsnPair.hsnCode
        }
      ]
    }));

    setNewDescHsnPair({ description: "", hsnCode: "" });
    setIsAddDescHsnDialogOpen(false);

    toast({
      title: "Success",
      description: "Description and HSN Code pair added successfully",
    });
  };

  const handleEditDescHsnPair = () => {
    if (!editingItemId || !newDescHsnPair.description.trim() || !newDescHsnPair.hsnCode.trim()) {
      toast({
        title: "Error",
        description: "Both Description and HSN Code are required",
        variant: "destructive",
      });
      return;
    }

    setTableInfo(prev => ({
      ...prev,
      descriptionHsnPairs: prev.descriptionHsnPairs.map(pair => 
        pair.id === editingItemId 
          ? { ...pair, description: newDescHsnPair.description, hsnCode: newDescHsnPair.hsnCode }
          : pair
      )
    }));

    setNewDescHsnPair({ description: "", hsnCode: "" });
    setIsEditDescHsnDialogOpen(false);
    setEditingItemId(null);

    toast({
      title: "Success",
      description: "Description and HSN Code pair updated successfully",
    });
  };

  const handleDeleteDescHsnPair = (id: string) => {
    setTableInfo(prev => ({
      ...prev,
      descriptionHsnPairs: prev.descriptionHsnPairs.filter(pair => pair.id !== id)
    }));

    toast({
      title: "Success",
      description: "Description and HSN Code pair deleted successfully",
    });
  };

  const handleAddSizeSqmPair = () => {
    if (!newSizeSqmPair.size.trim() || !newSizeSqmPair.sqm.trim()) {
      toast({
        title: "Error",
        description: "Both Size and SQM are required",
        variant: "destructive",
      });
      return;
    }

    setTableInfo(prev => ({
      ...prev,
      sizeSqmPairs: [
        ...prev.sizeSqmPairs,
        {
          id: Date.now().toString(),
          size: newSizeSqmPair.size,
          sqm: newSizeSqmPair.sqm
        }
      ]
    }));

    setNewSizeSqmPair({ size: "", sqm: "" });
    setIsAddSizeSqmDialogOpen(false);

    toast({
      title: "Success",
      description: "Size and SQM pair added successfully",
    });
  };

  const handleEditSizeSqmPair = () => {
    if (!editingItemId || !newSizeSqmPair.size.trim() || !newSizeSqmPair.sqm.trim()) {
      toast({
        title: "Error",
        description: "Both Size and SQM are required",
        variant: "destructive",
      });
      return;
    }

    setTableInfo(prev => ({
      ...prev,
      sizeSqmPairs: prev.sizeSqmPairs.map(pair => 
        pair.id === editingItemId 
          ? { ...pair, size: newSizeSqmPair.size, sqm: newSizeSqmPair.sqm }
          : pair
      )
    }));

    setNewSizeSqmPair({ size: "", sqm: "" });
    setIsEditSizeSqmDialogOpen(false);
    setEditingItemId(null);

    toast({
      title: "Success",
      description: "Size and SQM pair updated successfully",
    });
  };

  const handleDeleteSizeSqmPair = (id: string) => {
    setTableInfo(prev => ({
      ...prev,
      sizeSqmPairs: prev.sizeSqmPairs.filter(pair => pair.id !== id)
    }));

    toast({
      title: "Success",
      description: "Size and SQM pair deleted successfully",
    });
  };

  const handleAddUnitType = () => {
    if (!newUnitType.trim()) {
      toast({
        title: "Error",
        description: "Unit Type is required",
        variant: "destructive",
      });
      return;
    }

    setTableInfo(prev => ({
      ...prev,
      unitTypes: [...prev.unitTypes, newUnitType]
    }));

    setNewUnitType("");
    setIsAddUnitTypeDialogOpen(false);

    toast({
      title: "Success",
      description: "Unit Type added successfully",
    });
  };

  const handleEditUnitType = () => {
    if (editingUnitTypeIndex === null || !editingUnitTypeValue.trim()) {
      toast({
        title: "Error",
        description: "Unit Type is required",
        variant: "destructive",
      });
      return;
    }

    setTableInfo(prev => {
      const newUnitTypes = [...prev.unitTypes];
      newUnitTypes[editingUnitTypeIndex] = editingUnitTypeValue;
      return {
        ...prev,
        unitTypes: newUnitTypes
      };
    });

    setEditingUnitTypeValue("");
    setIsEditUnitTypeDialogOpen(false);
    setEditingUnitTypeIndex(null);

    toast({
      title: "Success",
      description: "Unit Type updated successfully",
    });
  };

  const handleDeleteUnitType = (index: number) => {
    setTableInfo(prev => ({
      ...prev,
      unitTypes: prev.unitTypes.filter((_, i) => i !== index)
    }));

    toast({
      title: "Success",
      description: "Unit Type deleted successfully",
    });
  };

  const openEditDescHsnDialog = (id: string, description: string, hsnCode: string) => {
    setEditingItemId(id);
    setNewDescHsnPair({ description, hsnCode });
    setIsEditDescHsnDialogOpen(true);
  };

  const openEditSizeSqmDialog = (id: string, size: string, sqm: string) => {
    setEditingItemId(id);
    setNewSizeSqmPair({ size, sqm });
    setIsEditSizeSqmDialogOpen(true);
  };

  const openEditUnitTypeDialog = (index: number, value: string) => {
    setEditingUnitTypeIndex(index);
    setEditingUnitTypeValue(value);
    setIsEditUnitTypeDialogOpen(true);
  };

  const handleAddSupplier = () => {
    if (!supplierFormData.name.trim() || !supplierFormData.gstin.trim()) {
      toast({
        title: "Error",
        description: "Name and GSTIN No. are required",
        variant: "destructive",
      });
      return;
    }

    const newSupplier = {
      id: Date.now().toString(),
      name: supplierFormData.name,
      gstin: supplierFormData.gstin,
      address: supplierFormData.address,
      permission: supplierFormData.permission
    };

    setSuppliers([...suppliers, newSupplier]);
    setIsAddSupplierDialogOpen(false);
    setSupplierFormData({
      name: "",
      gstin: "",
      address: "",
      permission: ""
    });

    toast({
      title: "Success",
      description: "Supplier added successfully",
    });
  };

  const handleEditSupplier = () => {
    if (!selectedSupplier || !supplierFormData.name.trim() || !supplierFormData.gstin.trim()) {
      toast({
        title: "Error",
        description: "Name and GSTIN No. are required",
        variant: "destructive",
      });
      return;
    }

    setSuppliers(suppliers.map(supplier => 
      supplier.id === selectedSupplier.id 
        ? { ...supplier, ...supplierFormData }
        : supplier
    ));

    setIsEditSupplierDialogOpen(false);
    setSelectedSupplier(null);
    setSupplierFormData({
      name: "",
      gstin: "",
      address: "",
      permission: ""
    });

    toast({
      title: "Success",
      description: "Supplier updated successfully",
    });
  };

  const handleDeleteSupplier = (id) => {
    setSuppliers(suppliers.filter(supplier => supplier.id !== id));

    toast({
      title: "Success",
      description: "Supplier deleted successfully",
    });
  };

  const openEditSupplierDialog = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      gstin: supplier.gstin,
      address: supplier.address,
      permission: supplier.permission
    });
    setIsEditSupplierDialogOpen(true);
  };

  // Render functions for different sections
  const renderExporterSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Manage Exporters</h2>
        <Button 
          onClick={() => setIsAddExporterDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Exporter
        </Button>
      </div>

    

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-semibold">Saved Exporters</h3>
        </div>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exporter Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>IE Code</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exporters.map((exporter) => (
                <TableRow key={exporter.id}>
                  <TableCell className="font-medium">{exporter.exporterName}</TableCell>
                  <TableCell>{exporter.email}</TableCell>
                  <TableCell>{exporter.ieCode}</TableCell>
                  <TableCell>{exporter.gstinNo}</TableCell>
                  <TableCell>{exporter.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openViewDialog(exporter)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(exporter)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDeleteDialog(exporter.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  const renderShippingSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Shipping Details Management</h2>
      </div>

      <div className="bg-[#edf6f9] rounded-lg shadow overflow-hidden p-4 border border-[#edf6f9]">
        <h3 className="font-bold text-lg mb-4 uppercase text-amber-900">SHIPPING DETAILS</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Place of Receipt */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="placeOfReceipt" className="text-sm font-medium uppercase">PLACE OF RECEIPT</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => openAddValueDialog("placesOfReceipt")}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-white border rounded-md h-40 overflow-y-auto">
              {getSortedValues(shippingDetails.placesOfReceipt).map((place, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 border-b last:border-b-0">
                  <span className="truncate">{place}</span>
                  <div className="flex space-x-1 ml-2 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openEditValueDialog("placesOfReceipt", shippingDetails.placesOfReceipt.indexOf(place), place)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteShippingValue("placesOfReceipt", shippingDetails.placesOfReceipt.indexOf(place))}
                      className="h-6 w-6 p-0"
                    >
                      <Trash className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
              {shippingDetails.placesOfReceipt.length === 0 && (
                <div className="p-2 text-gray-500 text-center">No places of receipt added</div>
              )}
            </div>
          </div>

          {/* Port of Loading */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="portOfLoading" className="text-sm font-medium uppercase">PORT OF LOADING</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => openAddValueDialog("portsOfLoading")}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-white border rounded-md h-40 overflow-y-auto">
              {getSortedValues(shippingDetails.portsOfLoading).map((port, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 border-b last:border-b-0">
                  <span className="truncate">{port}</span>
                  <div className="flex space-x-1 ml-2 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openEditValueDialog("portsOfLoading", shippingDetails.portsOfLoading.indexOf(port), port)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteShippingValue("portsOfLoading", shippingDetails.portsOfLoading.indexOf(port))}
                      className="h-6 w-6 p-0"
                    >
                      <Trash className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
              {shippingDetails.portsOfLoading.length === 0 && (
                <div className="p-2 text-gray-500 text-center">No ports of loading added</div>
              )}
            </div>
          </div>

          {/* Port of Discharge */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="portOfDischarge" className="text-sm font-medium uppercase">PORT OF DISCHARGE</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => openAddValueDialog("portsOfDischarge")}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-white border rounded-md h-40 overflow-y-auto">
              {getSortedValues(shippingDetails.portsOfDischarge).map((port, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 border-b last:border-b-0">
                  <span className="truncate">{port}</span>
                  <div className="flex space-x-1 ml-2 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openEditValueDialog("portsOfDischarge", shippingDetails.portsOfDischarge.indexOf(port), port)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteShippingValue("portsOfDischarge", shippingDetails.portsOfDischarge.indexOf(port))}
                      className="h-6 w-6 p-0"
                    >
                      <Trash className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
              {shippingDetails.portsOfDischarge.length === 0 && (
                <div className="p-2 text-gray-500 text-center">No ports of discharge added</div>
              )}
            </div>
          </div>

          {/* Final Destination */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="finalDestination" className="text-sm font-medium uppercase">FINAL DESTINATION</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => openAddValueDialog("finalDestinations")}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-white border rounded-md h-40 overflow-y-auto">
              {getSortedValues(shippingDetails.finalDestinations).map((destination, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 border-b last:border-b-0">
                  <span className="truncate">{destination}</span>
                  <div className="flex space-x-1 ml-2 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openEditValueDialog("finalDestinations", shippingDetails.finalDestinations.indexOf(destination), destination)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteShippingValue("finalDestinations", shippingDetails.finalDestinations.indexOf(destination))}
                      className="h-6 w-6 p-0"
                    >
                      <Trash className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
              {shippingDetails.finalDestinations.length === 0 && (
                <div className="p-2 text-gray-500 text-center">No final destinations added</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTableSection = () => (
    <div className="space-y-6 ">
    

      <div className="bg-[#e8f5e9] rounded-lg shadow overflow-hidden p-4 border border-[#c8e6c9]">
        <h3 className="font-bold text-lg mb-4 uppercase text-green-900">TABLE INFORMATION</h3>
        
        {/* Description and HSN Code Pair */}
        <div className="mb-8 bg-white p-4 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-base">Description & HSN Code</h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setNewDescHsnPair({ description: "", hsnCode: "" });
                setIsAddDescHsnDialogOpen(true);
              }}
              className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Pair
            </Button>
          </div>
          
          <div className="h-40 overflow-y-auto border rounded-md">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Description</th>
                  <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">HSN Code</th>
                  <th className="py-2 pr-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getSortedValues(tableInfo.descriptionHsnPairs.map(p => p.description)).map((desc) => {
                  const pair = tableInfo.descriptionHsnPairs.find(p => p.description === desc);
                  if (!pair) return null;
                  
                  return (
                    <tr key={pair.id} className="hover:bg-gray-50">
                      <td className="py-2 pl-3 text-md truncate" title={pair.description}>
                        <div className="truncate">{pair.description}</div>
                      </td>
                      <td className="py-2 pl-3 text-md text-gray-500 truncate" title={pair.hsnCode}>
                        <div className="truncate">{pair.hsnCode}</div>
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDescHsnDialog(pair.id, pair.description, pair.hsnCode)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteDescHsnPair(pair.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tableInfo.descriptionHsnPairs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-500">
                      No Description/HSN pairs added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Size and SQM Pair */}
        <div className="mb-8 bg-white p-4 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-base">Size & SQM</h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setNewSizeSqmPair({ size: "", sqm: "" });
                setIsAddSizeSqmDialogOpen(true);
              }}
              className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Pair
            </Button>
          </div>
          
          <div className="h-40 overflow-y-auto border rounded-md">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Size</th>
                  <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">SQM</th>
                  <th className="py-2 pr-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getSortedValues(tableInfo.sizeSqmPairs.map(p => p.size)).map((size) => {
                  const pair = tableInfo.sizeSqmPairs.find(p => p.size === size);
                  if (!pair) return null;
                  
                  return (
                    <tr key={pair.id} className="hover:bg-gray-50">
                      <td className="py-2 pl-3 text-md truncate" title={pair.size}>
                        <div className="truncate">{pair.size}</div>
                      </td>
                      <td className="py-2 pl-3 text-md text-gray-500 truncate" title={pair.sqm}>
                        <div className="truncate">{pair.sqm}</div>
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditSizeSqmDialog(pair.id, pair.size, pair.sqm)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteSizeSqmPair(pair.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tableInfo.sizeSqmPairs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-500">
                      No Size/SQM pairs added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Unit Type */}
        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-base">Unit Type</h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setNewUnitType("");
                setIsAddUnitTypeDialogOpen(true);
              }}
              className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Unit Type
            </Button>
          </div>
          
          <div className="h-40 overflow-y-auto border rounded-md">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full">Unit Type</th>
                  <th className="py-2 pr-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getSortedValues(tableInfo.unitTypes).map((type, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 pl-3 text-md truncate" title={type}>
                      <div className="truncate">{type}</div>
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditUnitTypeDialog(tableInfo.unitTypes.indexOf(type), type)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUnitType(tableInfo.unitTypes.indexOf(type))}
                          className="h-6 w-6 p-0"
                        >
                          <Trash className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tableInfo.unitTypes.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center py-4 text-gray-500">
                      No unit types added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSupplierSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Supplier Details Management</h2>
        <Button 
          onClick={() => {
            setSupplierFormData({
              name: "",
              gstin: "",
              address: "",
              permission: ""
            });
            setIsAddSupplierDialogOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Supplier
        </Button>
      </div>

      <div className="bg-[#f3e5f5] rounded-lg shadow overflow-hidden p-4 border border-[#e1bee7]">
        <h3 className="font-bold text-lg mb-4 uppercase text-purple-900">SUPPLIER DETAILS</h3>
        
        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-full border rounded-md">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Name</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">GSTIN No.</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Address</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">S.S. Permission No.</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="truncate max-w-[150px]" title={supplier.name}>{supplier.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="truncate max-w-[150px]" title={supplier.gstin}>{supplier.gstin}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="truncate max-w-[300px]" title={supplier.address}>{supplier.address}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="truncate max-w-[150px]" title={supplier.permission}>{supplier.permission}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditSupplierDialog(supplier)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4 text-purple-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-500">
                        No suppliers added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Supplier Dialog */}
      <Dialog open={isAddSupplierDialogOpen} onOpenChange={setIsAddSupplierDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Enter supplier details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={supplierFormData.name}
                onChange={(e) => setSupplierFormData({...supplierFormData, name: e.target.value})}
                placeholder="Enter supplier name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gstin">GSTIN No. *</Label>
              <Input
                id="gstin"
                value={supplierFormData.gstin}
                onChange={(e) => setSupplierFormData({...supplierFormData, gstin: e.target.value})}
                placeholder="e.g., 24ABCDE1234F1Z5"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={supplierFormData.address}
                onChange={(e) => setSupplierFormData({...supplierFormData, address: e.target.value})}
                placeholder="Enter supplier address"
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="permission">S.S. PERMISSION No.</Label>
              <Input
                id="permission"
                value={supplierFormData.permission}
                onChange={(e) => setSupplierFormData({...supplierFormData, permission: e.target.value})}
                placeholder="e.g., SSP/MRB/2023/1234"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSupplierDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier} className="bg-purple-600 hover:bg-purple-700">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditSupplierDialogOpen} onOpenChange={setIsEditSupplierDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={supplierFormData.name}
                onChange={(e) => setSupplierFormData({...supplierFormData, name: e.target.value})}
                placeholder="Enter supplier name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-gstin">GSTIN No. *</Label>
              <Input
                id="edit-gstin"
                value={supplierFormData.gstin}
                onChange={(e) => setSupplierFormData({...supplierFormData, gstin: e.target.value})}
                placeholder="e.g., 24ABCDE1234F1Z5"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={supplierFormData.address}
                onChange={(e) => setSupplierFormData({...supplierFormData, address: e.target.value})}
                placeholder="Enter supplier address"
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-permission">S.S. PERMISSION No.</Label>
              <Input
                id="edit-permission"
                value={supplierFormData.permission}
                onChange={(e) => setSupplierFormData({...supplierFormData, permission: e.target.value})}
                placeholder="e.g., SSP/MRB/2023/1234"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditSupplierDialogOpen(false);
              setSelectedSupplier(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditSupplier} className="bg-purple-600 hover:bg-purple-700">Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderARNSection = () => (
    <div className="space-y-6">
      <div className="bg-[#fff9c4] rounded-lg shadow overflow-hidden p-4 border border-[#fff59d]">
        <h3 className="font-bold text-lg mb-6 uppercase text-amber-900">ARN & DECLARATION</h3>
        
        <div className="bg-white p-4 rounded-md shadow-sm space-y-6">
          <div>
            <Label htmlFor="gstCircular" className="text-base font-medium mb-2 block">Export Under GST Circular</Label>
            <Input
              id="gstCircular"
              className="w-full"
              placeholder="EXPORT UNDER GST CIRCULAR NO. XX/20XX Customs DT.XX/XX/20XX"
              value={arnDeclaration.gstCircular}
              onChange={(e) => handleArnDeclarationChange("gstCircular", e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="applicationRefNumber" className="text-base font-medium mb-2 block">Application Reference Number</Label>
            <Input
              id="applicationRefNumber"
              className="w-full"
              placeholder="ACXXXXXXXXXXXXXX"
              value={arnDeclaration.applicationRefNumber}
              onChange={(e) => handleArnDeclarationChange("applicationRefNumber", e.target.value)}
            />
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleSaveArnDeclaration}
            >
              <Save className="h-4 w-4 mr-2" />
              Save ARN & Declaration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Add exporter form fields
  const renderExporterForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="exporterName">Exporter Name *</Label>
          <Input
            id="exporterName"
            value={formData.exporterName}
            onChange={(e) => setFormData({ ...formData, exporterName: e.target.value })}
            placeholder="Company Name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="companyAddress">Company Address</Label>
          <Textarea
            id="companyAddress"
            value={formData.companyAddress}
            onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
            placeholder="Enter full company address"
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g., contact@company.com"
          />
        </div>
        
        <div>
          <Label htmlFor="taxId">Tax ID</Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            placeholder="e.g., 24AACF*********"
          />
        </div>
        
        <div>
          <Label htmlFor="authorizedName">Name of Authorized Official</Label>
          <Input
            id="authorizedName"
            value={formData.authorizedName}
            onChange={(e) => setFormData({ ...formData, authorizedName: e.target.value })}
            placeholder="e.g., John Doe"
          />
        </div>
        
        <div>
          <Label htmlFor="authorizedDesignation">Designation of Authorized Official</Label>
          <Input
            id="authorizedDesignation"
            value={formData.authorizedDesignation}
            onChange={(e) => setFormData({ ...formData, authorizedDesignation: e.target.value })}
            placeholder="e.g., Export Manager"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="ieCode">I.E. Code #</Label>
          <Input
            id="ieCode"
            value={formData.ieCode}
            onChange={(e) => setFormData({ ...formData, ieCode: e.target.value })}
            placeholder="e.g., 1234567890"
          />
        </div>
        
        <div>
          <Label htmlFor="panNo">PAN NO. #</Label>
          <Input
            id="panNo"
            value={formData.panNo}
            onChange={(e) => setFormData({ ...formData, panNo: e.target.value })}
            placeholder="Enter PAN number"
          />
        </div>
        
        <div>
          <Label htmlFor="gstinNo">GSTIN NO. #</Label>
          <Input
            id="gstinNo"
            value={formData.gstinNo}
            onChange={(e) => setFormData({ ...formData, gstinNo: e.target.value })}
            placeholder="Enter GSTIN number"
          />
        </div>
        
        <div>
          <Label htmlFor="stateCode">State Code</Label>
          <Input
            id="stateCode"
            value={formData.stateCode}
            onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
            placeholder="e.g., 24"
          />
        </div>
        
        <div>
          <Label htmlFor="invoiceNumber">Invoice Number Format</Label>
          <Input
            id="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            placeholder="e.g., EXP/001/2024"
          />
        </div>
        
        <div>
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input
            id="contactNumber"
            value={formData.contactNumber}
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            placeholder="e.g., +91 98765 43210"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage dropdown options for invoice forms</p>
        </div>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle>Dropdown Options Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="exporter">Exporter Section</TabsTrigger>
              <TabsTrigger value="shipping">Shipping Details</TabsTrigger>
              <TabsTrigger value="table">Table Information</TabsTrigger>
              <TabsTrigger value="supplier">Supplier Details</TabsTrigger>
              <TabsTrigger value="arn">ARN & Declaration</TabsTrigger>
            </TabsList>
            <TabsContent value="exporter">
              {renderExporterSection()}
            </TabsContent>
            <TabsContent value="shipping">
              {renderShippingSection()}
            </TabsContent>
            <TabsContent value="table">
              {renderTableSection()}
            </TabsContent>
            <TabsContent value="supplier">
              {renderSupplierSection()}
            </TabsContent>
            <TabsContent value="arn">
              {renderARNSection()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Exporter Dialog */}
      <Dialog open={isAddExporterDialogOpen} onOpenChange={setIsAddExporterDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Exporter</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new exporter. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {renderExporterForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddExporterDialogOpen(false);
              resetFormData();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddExporter}>Save Exporter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Exporter Dialog */}
      <Dialog open={isEditExporterDialogOpen} onOpenChange={setIsEditExporterDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exporter</DialogTitle>
            <DialogDescription>
              Update the exporter details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {renderExporterForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditExporterDialogOpen(false);
              setSelectedExporter(null);
              resetFormData();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditExporter}>Update Exporter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Exporter Dialog */}
      <Dialog open={isViewExporterDialogOpen} onOpenChange={setIsViewExporterDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exporter Details</DialogTitle>
          </DialogHeader>
          {selectedExporter && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Exporter Name</h3>
                  <p>{selectedExporter.exporterName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Company Address</h3>
                  <p className="whitespace-pre-line">{selectedExporter.companyAddress}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Email</h3>
                  <p>{selectedExporter.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Tax ID</h3>
                  <p>{selectedExporter.taxId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Authorized Name</h3>
                  <p>{selectedExporter.authorizedName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Authorized Designation</h3>
                  <p>{selectedExporter.authorizedDesignation}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">I.E. Code #</h3>
                  <p>{selectedExporter.ieCode}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">PAN NO. #</h3>
                  <p>{selectedExporter.panNo}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">GSTIN NO. #</h3>
                  <p>{selectedExporter.gstinNo}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">State Code</h3>
                  <p>{selectedExporter.stateCode}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Invoice Number Format</h3>
                  <p>{selectedExporter.invoiceNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Contact Number</h3>
                  <p>{selectedExporter.contactNumber}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsViewExporterDialogOpen(false);
              setSelectedExporter(null);
            }}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewExporterDialogOpen(false);
              if (selectedExporter) {
                openEditDialog(selectedExporter);
              }
            }}>
              Edit Exporter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exporter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exporter? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setExporterToDelete(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteExporter}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Value Dialog */}
      <Dialog open={isAddValueDialogOpen} onOpenChange={setIsAddValueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add New {editingCategory === 'placesOfReceipt' ? 'Place of Receipt' :
                      editingCategory === 'portsOfLoading' ? 'Port of Loading' :
                      editingCategory === 'portsOfDischarge' ? 'Port of Discharge' :
                      'Final Destination'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label htmlFor="newValue">Value</Label>
            <Input
              id="newValue"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter new value"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddValueDialogOpen(false);
              setEditingCategory(null);
              setNewValue("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddShippingValue}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Value Dialog */}
      <Dialog open={isEditValueDialogOpen} onOpenChange={setIsEditValueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit {editingCategory === 'placesOfReceipt' ? 'Place of Receipt' :
                   editingCategory === 'portsOfLoading' ? 'Port of Loading' :
                   editingCategory === 'portsOfDischarge' ? 'Port of Discharge' :
                   'Final Destination'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label htmlFor="editValue">Value</Label>
            <Input
              id="editValue"
              value={editingItemValue}
              onChange={(e) => setEditingItemValue(e.target.value)}
              placeholder="Enter updated value"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditValueDialogOpen(false);
              setEditingCategory(null);
              setEditingItemIndex(null);
              setEditingItemValue("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditShippingValue}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Description/HSN Dialog */}
      <Dialog open={isAddDescHsnDialogOpen} onOpenChange={setIsAddDescHsnDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Description & HSN Code</DialogTitle>
            <DialogDescription>
              Enter the description and HSN code as a pair.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newDescHsnPair.description}
                onChange={(e) => setNewDescHsnPair({...newDescHsnPair, description: e.target.value})}
                placeholder="e.g., Glazed porcelain Floor Tiles"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input
                id="hsnCode"
                value={newDescHsnPair.hsnCode}
                onChange={(e) => setNewDescHsnPair({...newDescHsnPair, hsnCode: e.target.value})}
                placeholder="e.g., 69072100"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDescHsnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDescHsnPair}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Description/HSN Dialog */}
      <Dialog open={isEditDescHsnDialogOpen} onOpenChange={setIsEditDescHsnDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Description & HSN Code</DialogTitle>
            <DialogDescription>
              Update the description and HSN code as a pair.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-description" >Description</Label>
              <Input
                id="edit-description"
                value={newDescHsnPair.description}
                onChange={(e) => setNewDescHsnPair({...newDescHsnPair, description: e.target.value})}
                placeholder="e.g., Glazed porcelain Floor Tiles"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-hsnCode">HSN Code</Label>
              <Input
                id="edit-hsnCode"
                value={newDescHsnPair.hsnCode}
                onChange={(e) => setNewDescHsnPair({...newDescHsnPair, hsnCode: e.target.value})}
                placeholder="e.g., 69072100"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDescHsnDialogOpen(false);
              setEditingItemId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditDescHsnPair}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Size/SQM Dialog */}
      <Dialog open={isAddSizeSqmDialogOpen} onOpenChange={setIsAddSizeSqmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Size & SQM</DialogTitle>
            <DialogDescription>
              Enter the size and SQM value as a pair.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={newSizeSqmPair.size}
                onChange={(e) => setNewSizeSqmPair({...newSizeSqmPair, size: e.target.value})}
                placeholder="e.g., 600 X 1200"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sqm">SQM</Label>
              <Input
                id="sqm"
                value={newSizeSqmPair.sqm}
                onChange={(e) => setNewSizeSqmPair({...newSizeSqmPair, sqm: e.target.value})}
                placeholder="e.g., 1.44"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSizeSqmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSizeSqmPair}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Size/SQM Dialog */}
      <Dialog open={isEditSizeSqmDialogOpen} onOpenChange={setIsEditSizeSqmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Size & SQM</DialogTitle>
            <DialogDescription>
              Update the size and SQM value as a pair.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-size">Size</Label>
              <Input
                id="edit-size"
                value={newSizeSqmPair.size}
                onChange={(e) => setNewSizeSqmPair({...newSizeSqmPair, size: e.target.value})}
                placeholder="e.g., 600 X 1200"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-sqm">SQM</Label>
              <Input
                id="edit-sqm"
                value={newSizeSqmPair.sqm}
                onChange={(e) => setNewSizeSqmPair({...newSizeSqmPair, sqm: e.target.value})}
                placeholder="e.g., 1.44"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditSizeSqmDialogOpen(false);
              setEditingItemId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditSizeSqmPair}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Unit Type Dialog */}
      <Dialog open={isAddUnitTypeDialogOpen} onOpenChange={setIsAddUnitTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Unit Type</DialogTitle>
            <DialogDescription>
              Enter a new unit type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="unitType">Unit Type</Label>
              <Input
                id="unitType"
                value={newUnitType}
                onChange={(e) => setNewUnitType(e.target.value)}
                placeholder="e.g., Box"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUnitTypeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUnitType}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Type Dialog */}
      <Dialog open={isEditUnitTypeDialogOpen} onOpenChange={setIsEditUnitTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Unit Type</DialogTitle>
            <DialogDescription>
              Update the unit type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-unitType">Unit Type</Label>
              <Input
                id="edit-unitType"
                value={editingUnitTypeValue}
                onChange={(e) => setEditingUnitTypeValue(e.target.value)}
                placeholder="e.g., Box"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditUnitTypeDialogOpen(false);
              setEditingUnitTypeIndex(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditUnitType}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;

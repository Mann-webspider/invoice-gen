import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  X,
  Upload,
  Plus,
  Trash,
  Save,
  ArrowUpDown,
  ExternalLink,
  FileText,
  Edit2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";
import { LoadingButton } from "@/components/LoadingButton";


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
  company_name: string;
  company_address: string;
  email: string;
  tax_id: string;
  ie_code: string;
  pan_number: string;
  gstin_number: string;
  state_code: string;
  invoice_number: string;
  authorized_name: string;
  authorized_designation: string;
  contact_number: string;
  company_prefix?: string;
  last_invoice_number?: string;
  invoice_year?: string;
  letterhead_top_image?: string;
  letterhead_bottom_image?: string;
  stamp_image?: string;
  createdAt: string;
  updatedAt: string;
};

// Mock recent invoices data
const recentInvoices = [
  {
    id: "1",
    number: "EXP/642/2025",
    date: "4/14/2025",
    totalAmount: 0,
    items: 0,
  },
  {
    id: "2",
    number: "EXP/642/2025",
    date: "4/14/2025",
    totalAmount: 0,
    items: 0,
  },
  {
    id: "3",
    number: "EXP/642/2025",
    date: "4/14/2025",
    totalAmount: 0,
    items: 0,
  },
];

// Mock initial exporters data
const initialExporters: Exporter[] = [
  {
    id: "1",
    company_name: "Zeric Ceramic",
    company_address:
      "SECOND FLOOR, OFFICE NO 7,\nISHAN CERAMIC ZONE WING D,\nLALPAR, MORBI,\nGujarat, 363642\nINDIA",
    email: "info@zericceramic.com",
    tax_id: "24AACF*********",
    ie_code: "AACFZ6****",
    pan_number: "AACFZ6****",
    gstin_number: "24AACF*********",
    state_code: "24",
    invoice_number: "EXP/001/2024",
    authorized_name: "John Doe",
    authorized_designation: "Export Manager",
    contact_number: "+91 98765 43210",
    createdAt: "2024-01-01",
    updatedAt: "2024-04-15",
  },
];

// Section definitions
const sections = [
  { id: "exporter", label: "Exporter Section" },
  { id: "shipping", label: "Shipping Details" },
  { id: "table", label: "Table Information" },
  { id: "supplier", label: "Supplier Details" },
  { id: "arn", label: "ARN & Declaration" },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("exporter");
  const [exporters, setExporters] = useState<Exporter[]>([
    {
      id: "",
      company_name: "",
      company_address: "",
      contact_number: "",
      email: "",
      tax_id: "",
      ie_code: "",
      pan_number: "",
      gstin_number: "",
      invoice_number: "",
      authorized_name: "",
      authorized_designation: "",
      state_code: "",
      createdAt: "2024-01-01",
      updatedAt: "2024-04-15",
    },
  ]);
  const [selectedExporter, setSelectedExporter] = useState<Exporter | null>(
    null
  );
  const [isAddExporterDialogOpen, setIsAddExporterDialogOpen] = useState(false);
  const [isEditExporterDialogOpen, setIsEditExporterDialogOpen] =
    useState(false);
  const [isViewExporterDialogOpen, setIsViewExporterDialogOpen] =
    useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [exporterToDelete, setExporterToDelete] = useState<string | null>(null);

  // Form state for adding/editing exporters
  const [formData, setFormData] = useState<
    Omit<Exporter, "createdAt" | "updatedAt">
  >({
    id: "",
    company_name: "",
    company_address: "",
    contact_number: "",
    email: "",
    tax_id: "",
    ie_code: "",
    pan_number: "",
    gstin_number: "",
    invoice_number: "",
    authorized_name: "",
    authorized_designation: "",
    state_code: "",
    letterhead_top_image: "",
    letterhead_bottom_image: "",
    stamp_image: "",
  });

  // Image upload handlers
  const handleTopImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          letterhead_top_image: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBottomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          letterhead_bottom_image: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setFormData({
            ...formData,
            stamp_image: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Generic image upload handler
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof typeof formData
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setFormData({
            ...formData,
            [fieldName]: {
              preview: event.target.result as string, // Base64 string for preview
              file: file, // Store file object for upload
            },
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Remove image handler
  const handleRemoveImage = (fieldName: keyof typeof formData) => {
    setFormData({ ...formData, [fieldName]: "" });
  };

  // Mock shipping details data
  const [shippingDetails, setShippingDetails] = useState([
    {
      id: "9",
      category: "place_of_receipt",
      value: "",
    },
  ]);

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
      {
        id: "1",
        description: "Glazed porcelain Floor Tiles",
        hsn_code: "69072100",
      },
      {
        id: "2",
        description: "Polished Vitrified Tiles",
        hsn_code: "69072200",
      },
      { id: "3", description: "Ceramic Wall Tiles", hsn_code: "69072300" },
      { id: "4", description: "Digital Floor Tiles", hsn_code: "69072100" },
    ],
    sizeSqmPairs: [
      { id: "1", size: "600 X 1200", sqm: "1.44" },
      { id: "2", size: "600 X 600", sqm: "0.72" },
      { id: "3", size: "800 X 800", sqm: "1.28" },
      { id: "4", size: "300 X 600", sqm: "0.36" },
      { id: "5", size: "300 X 300", sqm: "0.18" },
    ],
    unitTypes: [{ id: "1", value: "Box" }],
  });

  // State for adding/editing table information
  const [newDescHsnPair, setNewDescHsnPair] = useState({
    description: "",
    hsn_code: "",
  });
  const [newSizeSqmPair, setNewSizeSqmPair] = useState({ size: "", sqm: "" });
  const [newUnitType, setNewUnitType] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddDescHsnDialogOpen, setIsAddDescHsnDialogOpen] = useState(false);
  const [isEditDescHsnDialogOpen, setIsEditDescHsnDialogOpen] = useState(false);
  const [isAddSizeSqmDialogOpen, setIsAddSizeSqmDialogOpen] = useState(false);
  const [isEditSizeSqmDialogOpen, setIsEditSizeSqmDialogOpen] = useState(false);
  const [isAddUnitTypeDialogOpen, setIsAddUnitTypeDialogOpen] = useState(false);
  const [isEditUnitTypeDialogOpen, setIsEditUnitTypeDialogOpen] =
    useState(false);
  const [editingUnitTypeIndex, setEditingUnitTypeIndex] = useState<
    number | null
  >(null);
  const [editingUnitTypeValue, setEditingUnitTypeValue] = useState("");

  // Add supplier details state
  const [suppliers, setSuppliers] = useState([
    {
      id: "",
      name: "",
      gstin_number: "",
      address: "",
      permission: "",
    },
  ]);

  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [isEditSupplierDialogOpen, setIsEditSupplierDialogOpen] =
    useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    gstin_number: "",
    address: "",
    permission: "",
  });

  // Add ARN & Declaration state
  const [arnDeclaration, setArnDeclaration] = useState({
    gstCircular: "",
    applicationRefNumber: "",
  });

  // Function to handle ARN & Declaration changes
  const handleArnDeclarationChange = (field: string, value: string) => {
    setArnDeclaration((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Function to save ARN & Declaration
  const handleSaveArnDeclaration = async () => {
    try {
    setIsLoading(true);
    // Here you would save to database
    async function createArn() {
        let res = await api.post("/arn", arnDeclaration);
        console.log(res.data);
        toast({
          title: "Success",
          description: "ARN & Declaration saved successfully",
        });
        return res.data;
      }
      let data = await createArn();
    } catch (error) {
      console.log(error);
      return error.response.data;
    }finally {
      setIsLoading(false);
    }

  };
  // Define an async function inside useEffect
  const fetchExporterDetails = async () => {
    try {
      // Check if there's a valid exporter id
      const response = await api.get(`/exporter`);
      const exporterData = response.data.data;
      console.log(exporterData);

      setExporters(exporterData);
    } catch (error) {
      console.error("Failed to fetch exporter details:", error);
    }
  };
  const fetchShippingDetails = async () => {
    try {
      // Check if there's a valid exporter id
      const response = await api.get(`/dropdown-options`);
      const shippingData = response.data.data.shipping;
      // Shipping data received - handled silently
      console.log(shippingData);

      setShippingDetails(shippingData);
    } catch (error) {
      console.error("Failed to fetch exporter details:", error);
    }
  };
  const fetchTableDetails = async () => {
    try {
      // Check if there's a valid exporter id
      const response = await api.get(`/tableinfo`);
      const tableData = response.data.data;
      // Table data received - handled silently

      setTableInfo(tableData);
    } catch (error) {
      console.error("Failed to fetch exporter details:", error);
    }
  };
  const fetchSupplierDetails = async () => {
    try {
      // Check if there's a valid exporter id
      const response = await api.get(`/supplier`);
      const supplierData = response.data.data;
      // Supplier data received - handled silently

      setSuppliers(supplierData);
    } catch (error) {
      console.error("Failed to fetch exporter details:", error);
    }
  };
  const fetchArn = async () => {
    try {
      // Check if there's a valid exporter id
      const response = await api.get(`/arn/1`);
      const arnData = response.data.data;
      // ARN data received - handled silently

      setArnDeclaration({
        applicationRefNumber: arnData["arn"],
        gstCircular: arnData["gst_circular"],
      });
    } catch (error) {
      console.error("Failed to fetch exporter details:", error);
    }
  };

  // Initialize form data when editing an exporter
  useEffect(() => {
    fetchExporterDetails();
    fetchShippingDetails();
    fetchTableDetails();
    fetchSupplierDetails();
    fetchArn();
    // if (selectedExporter && isEditExporterDialogOpen) {
    // }
  }, []);
  // Initialize form data when editing an exporter
  useEffect(() => {
    if (selectedExporter && isEditExporterDialogOpen) {
      setFormData({
        id: selectedExporter.id,
        company_name: selectedExporter.company_name,
        company_address: selectedExporter.company_address,
        email: selectedExporter.email,
        tax_id: selectedExporter.tax_id,
        ie_code: selectedExporter.ie_code,
        pan_number: selectedExporter.pan_number,
        gstin_number: selectedExporter.gstin_number,
        state_code: selectedExporter.state_code,
        invoice_number: selectedExporter.invoice_number,
        authorized_name: selectedExporter.authorized_name,
        authorized_designation: selectedExporter.authorized_designation,
        contact_number: selectedExporter.contact_number,
        company_prefix: selectedExporter.company_prefix,
        last_invoice_number: selectedExporter.last_invoice_number,
        invoice_year: selectedExporter.invoice_year,
      });
    }
  }, [selectedExporter, isEditExporterDialogOpen]);

  // Reset form data when closing dialogs
  const resetFormData = () => {
    setFormData({
      id: "",
      company_name: "",
      company_address: "",
      email: "",
      tax_id: "",
      ie_code: "",
      pan_number: "",
      gstin_number: "",
      state_code: "",
      invoice_number: "",
      authorized_name: "",
      authorized_designation: "",
      contact_number: "",
    });
  };

  // ------------------------start exporter --------------------------------
  const handleAddExporter = async () => {
    const createExporter = async (data) => {
      try {
        setIsLoading(true);
      // Check if there's a valid exporter id
      let header = data.letterhead_top_image;
      let footer = data.letterhead_bottom_image;
      let signature = data.stamp_image;
      
      delete data.id;
      delete data.invoice_number;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.letterhead_top_image;
      delete data.letterhead_bottom_image;
      delete data.stamp_image;
      
      const response = await api.post(`/exporter`, data);
      const exporterData = response.data.data;
      
      // add promise for 3 api post call for header, footer and signature with responses
      
      if (header?.file) {
        const headerFormData = new FormData();
        headerFormData.append("image", header.file);
        await api.post(`/upload/header/${exporterData.id}`, headerFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      
      if (footer?.file) {
        const footerFormData = new FormData();
        footerFormData.append("image", footer.file);
        await api.post(`/upload/footer/${exporterData.id}`, footerFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      
      if (signature?.file) {
        const signatureFormData = new FormData();
        signatureFormData.append("image", signature.file);
        await api.post(
          `/upload/signature/${exporterData.id}`,
          signatureFormData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }
      
      // Exporter data received - handled silently
      
      return exporterData;
    } catch (error) {
      console.log(error);
      
        if (error.status == 500) {
          // Failed to add exporter details - handled silently
        }
        return error.response;
      }finally {
        setIsLoading(false);
      }
    };
    // Validate required fields

    const newExporter = await createExporter(formData);
    if (newExporter.status == 400) {
      toast({
        title: "Error",
        description: newExporter.data.message,
        variant: "destructive",
      });
      return;
    }

    // Add to exporters array
    setExporters([...exporters, newExporter]);
    setIsAddExporterDialogOpen(false);
    resetFormData();

    toast({
      title: "Success",
      description: "Exporter added successfully",
    });
  };

  const handleEditExporter = async () => {
    const updateExporterDetails = async (id, data) => {
      try {
        let header = data.letterhead_top_image;
        let footer = data.letterhead_bottom_image;
        let signature = data.stamp_image;
        // Check if there's a valid exporter id
        const response = await api.put(`/exporter/${id}`, data);
        const exporterData = response.data.data;
        if (header?.file) {
          const headerFormData = new FormData();
          headerFormData.append("image", header.file);
          let headRes = await api.post(
            `/upload/header/${exporterData.id}`,
            headerFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          // Header image upload response - handled silently
        }

        if (footer?.file) {
          const footerFormData = new FormData();
          footerFormData.append("image", footer.file);
          let footRes = await api.post(
            `/upload/footer/${exporterData.id}`,
            footerFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          // Footer image upload response - handled silently
        }

        if (signature?.file) {
          const signatureFormData = new FormData();
          signatureFormData.append("image", signature.file);
          let sigRes = await api.post(
            `/upload/signature/${exporterData.id}`,
            signatureFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          // Signature image upload response - handled silently
        }
        // setExporters(exporterData);
      } catch (error) {
        // Failed to update exporter details - handled silently
      }
    };
    if (!selectedExporter) return;
    updateExporterDetails(formData.id, formData);

    // Update the exporter
    const updatedExporters = exporters.map((exporter) => {
      if (exporter.id === selectedExporter.id) {
        return {
          ...exporter,
          ...formData,
          updatedAt: new Date().toISOString().split("T")[0],
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

  const handleDeleteExporter = async () => {
    async function deleteExporter(id) {
      try {
        let res = await api.delete(`/exporter/${id}`);
        console.log(res.data);
      } catch (error) {
        console.log(error);
        return error.response.data;
      }
    }
    if (!exporterToDelete) return;
    let res = await deleteExporter(exporterToDelete);
    if (res.status == "error") {
      toast({
        title: res.status,
        description: res.message,
      });
    }

    // Filter out the exporter to delete
    const updatedExporters = exporters.filter(
      (exporter) => exporter.id !== exporterToDelete
    );
    setExporters(updatedExporters);
    setIsDeleteDialogOpen(false);
    setExporterToDelete(null);

    toast({
      title: "Success",
      description: "Exporter deleted successfully",
    });
  };
  // ------------------------finish exporter --------------------------------
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

  // ------------------------start shipping --------------------------------

  const handleAddShippingValue =async () => {
    try {
    setIsLoading(true);
      const addShipping = async (category, value) => {
      try {
        let res = await api.post("/dropdown-options", {
          category: category,
          value: value,
        });
        console.log(res.data.data);

        return res.data.data;
      } catch (error) {
        return error.response;
      }
    };
    if (!editingCategory || !newValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a value",
        variant: "destructive",
      });
      return;
    }
    

    let shipping_res = await addShipping(editingCategory, newValue);

    if (shipping_res.status == 400) {
    toast({
      title: "Error",
      description: shipping_res?.data.error || "Failed to add shipping detail",
      variant: "destructive",
    });
    return;
  }

    setShippingDetails((prev) => {
      const updated = [...prev ];
      updated.push({
        id: shipping_res.id, // Generate a random ID
        category: shipping_res.category,
        value: shipping_res.value,
      })
      
        return updated;
      }
  );
    


    setNewValue("");
    setIsAddValueDialogOpen(false);
    setEditingCategory(null);

    toast({
      title: "Success",
      description: "Value added successfully",
    });
    } catch (error) {
      console.log(error);
      
    }finally {
      setIsLoading(false);
    }
    
  };

  const handleEditShippingValue = () => {
    if (
      !editingCategory ||
      !editingItemValue.trim() ||
      editingItemIndex === null
    ) {
      toast({
        title: "Error",
        description: "Please enter a value",
        variant: "destructive",
      });
      return;
    }

    setEditingItemValue("");
    setIsEditValueDialogOpen(false);
    setEditingCategory(null);
    setEditingItemIndex(null);

    toast({
      title: "Success",
      description: "Value updated successfully",
    });
  };

  const handleDeleteShippingValue = (category: string, index: string) => {
    const deleteShippingValues = async (id) => {
      try {
        let res = await api.delete(`/dropdown-options/${id}`);
        if (res.status == 204) {
          return { status: "success", message: "Delete successfully" };
        }
        setShippingDetails(res.data);
      } catch (error) {
        toast({
          title: "Delete",
          description: "Value deleted successfully",
        });
        return error.response.data;
      }
    };
    let error = deleteShippingValues(index);

    toast({
      title: "Success",
      description: "Value deleted successfully",
    });
  };

  // ------------------------finish shipping --------------------------------
  const openEditValueDialog = (category: string, value: string) => {
    setEditingCategory(()=>category);
    // setEditingItemIndex(index);
    setEditingItemValue(()=>value);
    setIsEditValueDialogOpen(true);
  };

  const openAddValueDialog = (category: string) => {
    setEditingCategory(category);
    setNewValue("");
    setIsAddValueDialogOpen(true);
  };

  // ------------------------start table information --------------------------------
  const handleAddDescHsnPair = async () => {
    try {
    setIsLoading(true);
    if (!newDescHsnPair.description.trim() || !newDescHsnPair.hsn_code.trim()) {
      toast({
        title: "Error",
        description: "Both Description and HSN Code are required",
        variant: "destructive",
      });
      return;
    }

      const response = await api.post("/product-category", newDescHsnPair);
      console.log(response);

      if (response.data && response.status === 201) {
        setTableInfo((prev) => ({
          ...prev,
          descriptionHsnPairs: [
            ...prev.descriptionHsnPairs,
            {
              id: response.data.data.id,
              description: response.data.data.description,
              hsn_code: response.data.data.hsn_code,
            },
          ],
        }));

        setNewDescHsnPair({ description: response.data.data.description, hsn_code: response.data.data.hsn_code });
        setIsAddDescHsnDialogOpen(false);

        toast({
          title: "Success",
          description: "Description and HSN Code pair added successfully",
        });
      } else {
        throw new Error("Failed to add product category");
      }
    } catch (error) {
      console.error("Error adding product category:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to add product category. Please try again.",
        variant: "destructive",
      });
    }finally{
      setIsLoading(false);
    }
  };

  const handleEditDescHsnPair = async () => {
    if (
      !editingItemId ||
      !newDescHsnPair.description.trim() ||
      !newDescHsnPair.hsn_code.trim()
    ) {
      toast({
        title: "Error",
        description: "Both Description and HSN Code are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.put(
        `/product-category/${editingItemId}`,
        newDescHsnPair
      );
      console.log(response);

      if (response.data && response.status === 200) {
        setTableInfo((prev) => ({
          ...prev,
          descriptionHsnPairs: prev.descriptionHsnPairs.map((pair) =>
            pair.id === editingItemId
              ? {
                  id: response.data.data.id,
                  description: response.data.data.description,
                  hsn_code: response.data.data.hsn_code,
                }
              : pair
          ),
        }));

        setNewDescHsnPair({ description: "", hsn_code: "" });
        setIsEditDescHsnDialogOpen(false);
        setEditingItemId(null);

        toast({
          title: "Success",
          description: "Description and HSN Code pair updated successfully",
        });
      } else {
        throw new Error("Failed to update product category");
      }
    } catch (error) {
      console.error("Error updating product category:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update product category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDescHsnPair = async (id: string) => {
    try {
      const response = await api.delete(`/product-category/${id}`);
      console.log(response);

      if (response.status === 200) {
        setTableInfo((prev) => ({
          ...prev,
          descriptionHsnPairs: prev.descriptionHsnPairs.filter(
            (pair) => pair.id !== id
          ),
        }));

        toast({
          title: "Success",
          description: "Description and HSN Code pair deleted successfully",
        });
      } else {
        throw new Error("Failed to delete product category");
      }
    } catch (error) {
      console.error("Error deleting product category:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to delete product category. Please try again.",
        variant: "destructive",
      });
    }
  };

  // ------------------------finish table information --------------------------------
  // ------------------------start size and sqm --------------------------------
  const handleAddSizeSqmPair = async () => {
    try {
    setIsLoading(true);
    if (!newSizeSqmPair.size.trim() || !newSizeSqmPair.sqm.trim()) {
      toast({
        title: "Error",
        description: "Both Size and SQM are required",
        variant: "destructive",
      });
      return;
    }

      const response = await api.post("/product-size", newSizeSqmPair);

      if (response.data && response.status === 201) {
        setTableInfo((prev) => ({
          ...prev,
          sizeSqmPairs: [
            ...prev.sizeSqmPairs,
            {
              id: response.data.id,
              size: response.data.size,
              sqm: response.data.sqm,
            },
          ],
        }));

        setNewSizeSqmPair({ size: "", sqm: "" });
        setIsAddSizeSqmDialogOpen(false);

        toast({
          title: "Success",
          description: "Size and SQM pair added successfully",
        });
      } else {
        throw new Error("Failed to add size and SQM pair");
      }
    } catch (error) {
      console.error("Error adding size and SQM pair:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to add size and SQM pair. Please try again.",
        variant: "destructive",
      });
    }finally{
      setIsLoading(false);
    }
  };

  const handleEditSizeSqmPair = async () => {
    if (!editingItemId || !newSizeSqmPair.size.trim()) {
      toast({
        title: "Error",
        description: "Both Size and SQM are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.put(
        `/product-size/${editingItemId}`,
        newSizeSqmPair
      );
      console.log(response);
      if (response.data && response.status === 200) {
        setTableInfo((prev) => ({
          ...prev,
          sizeSqmPairs: prev.sizeSqmPairs.map((pair) =>
            pair.id === editingItemId
              ? {
                  id: response.data.id,
                  size: response.data.size,
                  sqm: response.data.sqm,
                }
              : pair
          ),
        }));

        setNewSizeSqmPair({ size: "", sqm: "" });
        setIsEditSizeSqmDialogOpen(false);
        setEditingItemId(null);

        toast({
          title: "Success",
          description: "Size and SQM pair updated successfully",
        });
      } else {
        throw new Error("Failed to update size and SQM pair");
      }
    } catch (error) {
      console.error("Error updating size and SQM pair:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update size and SQM pair. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSizeSqmPair = async (id: string) => {
    try {
      const response = await api.delete(`/product-size/${id}`);

      if (response.status === 200) {
        setTableInfo((prev) => ({
          ...prev,
          sizeSqmPairs: prev.sizeSqmPairs.filter((pair) => pair.id !== id),
        }));

        toast({
          title: "Success",
          description: "Size and SQM pair deleted successfully",
        });
      } else {
        throw new Error("Failed to delete size and SQM pair");
      }
    } catch (error) {
      console.error("Error deleting size and SQM pair:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to delete size and SQM pair. Please try again.",
        variant: "destructive",
      });
    }
  };
  // ------------------------finish size and sqm --------------------------------
  // ------------------------start unit type --------------------------------
  const handleAddUnitType = async () => {
    try {
    setIsLoading(true);
    if (!newUnitType.trim()) {
      toast({
        title: "Error",
        description: "Unit Type is required",
        variant: "destructive",
      });
      return;
    }

      const response = await api.post("/dropdown-options", {
        category: "unit_type",
        value: newUnitType,
      });
      console.log(response);

      if (response.status == 201) {
        setTableInfo((prev) => ({
          ...prev,
          unitTypes: [
            ...prev.unitTypes,
            {
              id: response.data.data.id,
              value: newUnitType,
            },
          ],
        }));

        setNewUnitType("");
        setIsAddUnitTypeDialogOpen(false);

        toast({
          title: "Success",
          description: "Unit Type added successfully",
        });
      } else {
        throw new Error("Failed to add unit type");
      }
    } catch (error) {
      console.error("Error adding unit type:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to add unit type. Please try again.",
        variant: "destructive",
      });
    }finally{
      setIsLoading(false);
    }
  };

  const handleEditUnitType = async () => {
    if (editingUnitTypeIndex === null || !editingUnitTypeValue.trim()) {
      toast({
        title: "Error",
        description: "Unit Type is required",
        variant: "destructive",
      });
      return;
    }

    const unitTypeToEdit = tableInfo.unitTypes[editingUnitTypeIndex];
    if (!unitTypeToEdit) {
      toast({
        title: "Error",
        description: "Unit Type not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.put(`/dropdown-options/${unitTypeToEdit.id}`, {
        category: "unit_type",
        value: editingUnitTypeValue,
      });

      if (response.data && response.status === 200) {
        setTableInfo((prev) => {
          const newUnitTypes = [...prev.unitTypes];
          newUnitTypes[editingUnitTypeIndex] = {
            id: unitTypeToEdit.id,
            value: editingUnitTypeValue,
          };
          return {
            ...prev,
            unitTypes: newUnitTypes,
          };
        });

        setEditingUnitTypeValue("");
        setIsEditUnitTypeDialogOpen(false);
        setEditingUnitTypeIndex(null);

        toast({
          title: "Success",
          description: "Unit Type updated successfully",
        });
      } else {
        throw new Error("Failed to update unit type");
      }
    } catch (error) {
      console.error("Error updating unit type:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update unit type. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnitType = async (id: string) => {
    const unitTypeToDelete = tableInfo.unitTypes.find((type) => type.id === id);
    if (!unitTypeToDelete) {
      toast({
        title: "Error",
        description: "Unit Type not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.delete(`/dropdown-options/${id}`);

      if (response.status === 200) {
        setTableInfo((prev) => ({
          ...prev,
          unitTypes: prev.unitTypes.filter((type) => type.id !== id),
        }));

        toast({
          title: "Success",
          description: "Unit Type deleted successfully",
        });
      } else {
        throw new Error("Failed to delete unit type");
      }
    } catch (error) {
      console.error("Error deleting unit type:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to delete unit type. Please try again.",
        variant: "destructive",
      });
    }
  };
  // ------------------------finish unit type --------------------------------
  const openEditDescHsnDialog = (
    id: string,
    description: string,
    hsn_code: string
  ) => {
    setEditingItemId(id);
    setNewDescHsnPair({ description, hsn_code });
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

  const handleAddSupplier = async () => {
    try {
    setIsLoading(true);
    if (
      !supplierFormData.name.trim() ||
      !supplierFormData.gstin_number.trim()
    ) {
      toast({
        title: "Error",
        description: "Name and GSTIN No. are required",
        variant: "destructive",
      });
      return;
    }

      const response = await api.post("/supplier", supplierFormData);

      if (response.data && response.status === 201) {
        setSuppliers([...suppliers, response.data]);
        setIsAddSupplierDialogOpen(false);
        setSupplierFormData({
          name: "",
          gstin_number: "",
          address: "",
          permission: "",
        });

        toast({
          title: "Success",
          description: "Supplier added successfully",
        });
      } else {
        throw new Error("Failed to add supplier");
      }
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to add supplier. Please try again.",
        variant: "destructive",
      });
    }finally{
      setIsLoading(false);
    }
  };

  const handleEditSupplier = async () => {
    setIsLoading(true);
    if (
      !selectedSupplier ||
      !supplierFormData.name.trim() ||
      !supplierFormData.gstin_number.trim()
    ) {
      toast({
        title: "Error",
        description: "Name and GSTIN No. are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.put(
        `/supplier/${selectedSupplier.id}`,
        supplierFormData
      );

      if (response.data && response.status === 200) {
        setSuppliers(
          suppliers.map((supplier) =>
            supplier.id === selectedSupplier.id
              ? { ...supplier, ...response.data }
              : supplier
          )
        );

        setIsEditSupplierDialogOpen(false);
        setSelectedSupplier(null);
        setSupplierFormData({
          name: "",
          gstin_number: "",
          address: "",
          permission: "",
        });

        toast({
          title: "Success",
          description: "Supplier updated successfully",
        });
      } else {
        throw new Error("Failed to update supplier");
      }
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update supplier. Please try again.",
        variant: "destructive",
      });
    }finally{
      setIsLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      const response = await api.delete(`/supplier/${id}`);

      if (response.status === 204) {
        setSuppliers(suppliers.filter((supplier) => supplier.id !== id));

        toast({
          title: "Success",
          description: "Supplier deleted successfully",
        });
      } else {
        throw new Error("Failed to delete supplier");
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to delete supplier. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditSupplierDialog = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      gstin_number: supplier.gstin_number,
      address: supplier.address,
      permission: supplier.permission,
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
                  <TableCell className="font-medium">
                    {exporter.company_name}
                  </TableCell>
                  <TableCell>{exporter.email}</TableCell>
                  <TableCell>{exporter.ie_code}</TableCell>
                  <TableCell>{exporter.gstin_number}</TableCell>
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
        <h3 className="font-bold text-lg mb-4 uppercase text-amber-900">
          SHIPPING DETAILS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Place of Receipt */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="placeOfReceipt"
                className="text-sm font-medium uppercase"
              >
                PLACE OF RECEIPT
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAddValueDialog("place_of_receipt")}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-white border rounded-md h-40 overflow-y-auto">
              {shippingDetails
                .filter((val, idx) => {
                  return val.category == "place_of_receipt";
                })
                .map((item) => (
                  <div
                    key={`place_of_receipt-${item.id}`}
                    className="flex justify-between items-center p-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <span className="truncate">{item.value}</span>
                    <div className="flex space-x-1 ml-2 shrink-0">
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openEditValueDialog("place_of_receipt", item.value)
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                      </Button> */}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteShippingValue("place_of_receipt", item.id)
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Trash className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              {shippingDetails.filter((val, idx) => {
                return val.category == "place_of_receipt";
              }).length === 0 && (
                <div className="p-2 text-gray-500 text-center">
                  No places of receipt added
                </div>
              )}
            </div>
          </div>

          {/* Port of Loading */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="portOfLoading"
                className="text-sm font-medium uppercase"
              >
                PORT OF LOADING
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAddValueDialog("port_of_loading")}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-white border rounded-md h-40 overflow-y-auto">
              {shippingDetails
                .filter((val, idx) => {
                  return val.category == "port_of_loading";
                })
                .map((port) => (
                  <div
                    key={`port_of_loading-${port.id}`}
                    className="flex justify-between items-center p-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <span className="truncate">{port.value}</span>
                    <div className="flex space-x-1 ml-2 shrink-0">
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openEditValueDialog("port_of_loading", port.value)
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                      </Button> */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteShippingValue("port_of_loading", port.id)
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Trash className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              {shippingDetails.filter((val, idx) => {
                return val.category == "port_of_loading";
              }).length === 0 && (
                <div className="p-2 text-gray-500 text-center">
                  No ports of loading added
                </div>
              )}
            </div>
          </div>

          {/* Port of Discharge */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="portOfDischarge"
                className="text-sm font-medium uppercase"
              >
                PORT OF DISCHARGE
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAddValueDialog("port_of_discharge")}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-white border rounded-md h-40 overflow-y-auto">
              {shippingDetails
                .filter((val, idx) => {
                  return val.category == "port_of_discharge";
                })
                .map((port) => (
                  <div
                    key={`port_of_discharge-${port.id}`}
                    className="flex justify-between items-center p-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <span className="truncate">{port.value}</span>
                    <div className="flex space-x-1 ml-2 shrink-0">
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openEditValueDialog("port_of_discharge", port.value)
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                      </Button> */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteShippingValue(
                            "port_of_discharge",
                            port.id
                          )
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Trash className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              {shippingDetails.filter((val, idx) => {
                return val.category == "port_of_discharge";
              }).length === 0 && (
                <div className="p-2 text-gray-500 text-center">
                  No ports of discharge added
                </div>
              )}
            </div>
          </div>

          {/* Final Destination */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="finalDestination"
                className="text-sm font-medium uppercase"
              >
                FINAL DESTINATION
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAddValueDialog("final_destination")}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-white border rounded-md h-40 overflow-y-auto">
              {shippingDetails
                .filter((val, idx) => {
                  return val.category == "final_destination";
                })
                .map((destination) => (
                  <div
                    key={`final_destination-${destination.id}`}
                    className="flex justify-between items-center p-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <span className="truncate">{destination.value}</span>
                    <div className="flex space-x-1 ml-2 shrink-0">
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openEditValueDialog(
                            "final_destination",
                            destination.value
                          )
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-amber-600" />
                      </Button> */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteShippingValue(
                            "final_destination",
                            destination.id
                          )
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Trash className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              {shippingDetails.filter((val, idx) => {
                return val.category == "final_destination";
              }).length === 0 && (
                <div className="p-2 text-gray-500 text-center">
                  No final destinations added
                </div>
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
        <h3 className="font-bold text-lg mb-4 uppercase text-green-900">
          TABLE INFORMATION
        </h3>

        {/* Description and HSN Code Pair */}
        <div className="mb-8 bg-white p-4 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-base">Description & HSN Code</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewDescHsnPair({ description: "", hsn_code: "" });
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
                  <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    Description
                  </th>
                  <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    HSN Code
                  </th>
                  <th className="py-2 pr-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableInfo.descriptionHsnPairs
                  .map((p) => p.description)
                  .map((desc) => {
                    const pair = tableInfo.descriptionHsnPairs.find(
                      (p) => p.description === desc
                    );
                    if (!pair) return null;

                    return (
                      <tr key={pair.id} className="hover:bg-gray-50">
                        <td
                          className="py-2 pl-3 text-md truncate"
                          title={pair.description}
                        >
                          <div className="truncate">{pair.description}</div>
                        </td>
                        <td
                          className="py-2 pl-3 text-md text-gray-500 truncate"
                          title={pair.hsn_code}
                        >
                          <div className="truncate">{pair.hsn_code}</div>
                        </td>
                        <td className="py-2 pr-2 text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openEditDescHsnDialog(
                                  pair.id,
                                  pair.description,
                                  pair.hsn_code
                                )
                              }
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
                  <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    Size
                  </th>
                  <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    SQM
                  </th>
                  <th className="py-2 pr-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableInfo.sizeSqmPairs
                  .map((p) => p.size)
                  .map((size) => {
                    const pair = tableInfo.sizeSqmPairs.find(
                      (p) => p.size === size
                    );
                    if (!pair) return null;

                    return (
                      <tr key={pair.id} className="hover:bg-gray-50">
                        <td
                          className="py-2 pl-3 text-md truncate"
                          title={pair.size}
                        >
                          <div className="truncate">{pair.size}</div>
                        </td>
                        <td
                          className="py-2 pl-3 text-md text-gray-500 truncate"
                          title={pair.sqm}
                        >
                          <div className="truncate">{pair.sqm}</div>
                        </td>
                        <td className="py-2 pr-2 text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openEditSizeSqmDialog(
                                  pair.id,
                                  pair.size,
                                  pair.sqm
                                )
                              }
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
                  <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full">
                    Unit Type
                  </th>
                  <th className="py-2 pr-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableInfo.unitTypes.map((type, index) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td
                      className="py-2 pl-3 text-md truncate"
                      title={type.value}
                    >
                      <div className="truncate">{type.value}</div>
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openEditUnitTypeDialog(
                              tableInfo.unitTypes.indexOf(type),
                              type.value
                            )
                          }
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUnitType(type.id)}
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
              gstin_number: "",
              address: "",
              permission: "",
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
        <h3 className="font-bold text-lg mb-4 uppercase text-purple-900">
          SUPPLIER DETAILS
        </h3>

        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-full border rounded-md">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Name
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      GSTIN No.
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                      Address
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      S.S. Permission No.
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div
                          className="truncate max-w-[150px]"
                          title={supplier.name}
                        >
                          {supplier.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className="truncate max-w-[150px]"
                          title={supplier.gstin_number}
                        >
                          {supplier.gstin_number}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className="truncate max-w-[300px]"
                          title={supplier.address}
                        >
                          {supplier.address}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className="truncate max-w-[200px]"
                          title={supplier.permission}
                        >
                          {supplier.permission}
                        </div>
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
                      <td
                        colSpan={5}
                        className="text-center py-6 text-gray-500"
                      >
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
      <Dialog
        open={isAddSupplierDialogOpen}
        onOpenChange={setIsAddSupplierDialogOpen}
      >
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
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Enter supplier name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gstin">GSTIN No. *</Label>
              <Input
                id="gstin_number"
                value={supplierFormData.gstin_number}
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    gstin_number: e.target.value,
                  })
                }
                placeholder="e.g., 24ABCDE1234F1Z5"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={supplierFormData.address}
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    address: e.target.value,
                  })
                }
                placeholder="Enter supplier address"
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="permission">S.S. PERMISSION No.</Label>
              <Textarea
                id="permission"
                value={supplierFormData.permission}
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    permission: e.target.value,
                  })
                }
                placeholder="e.g., SSP/MRB/2023/1234"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddSupplierDialogOpen(false)}
            >
              Cancel
            </Button>
            <LoadingButton
            isGenerating={isLoading}
            onClick={handleAddSupplier}
              className="bg-purple-600 hover:bg-purple-700">
                Add
            </LoadingButton>
            {/* <Button
              onClick={handleAddSupplier}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Add
            </Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog
        open={isEditSupplierDialogOpen}
        onOpenChange={setIsEditSupplierDialogOpen}
      >
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
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Enter supplier name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-gstin">GSTIN No. *</Label>
              <Input
                id="edit-gstin_number"
                value={supplierFormData.gstin_number}
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    gstin_number: e.target.value,
                  })
                }
                placeholder="e.g., 24ABCDE1234F1Z5"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={supplierFormData.address}
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    address: e.target.value,
                  })
                }
                placeholder="Enter supplier address"
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-permission">S.S. PERMISSION No.</Label>
              <Textarea
                id="edit-permission"
                value={supplierFormData.permission}
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    permission: e.target.value,
                  })
                }
                placeholder="e.g., SSP/MRB/2023/1234"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditSupplierDialogOpen(false);
                setSelectedSupplier(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSupplier}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderARNSection = () => (
    <div className="space-y-6">
      <div className="bg-[#fff9c4] rounded-lg shadow overflow-hidden p-4 border border-[#fff59d]">
        <h3 className="font-bold text-lg mb-6 uppercase text-amber-900">
          ARN & DECLARATION
        </h3>

        <div className="bg-white p-4 rounded-md shadow-sm space-y-6">
          <div>
            <Label
              htmlFor="gstCircular"
              className="text-base font-medium mb-2 block"
            >
              Export Under GST Circular
            </Label>
            <Input
              id="gstCircular"
              className="w-full"
              placeholder="EXPORT UNDER GST CIRCULAR NO. XX/20XX Customs DT.XX/XX/20XX"
              value={arnDeclaration.gstCircular}
              onChange={(e) =>
                handleArnDeclarationChange("gstCircular", e.target.value)
              }
            />
          </div>

          <div>
            <Label
              htmlFor="applicationRefNumber"
              className="text-base font-medium mb-2 block"
            >
              Application Reference Number
            </Label>
            <Input
              id="applicationRefNumber"
              className="w-full"
              placeholder="ACXXXXXXXXXXXXXX"
              value={arnDeclaration.applicationRefNumber}
              onChange={(e) =>
                handleArnDeclarationChange(
                  "applicationRefNumber",
                  e.target.value
                )
              }
            />
          </div>

          <div className="pt-4 flex justify-end">
            {/* <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleSaveArnDeclaration}
            >
              <Save className="h-4 w-4 mr-2" />
              Save ARN & Declaration
            </Button> */}
            <LoadingButton
              isGenerating={isLoading}
              onClick={handleSaveArnDeclaration}
              className="ml-2 bg-amber-600 hover:bg-amber-700">
              <Save className="h-4 w-4 mr-2" />
              Save ARN & Declaration
              </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );

  // Add exporter form fields
  const renderExporterForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="company_name">Exporter Name </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
              placeholder="Company Name"
              required
            />
          </div>

          <div>
            <Label htmlFor="company_address">Company Address</Label>
            <Textarea
              id="company_address"
              value={formData.company_address}
              onChange={(e) =>
                setFormData({ ...formData, company_address: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="e.g., contact@company.com"
            />
          </div>

          <div>
            <Label htmlFor="tax_id">Tax ID</Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) =>
                setFormData({ ...formData, tax_id: e.target.value })
              }
              placeholder="e.g., 24AACF*********"
            />
          </div>

          <div>
            <Label htmlFor="authorized_name">Name of Authorized Official</Label>
            <Input
              id="authorized_name"
              value={formData.authorized_name}
              onChange={(e) =>
                setFormData({ ...formData, authorized_name: e.target.value })
              }
              placeholder="e.g., John Doe"
            />
          </div>

          <div>
            <Label htmlFor="authorized_designation">
              Designation of Authorized Official
            </Label>
            <Input
              id="authorized_designation"
              value={formData.authorized_designation}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  authorized_designation: e.target.value,
                })
              }
              placeholder="e.g., Export Manager"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ie_code">I.E. Code #</Label>
            <Input
              id="ie_code"
              value={formData.ie_code}
              onChange={(e) =>
                setFormData({ ...formData, ie_code: e.target.value })
              }
              placeholder="e.g., 1234567890"
            />
          </div>

          <div>
            <Label htmlFor="pan_number">PAN NO. #</Label>
            <Input
              id="pan_number"
              value={formData.pan_number}
              onChange={(e) =>
                setFormData({ ...formData, pan_number: e.target.value })
              }
              placeholder="Enter PAN number"
            />
          </div>

          <div>
            <Label htmlFor="gstin_number">GSTIN NO. #</Label>
            <Input
              id="gstin_number"
              value={formData.gstin_number}
              onChange={(e) =>
                setFormData({ ...formData, gstin_number: e.target.value })
              }
              placeholder="Enter GSTIN number"
            />
          </div>
          <div>
            <Label htmlFor="contact">Contact number</Label>
            <Input
              id="contact"
              type="text"
              value={formData.contact_number}
              onChange={(e) =>
                setFormData({ ...formData, contact_number: e.target.value })
              }
              placeholder="+91 123456789"
            />
          </div>

          <div>
            <Label htmlFor="state_code">State Code </Label>
            <Input
              id="state_code"
              value={formData.state_code}
              onChange={(e) =>
                setFormData({ ...formData, state_code: e.target.value })
              }
              placeholder="e.g., 24"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <div>
              <Label htmlFor="prefix">Company Prefix</Label>
              <Input
                id="prefix"
                value={formData.company_prefix}
                onChange={(e) =>
                  setFormData({ ...formData, company_prefix: e.target.value })
                }
                placeholder="INV"
                required
              />
            </div>
            <div>
              <Label htmlFor="number">invoice number</Label>
              <Input
                id="number"
                value={formData.last_invoice_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    last_invoice_number: e.target.value,
                  })
                }
                placeholder="0000"
                required
              />
            </div>
            <div>
              <Label htmlFor="year">invoice year</Label>
              <Input
                id="year"
                value={formData.invoice_year}
                onChange={(e) =>
                  setFormData({ ...formData, invoice_year: e.target.value })
                }
                placeholder="2025"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Letterhead Images Section */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Letterhead Images *</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-500 mt-0.5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-blue-700">
              Upload images for letterhead and stamp. These will appear on the
              VGM form. For best results, use the recommended dimensions for
              each image type.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Letterhead Image */}
          <div className="space-y-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <Label
                htmlFor="letterhead_top_image"
                className="text-sm font-semibold text-gray-700"
              >
            <div className="flex items-center justify-between">
                Top Letterhead Image *
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Required
              </span>
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-gray-500">
                Recommended: 1000 × 150 px (PNG, JPG)
              </p>
            </div>
            <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors duration-200 ease-in-out bg-gray-50">
              {formData.letterhead_top_image ? (
                <div className="relative">
                  <img
                    src={formData.letterhead_top_image.preview}
                    alt="Top Letterhead"
                    className="max-h-32 mx-auto object-contain rounded border border-gray-200"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-sm"
                    onClick={() => handleRemoveImage("letterhead_top_image")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-gray-100">
                      <Upload className="h-8 w-8 text-gray-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Drag and drop or click to upload
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Company letterhead for the top of documents
                  </p>
                  <input
                    type="file"
                    id="letterhead_top_image"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={(e) =>
                      handleImageUpload(e, "letterhead_top_image")
                    }
                    />
                </div>
              )}
              
            </div>
              </Label>
          </div>

          {/* Bottom Letterhead Image */}
          <div className="space-y-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <Label
                htmlFor="letterhead_bottom_image"
                className="text-sm font-semibold text-gray-700"
              >
            <div className="flex items-center justify-between">
                Bottom Letterhead Image *
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Required
              </span>
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-gray-500">
                Recommended: 1000 × 150 px (PNG, JPG)
              </p>
            </div>
            <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors duration-200 ease-in-out bg-gray-50">
              {formData.letterhead_bottom_image ? (
                <div className="relative">
                  <img
                    src={formData.letterhead_bottom_image.preview}
                    alt="Bottom Letterhead"
                    className="max-h-32 mx-auto object-contain rounded border border-gray-200"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-sm"
                    onClick={() => handleRemoveImage("letterhead_bottom_image")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-gray-100">
                      <Upload className="h-8 w-8 text-gray-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Drag and drop or click to upload
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Company letterhead for the bottom of documents
                  </p>
                  <input
                    type="file"
                    id="letterhead_bottom_image"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={(e) =>
                      handleImageUpload(e, "letterhead_bottom_image")
                    }
                  />
                </div>
              )}
            </div>
              </Label>
          </div>

          {/* Stamp Image */}
          <div className="space-y-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <Label
                htmlFor="stamp_image"
                className="text-sm font-semibold text-gray-700"
              >
            <div className="flex items-center justify-between">
                Company Stamp Image *
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Required
              </span>
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-gray-500">
                Recommended: 200 × 200 px (PNG with transparency)
              </p>
            </div>
            <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors duration-200 ease-in-out bg-gray-50">
              {formData.stamp_image ? (
                <div className="relative">
                  <img
                    src={formData.stamp_image.preview}
                    alt="Company Stamp"
                    className="max-h-32 mx-auto object-contain rounded border border-gray-200"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-sm"
                    onClick={() => handleRemoveImage("stamp_image")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-gray-100">
                      <Upload className="h-8 w-8 text-gray-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Drag and drop or click to upload
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Official company stamp or signature
                  </p>
                  <input
                    type="file"
                    id="stamp_image"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "stamp_image")}
                  />
                </div>
              )}
            </div>
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage dropdown options for invoice forms
          </p>
        </div>
        <Button onClick={() => navigate("/")} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle>Dropdown Options Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
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
            <TabsContent value="table">{renderTableSection()}</TabsContent>
            <TabsContent value="supplier">
              {renderSupplierSection()}
            </TabsContent>
            <TabsContent value="arn">{renderARNSection()}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Exporter Dialog */}
      <Dialog
        open={isAddExporterDialogOpen}
        onOpenChange={setIsAddExporterDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Exporter</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new exporter.
            </DialogDescription>
          </DialogHeader>
          {renderExporterForm()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddExporterDialogOpen(false);
                resetFormData();
              }}
            >
              Cancel
            </Button>
            {/* <Button onClick={handleAddExporter}>Save Exporter</Button> */}
            <LoadingButton
              isGenerating={isLoading}
              onClick={handleAddExporter}
              className="bg-black "
              >Save Exporter</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Exporter Dialog */}
      <Dialog
        open={isEditExporterDialogOpen}
        onOpenChange={setIsEditExporterDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exporter</DialogTitle>
            <DialogDescription>
              Update the exporter details. 
            </DialogDescription>
          </DialogHeader>
          {renderExporterForm()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditExporterDialogOpen(false);
                setSelectedExporter(null);
                resetFormData();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditExporter}>Update Exporter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Exporter Dialog */}
      <Dialog
        open={isViewExporterDialogOpen}
        onOpenChange={setIsViewExporterDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exporter Details</DialogTitle>
          </DialogHeader>
          {selectedExporter && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    Exporter Name
                  </h3>
                  <p>{selectedExporter.company_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    Company Address
                  </h3>
                  <p className="whitespace-pre-line">
                    {selectedExporter.company_address}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Email</h3>
                  <p>{selectedExporter.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    Tax ID
                  </h3>
                  <p>{selectedExporter.tax_id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    Authorized Name
                  </h3>
                  <p>{selectedExporter.authorized_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    Authorized Designation
                  </h3>
                  <p>{selectedExporter.authorized_designation}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    I.E. Code #
                  </h3>
                  <p>{selectedExporter.ie_code}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    PAN NO. #
                  </h3>
                  <p>{selectedExporter.pan_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    GSTIN NO. #
                  </h3>
                  <p>{selectedExporter.gstin_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    State Code
                  </h3>
                  <p>{selectedExporter.state_code}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    Invoice Number Format
                  </h3>
                  <p>{selectedExporter.next_invoice_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    Contact Number
                  </h3>
                  <p>{selectedExporter.contact_number}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewExporterDialogOpen(false);
                setSelectedExporter(null);
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewExporterDialogOpen(false);
                if (selectedExporter) {
                  openEditDialog(selectedExporter);
                }
              }}
            >
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
              Are you sure you want to delete this exporter? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setExporterToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExporter}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Value Dialog */}
      <Dialog
        open={isAddValueDialogOpen}
        onOpenChange={setIsAddValueDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add New{" "}
              {editingCategory === "place_of_receipt"
                ? "Place of Receipt"
                : editingCategory === "port_of_loading"
                ? "Port of Loading"
                : editingCategory === "port_of_discharge"
                ? "Port of Discharge"
                : "Final Destination"}
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
            <Button
              variant="outline"
              onClick={() => {
                setIsAddValueDialogOpen(false);
                setEditingCategory(null);
                setNewValue("");
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              isGenerating={isLoading}
              onClick={handleAddShippingValue}
              className="bg-black"
              >
                Add
              </LoadingButton>
            {/* <Button onClick={handleAddShippingValue}>Add</Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Value Dialog */}
      <Dialog
        open={isEditValueDialogOpen}
        onOpenChange={setIsEditValueDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit{" "}
              {editingCategory === "place_of_receipt"
                ? "Place of Receipt"
                : editingCategory === "port_of_loading"
                ? "Port of Loading"
                : editingCategory === "port_of_discharge"
                ? "Port of Discharge"
                : "Final Destination"}
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
            <Button
              variant="outline"
              onClick={() => {
                setIsEditValueDialogOpen(false);
                setEditingCategory(null);
                setEditingItemIndex(null);
                setEditingItemValue("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditShippingValue}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Description/HSN Dialog */}
      <Dialog
        open={isAddDescHsnDialogOpen}
        onOpenChange={setIsAddDescHsnDialogOpen}
      >
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
                onChange={(e) =>
                  setNewDescHsnPair({
                    ...newDescHsnPair,
                    description: e.target.value,
                  })
                }
                placeholder="e.g., Glazed porcelain Floor Tiles"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hsn_code">HSN Code</Label>
              <Input
                id="hsn_code"
                value={newDescHsnPair.hsn_code}
                onChange={(e) =>
                  setNewDescHsnPair({
                    ...newDescHsnPair,
                    hsn_code: e.target.value,
                  })
                }
                placeholder="e.g., 69072100"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDescHsnDialogOpen(false)}
            >
              Cancel
            </Button>
            <LoadingButton
              isGenerating={isLoading}
              onClick={handleAddDescHsnPair}
              className="bg-black"
              >Add</LoadingButton>
            {/* <Button onClick={handleAddDescHsnPair}>Add</Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Description/HSN Dialog */}
      <Dialog
        open={isEditDescHsnDialogOpen}
        onOpenChange={setIsEditDescHsnDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Description & HSN Code</DialogTitle>
            <DialogDescription>
              Update the description and HSN code as a pair.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={newDescHsnPair.description}
                onChange={(e) =>
                  setNewDescHsnPair({
                    ...newDescHsnPair,
                    description: e.target.value,
                  })
                }
                placeholder="e.g., Glazed porcelain Floor Tiles"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-hsn_code">HSN Code</Label>
              <Input
                id="edit-hsn_code"
                value={newDescHsnPair.hsn_code}
                onChange={(e) =>
                  setNewDescHsnPair({
                    ...newDescHsnPair,
                    hsn_code: e.target.value,
                  })
                }
                placeholder="e.g., 69072100"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDescHsnDialogOpen(false);
                setEditingItemId(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditDescHsnPair}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Size/SQM Dialog */}
      <Dialog
        open={isAddSizeSqmDialogOpen}
        onOpenChange={setIsAddSizeSqmDialogOpen}
      >
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
                onChange={(e) =>
                  setNewSizeSqmPair({ ...newSizeSqmPair, size: e.target.value })
                }
                placeholder="e.g., 600 X 1200"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sqm">SQM</Label>
              <Input
                id="sqm"
                value={newSizeSqmPair.sqm}
                onChange={(e) =>
                  setNewSizeSqmPair({ ...newSizeSqmPair, sqm: e.target.value })
                }
                placeholder="e.g., 1.44"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddSizeSqmDialogOpen(false)}
            >
              Cancel
            </Button>
            {/* <Button onClick={handleAddSizeSqmPair}>Add</Button> */}
            <LoadingButton
              isGenerating={isLoading}
              onClick={handleAddSizeSqmPair}
              className="bg-black"
              >Add</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Size/SQM Dialog */}
      <Dialog
        open={isEditSizeSqmDialogOpen}
        onOpenChange={setIsEditSizeSqmDialogOpen}
      >
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
                onChange={(e) =>
                  setNewSizeSqmPair({ ...newSizeSqmPair, size: e.target.value })
                }
                placeholder="e.g., 600 X 1200"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-sqm">SQM</Label>
              <Input
                id="edit-sqm"
                value={newSizeSqmPair.sqm}
                onChange={(e) =>
                  setNewSizeSqmPair({ ...newSizeSqmPair, sqm: e.target.value })
                }
                placeholder="e.g., 1.44"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditSizeSqmDialogOpen(false);
                setEditingItemId(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSizeSqmPair}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Unit Type Dialog */}
      <Dialog
        open={isAddUnitTypeDialogOpen}
        onOpenChange={setIsAddUnitTypeDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Unit Type</DialogTitle>
            <DialogDescription>Enter a new unit type.</DialogDescription>
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
            <Button
              variant="outline"
              onClick={() => setIsAddUnitTypeDialogOpen(false)}
            >
              Cancel
            </Button>
            <LoadingButton
              isGenerating={isLoading}
              onClick={handleAddUnitType}
              className="bg-black"
              >Add</LoadingButton>
            
            {/* <Button onClick={handleAddUnitType}>Add</Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Type Dialog */}
      <Dialog
        open={isEditUnitTypeDialogOpen}
        onOpenChange={setIsEditUnitTypeDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Unit Type</DialogTitle>
            <DialogDescription>Update the unit type.</DialogDescription>
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
            <Button
              variant="outline"
              onClick={() => {
                setIsEditUnitTypeDialogOpen(false);
                setEditingUnitTypeIndex(null);
              }}
            >
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

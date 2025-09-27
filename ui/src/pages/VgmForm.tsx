import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

// Add ImportMeta interface to fix the env property error
interface ImportMeta {
  env: Record<string, string>;
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "../context/FormContext";
import api from "@/lib/axios";
import { filesApi, invoiceApi } from "@/services/api";
import {
  getCurrentFormId,
  loadFormSection,
  getValueFromSection,
  saveFormSection,
  collectAllFormDataFromLocalStorage,
} from "@/lib/formDataUtils";
import { generateInvoiceExcel } from "@/lib/excelGenerator";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateInvoigenerateDocxceExcel } from "@/lib/wordGenerator";
import { useForm as rhf, Controller ,useFormContext} from "react-hook-form";
import { useDraftForm } from "@/hooks/useDraftForm";
import ProgressQueue, { ProcessItem } from '@/components/ProcessQueue';
import { useToast } from "@/hooks/use-toast";

// Handle date-fns import with proper TypeScript handling
let format: (date: Date | number, format: string) => string = (date, fmt) =>
  new Date(date).toLocaleDateString();

// Using dynamic import for TypeScript compatibility
const importDateFns = async () => {
  try {
    // Use a type assertion to handle the dynamic import
    // Using a more specific type to avoid module resolution errors
    const dateFns = await import(/* @vite-ignore */ "date-fns" as any);
    return dateFns.format as (date: Date | number, format: string) => string;
  } catch (error) {
    console.error("Error importing date-fns:", error);
    return (date: Date | number, fmt: string) =>
      new Date(date).toLocaleDateString();
  }
};

// Initialize format function
importDateFns().then((formatFn) => {
  format = formatFn;
});







interface VgmFormProps {
  onBack: () => void;
  containerInfo?: {
    containerRows: any[];
    totalPalletCount: string;
  };
  form?:any;
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

interface ExporterWithImages {
  id: string;
  company_name: string;
  company_address: string;
  email: string;
  tax_id: string;
  ie_code: string;
  pan_number: string;
  gstin_number: string;
  state_code: string;
  authorized_name?: string;
  authorized_designation?: string;
  contact_number?: string;
  letterhead_top_image?: string;
  letterhead_bottom_image?: string;
  stamp_image?: string;
}

// Define the VGM form data interface
interface VGMFormData {
  shipperName?: string;
  shipperAddress?: string;
  bookingNumbers?: string[];
  containerNumbers?: string[];
  sealNumbers?: string[];
  tareWeights?: string[];
  cargoWeights?: string[];
  totalWeights?: string[];
  weighingDate?: string;
  weighingLocation?: string;
  weighingMethod?: string;
  authorizedPerson?: string;
  signatureImage?: string;
  shipperRegistration?: string;
  shipperOfficial?: string;
  contactDetails?: string;
  weighingTime?: string;
  containerSize?: string;
  containerNumber?: string;
  selectedExporter?: string;
  selectedShipperName?: string;
  weighbridge_registration?: string;
  verified_gross_mass?: string;
  unit_of_measurement?: string;
  weighing_slip_no?: string;
  type?: string;
  IMDG_class?: string;
  container_size?: string;
  container_number?: string;
  [key: string]: any;
}

// Define FormContext type
interface FormContextType {
  formData: Record<string, any>;
  setVGMData: (data: VGMFormData) => void;
  
  [key: string]: any;
}

// Comment: We're using useState without explicit type annotations to avoid TypeScript errors
// TypeScript will infer the types from the initial values

const VgmForm = ({ onBack, containerInfo, invoiceHeader ,form:fm}: VgmFormProps) => {
  // State for form data
  const { formData, setVGMData } =
  useForm() as FormContextType;
  const { toast } = useToast();
  const methods = useFormContext()
  const { methods:form, isReady,hydrated,draftId,isDraftMode,saveDraft } = useDraftForm({
    formType: 'vgm-form',
    methods,
    isDraftMode: location.pathname.includes("/drafts/"),
  });
  const {
    register,
    watch,
    setValue,
    formState: { errors },
    handleSubmit,
    control,
    getValues
  } = methods;
  
  async function onBack2(){
   if(location.pathname.includes("/drafts/")){
    let res = await saveDraft({ last_page: 'vgm-form' });
     navigate(`/annexure/drafts/${draftId}`)
     return;
   }
   navigate("/annexure")
 }

  const vgnForm = watch();
  let invoiceData = getValues();
  const navigate = useNavigate();

// progress model 
const [isProgressOpen, setIsProgressOpen] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);

  // useEffect(() => {
  //   const subscribe = watch((data) => {
  //     // Save the form data to localStorage whenever it changes
  //     // console.log(data);
     
  //     // console.log(invoiceData?.invoice?.products?.nos === "FCL" ? invoiceData?.invoice?.products?.rightValue : "");
      
  //   });
  //   return () => {
  //     subscribe.unsubscribe();
  //   };
  // }, [watch]);
  // Get current form ID for localStorage
  const currentFormId = invoiceData?.invoice.invoice_number || getCurrentFormId();

  // State for form data
  const [selectedShipper, setSelectedShipper] = useState(null);
  const [letterheadTopImage, setLetterheadTopImage] = useState("");
  const [letterheadBottomImage, setLetterheadBottomImage] = useState("");
  const [stampImage, setStampImage] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [shipperRegistration, setShipperRegistration] = useState("");
  const [shipperOfficial, setShipperOfficial] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [weighingDate, setWeighingDate] = useState(
    format(new Date(), "dd.MM.yyyy")
  );
  const [weighingTime, setWeighingTime] = useState(format(new Date(), "HH:mm"));
  const [containerSize, setContainerSize] = useState("20'");
  const [containerNumber, setContainerNumber] = useState("AS PER ANNEXURE");
  const [shipperName, setShipperName] = useState("");
  const [shipperAddress, setShipperAddress] = useState("");
  const [bookingNumbers, setBookingNumbers] = useState([]);
  const [containerNumbers, setContainerNumbers] = useState([]);
  const [sealNumbers, setSealNumbers] = useState([]);
  const [tareWeights, setTareWeights] = useState([]);
  const [cargoWeights, setCargoWeights] = useState([]);
  const [totalWeights, setTotalWeights] = useState([]);
  const [weighingLocation, setWeighingLocation] = useState("");
  const [weighingMethod, setWeighingMethod] = useState("");
  const [authorizedPerson, setAuthorizedPerson] = useState("");
  const [signatureImage, setSignatureImage] = useState("");
  const [weighBridgeNo, setWeighBridgeNo] = useState("AS PER ANNEXURE");
  const [verifiedGrossMass, setVerifiedGrossMass] = useState("method-1");
  const [unitOfMeasure, setUnitOfMeasure] = useState("KG");
  const [weighingSlipNo, setWeighingSlipNo] = useState("AS PER ANNEXURE");
  const [containerType, setContainerType] = useState("NORMAL");
  const [hazardousClass, setHazardousClass] = useState("NA");
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [exporters, setExporters] = useState([]);
  const [selectedExporter, setSelectedExporter] = useState("");
  const [selectedShipperName, setSelectedShipperName] = useState("");

  // Type definitions for form utility functions
  type LoadFormSectionType = <T>(formId: string, section: string) => T | null;
  type SaveFormSectionType = (
    formId: string,
    section: string,
    data: any
  ) => void;

  // Cast the imported functions to the proper types
  const typedLoadFormSection = loadFormSection as LoadFormSectionType;
  const typedSaveFormSection = saveFormSection as SaveFormSectionType;

  // // Load form data from localStorage on component mount
  // useEffect(() => {
  //   if (currentFormId) {
  //     ensureFormDataFromLocalStorage(currentFormId);

  //     // Load VGM data from localStorage with proper typing
  //     const savedVgmData = typedLoadFormSection<VGMFormData>(
  //       currentFormId,
  //       "vgm"
  //     );
  //     if (savedVgmData) {
  //       setVGMData(savedVgmData);

  //       // Set individual state variables from savedVgmData
  //       setShipperName(savedVgmData.shipperName || "");
  //       setShipperAddress(savedVgmData.shipperAddress || "");
  //       setBookingNumbers(savedVgmData.bookingNumbers || []);
  //       setContainerNumbers(savedVgmData.containerNumbers || []);
  //       setSealNumbers(savedVgmData.sealNumbers || []);
  //       setTareWeights(savedVgmData.tareWeights || []);
  //       setCargoWeights(savedVgmData.cargoWeights || []);
  //       setTotalWeights(savedVgmData.totalWeights || []);
  //       setWeighingDate(
  //          format(new Date(), "dd.MM.yyyy")
  //       );
  //       setWeighingLocation(savedVgmData.weighingLocation || "");
  //       setWeighingMethod(savedVgmData.weighingMethod || "");
  //       setAuthorizedPerson(savedVgmData.authorizedPerson || "");
  //       setSignatureImage(savedVgmData.signatureImage || "");
  //       setShipperRegistration(savedVgmData.shipperRegistration || "");
  //       setShipperOfficial(savedVgmData.shipperOfficial || "");
  //       setContactDetails(savedVgmData.contactDetails || "");
  //       setWeighingTime(
  //         savedVgmData.weighingTime || format(new Date(), "HH:mm")
  //       );
  //       setContainerSize(savedVgmData.containerSize || "20'");
  //       setContainerNumber(savedVgmData.containerNumber || "AS PER ANNEXURE");
  //       setSelectedExporter(savedVgmData.selectedExporter || "");
  //       setSelectedShipperName(savedVgmData.selectedShipperName || "");

  //       // Set additional fields that were previously duplicated
  //       setWeighBridgeNo(
  //         savedVgmData.weighbridge_registration || "AS PER ANNEXURE"
  //       );
  //       setVerifiedGrossMass(savedVgmData.verified_gross_mass || "method-1");
  //       setUnitOfMeasure(savedVgmData.unit_of_measurement || "KG");
  //       setWeighingSlipNo(savedVgmData.weighing_slip_no || "AS PER ANNEXURE");
  //       setContainerType(savedVgmData.type || "NORMAL");
  //       setHazardousClass(savedVgmData.IMDG_class || "NA");
  //     }
  //   }
  // }, [currentFormId, ensureFormDataFromLocalStorage, setVGMData]);

  // Function to save a field to localStorage
  const saveFieldToLocalStorage = (field: string, value: any) => {
    try {
      const savedVgmData =
        typedLoadFormSection<VGMFormData>(currentFormId, "vgm") ||
        ({} as VGMFormData);
      const currentVgmData = {
        ...savedVgmData,
        [field]: value,
      };
      typedSaveFormSection(currentFormId, "vgm", currentVgmData);
      setVGMData(currentVgmData);
    } catch (error) {
      console.error("Error saving field to localStorage:", error);
    }
  };

  async function getExporters() {
    let res = await api.get("/exporter");
    if (res.status !== 200) {
      return "error";
    }
    return res.data.data;
  }

  useEffect(() => {
    async function fetchData() {
      try {
        // Ensure all form data is loaded from localStorage
        // ensureFormDataFromLocalStorage(currentFormId);

        // Fetch exporters from API
        const exporterData = await getExporters();
        if (exporterData !== "error") {
          setExporters(exporterData);
          setAvailableSuppliers(exporterData);

          // Find the selected exporter in the list
          const exporter = exporterData.find(
            (e: any) => e.company_name === selectedExporter
          );
          if (exporter) {
            setSelectedShipper(exporter);
            setSelectedShipperName(exporter.company_name);
          }
        }
      } catch (error) {
        console.error("Error fetching exporters:", error);
      }
    }
    fetchData();
  }, [selectedExporter]);

  // create a function for getting images from api call and convert it into displayable format
  const getImageUrl = (id: string, type: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}/api` ;
    switch (type) {
      case "header":
        return `${baseUrl}/upload/header/${id}`;
        break;
      case "footer":
        return `${baseUrl}/upload/footer/${id}`;
        break;

      case "signature":
        return `${baseUrl}/upload/signature/${id}`;
        break;

      default:
        break;
    }
  };
  
  const applyLetterHeadImages = (exporter)=>{
    // Check if the supplier has letterhead images
    if (exporter) {
      setImagesLoaded(false);

      // Set letterhead top image
      if (exporter.letterhead_top_image) {
        getImageUrl(exporter.id, "header");
        setLetterheadTopImage(() => getImageUrl(exporter.id, "header"));
        setImagesLoaded(true);
      } else {
        setLetterheadTopImage("");
      }

      // Set letterhead bottom image
      if (exporter.letterhead_bottom_image) {
        setLetterheadBottomImage(() =>
          getImageUrl(exporter.id, "footer")
        );
        setImagesLoaded(true);
      } else {
        setLetterheadBottomImage("");
      }

      // Set stamp image
      if (exporter.stamp_image) {
        setStampImage(() => getImageUrl(exporter.id, "signature"));
      } else {
        setStampImage("");
      }
    } else {
      setLetterheadTopImage("");
      setLetterheadBottomImage("");
      setStampImage("");
      setImagesLoaded(false);
    }
  }
  const handleSupplierSelect = (value: string) => {
    const selectedSupplier = availableSuppliers.find(
      (s) => s.company_name === value
    );
    setValue("vgm.ie_code", selectedSupplier?.ie_code || "");
    setValue("vgm.authorized_name", selectedSupplier?.authorized_name || "");
    setValue("vgm.authorized_contact", selectedSupplier?.contact_number || "");
    setValue("vgm.permissible_weight", "AS PER ANNEXURE");
    setValue("vgm.weighing_slip_no", "AS PER ANNEXURE");
    setValue("vgm.dt_weighing", weighingDate);
    setValue("vgm.container_size", invoiceData?.invoice?.products?.nos === "FCL" ?invoiceData?.invoice?.products?.rightValue:invoiceData?.invoice?.products?.nos);
    setValue("vgm.container_number", containerNumber);
    setValue("vgm.shipper_name", selectedSupplier?.company_name || "");
    setValue("vgm.weighbridge_registration", weighBridgeNo);
    setValue("vgm.verified_gross_mass", verifiedGrossMass);
    setValue("vgm.unit_of_measurement", unitOfMeasure);
    setValue("vgm.type", containerType);
    setValue("vgm.IMDG_class", hazardousClass);
    setSelectedShipper(selectedSupplier);

    // Check if the supplier has letterhead images
    applyLetterHeadImages(selectedSupplier);
  
  };
  // Predefined shipper options
  const shippers: { [key: string]: any } = {
    // "ZERIC CERAMICA": {
    //   registration: "I. E. Code #: AA********",
    //   official: "ROHIT KACHADIYA",
    //   contact: "**12******",
    // },
    // "DEMO VITRIFIED PVT LTD": {
    //   registration: "I. E. Code #: BB********",
    //   official: "JOHN DOE",
    //   contact: "**13******",
    // },
  };

  let containerData = invoiceData.invoice.products.containers || [];
  useEffect(() => {
    // Initialize with containerInfo data if available
    if (invoiceData?.invoice.exporter) {
      // register("vgm.supplier_name",invoiceData.invoice.exporter.company_name)
      // handleShipperSelect(invoiceData.invoice.exporter);
      handleSupplierSelect(invoiceData.invoice.exporter.company_name);
      // applyLetterHeadImages(invoiceData.invoice.exporter);
    }
    if (containerData) {
      // Default shipper to the one from invoice header
      // handleSupplierSelect(invoiceData?.vgm?.shipper_name);

      // Initialize booking numbers and tare weights arrays
      const newBookingNumbers = containerData.map(() => "");
      const newTareWeights = containerData.map(() => "");

      setBookingNumbers(newBookingNumbers);
      setTareWeights(newTareWeights);
    }
  }, [containerData,invoiceData]);

  const handleShipperSelect = (shipper: string) => {
    setSelectedShipper(shipper);

    // Auto-fill related fields based on selected shipper
    if (shipper in shippers) {
      const shipperInfo = shippers[shipper];
      setShipperRegistration(shipperInfo.registration);
      setShipperOfficial(shipperInfo.official);
      setContactDetails(shipperInfo.contact);

      // Save to localStorage
      saveFieldToLocalStorage("shipper_name", shipper);
      saveFieldToLocalStorage("shipperRegistration", shipperInfo.registration);
      saveFieldToLocalStorage("shipperOfficial", shipperInfo.official);
      saveFieldToLocalStorage("contactDetails", shipperInfo.contact);
    }
  };

  const handleBookingNumberChange = (index: number, value: string) => {
    const newBookingNumbers = [...bookingNumbers];
    newBookingNumbers[index] = value;
    setBookingNumbers(newBookingNumbers);

    // Save to localStorage
    saveFieldToLocalStorage("bookingNumbers", newBookingNumbers);
  };

  const handleTareWeightChange = (index: number, value: string) => {
    const newTareWeights = [...tareWeights];
    newTareWeights[index] = value;
    setTareWeights(newTareWeights);

    // Save to localStorage
    saveFieldToLocalStorage("tareWeights", newTareWeights);
  };
  const handleProcessUpdate = (id: string, status: ProcessItem['status']) => {
    setProcesses(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
  };
  const updateProcess = (id: string, status: ProcessItem["status"]) => {
  setProcesses((prev) =>
    prev.map((p) => (p.id === id ? { ...p, status } : p))
  );
  
};
  const handleFiles = async (data: any) => {
  try {
    // Generate Excel and Docx
    const { allBuffers: excelBlobs, fileName: excelFileName } = await generateInvoiceExcel(data);
    const docxFile = await generateInvoigenerateDocxceExcel(data);

    let resDoc = await filesApi.uploadDoc(docxFile, data.invoice_number);
    // if (resDoc) {
    //   console.log("Document uploaded successfully:", resDoc);
    // }
    // Create process list for queue
    const newProcesses: ProcessItem[] = excelBlobs.map((file: any, index: number) => ({
      id: `${index + 1}`,
      title: `${file.fileName || 'Excel file'} Upload`,
      status: 'pending',
      description: `Uploading ${file.fileName || 'Excel file'}`
    }));

    setProcesses(()=>newProcesses);
    setIsProgressOpen(true);

    const results: any[] = [];
    
    
    for (let i = 0; i < excelBlobs.length; i++) {
      const id = `${i + 1}`;
      const { buffer, fileName } = excelBlobs[i];
      // Set process to running
       handleProcessUpdate(`${i+1}`, "running");
      
       try {
        const response = await filesApi.uploadAndDownloadPdf({buffer, fileName}, data.invoice_number,data.payment_term,excelFileName);

        // 👇 Mark as completed
        handleProcessUpdate(`${i+1}`, "completed");
      } catch (err) {
        // 👇 Mark as failed
        handleProcessUpdate(`${i+1}`, "failed");
        console.error(`${fileName} upload failed:`, err);
      }
    }

    
    toast({
      title: "Upload Complete",
      description: "All files have been successfully uploaded.",
      variant: "success",
    });
    // console.log("Upload results:", results);
  } catch (error) {
    console.error("Error generating or uploading files:", error);
    
    toast({
      title: "Error",
      description: "An error occurred while processing the files" + error.message,
      variant: "destructive",
    });
  }
};

useEffect(() => {
  if(!hydrated) return 
  if(isDraftMode){
    let selectManufacture = getValues("vgm.shipper_name")
    handleSupplierSelect(selectManufacture)
    // handleShipperSelect(selectManufacture)
    // console.log("hahah");
    
  }
}, [hydrated,isDraftMode]);

const handleSave = async (data) => {
  setIsSubmitting(true); // Start loading
  try {
    localStorage.setItem("taxDialogBox", "false");
    
    // Send the data to the PHP backend API
    
    let hmmData = getValues()
    console.log(hmmData);
    const response = await invoiceApi.generate(hmmData);
    // console.log(response.data);
    const actualData = await invoiceApi.getSpecific(response.data.id);
    // console.log(actualData.data);

    if (
      response.status === 200 ||
      (response.status === 201 && actualData.status === 200)
    ) {
      let draftResponse = await api.put(`/draft/${draftId}`,{
        data:JSON.stringify(hmmData),
        is_submitted:1
      })
      // console.log(draftResponse.data);
      
      await handleFiles(actualData.data);
      // Clear localStorage on successful submission
      clearLocalStorage();

      // Show success message
      
      toast({
        title: "Success",
        description: "Form submitted successfully to backend",
        variant: "success",
      });

      // Navigate to the dashboard or success page
      // navigate("/");
    } else {
     
      toast({
        title: "Error",
        description: "Failed to submit form to backend",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    toast({
      title: "Error",
      description: "An error occurred while submitting the form",
      variant: "destructive",
    });
    
  }finally{
    setIsSubmitting(false); // Stop loading
  }
};

 

  // Function to clear localStorage after successful submission
  const clearLocalStorage = () => {
    try {
      // Get the current form ID
      const formId = currentFormId;

      // Remove all form data from localStorage
      localStorage.removeItem(`form_${formId}`);
      localStorage.removeItem(`form_${formId}_invoice`);
      localStorage.removeItem(`form_${formId}_packagingList`);
      localStorage.removeItem(`form_${formId}_annexure`);
      localStorage.removeItem(`form_${formId}_vgm`);
      localStorage.removeItem("current_form_id");

      // Reset the form state in context
      setVGMData(null);
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  };

  // Calculate total VGM (Gross Weight + Tare Weight)
  const calculateTotalVGM = (grossWeight: string, tareWeight: string) => {
    // Clean the input strings to ensure they can be parsed as numbers
    const cleanGross = (grossWeight || "0").replace(/[^0-9.]/g, "");
    const cleanTare = (tareWeight || "0").replace(/[^0-9.]/g, "");

    // Parse the cleaned strings to numbers, defaulting to 0 if NaN
    const gross = parseFloat(cleanGross) || 0;
    const tare = parseFloat(cleanTare) || 0;

    // Calculate the total and format to 2 decimal places
    return (gross + tare).toFixed(2);
  };

  // Set the VGM data in the form context and save to localStorage
  useEffect(() => {
    // Create a comprehensive VGM data object with all required fields
    const vgmData = {
      // Shipper information
      shipper_name: selectedShipper?.company_name || "",
      shipper_address: selectedShipper?.company_address || "",
      ie_code: selectedShipper?.ie_code || "",
      authorized_name: selectedShipper?.authorized_name || authorizedPerson,
      authorized_contact: selectedShipper?.contact_number || contactDetails,

      // Container information
      container_number: containerNumber,
      container_size: containerSize,
      permissible_weight: "AS PER ANNEXURE",

      // Registration and certification
      weighbridge_registration: weighBridgeNo,
      verified_gross_mass: verifiedGrossMass,
      unit_of_measurement: unitOfMeasure,
      dt_weighing: `${weighingDate} ${weighingTime}`,
      weighing_slip_no: weighingSlipNo,
      type: containerType,
      IMDG_class: hazardousClass,

      // Additional fields that need to be saved
      shipperRegistration: shipperRegistration,
      shipperOfficial: shipperOfficial,
      contactDetails: contactDetails,
      weighingDate: weighingDate,
      weighingTime: weighingTime,
      weighingLocation: weighingLocation,
      weighingMethod: weighingMethod,
      authorizedPerson: authorizedPerson,
      signatureImage: signatureImage,
      selectedExporter: selectedExporter,
      selectedShipperName: selectedShipperName,

      // Arrays for container data
      bookingNumbers: bookingNumbers,
      containerNumbers: containerNumbers,
      sealNumbers: sealNumbers,
      tareWeights: tareWeights,
      cargoWeights: cargoWeights,
      totalWeights: totalWeights,

      // Container details mapped from containerInfo
      containers:
        containerData?.map((row, index) => {
          // Get the gross weight from the container row
          const grossWeight = row.gross_weight || "0.00";
          // Get the tare weight from the tareWeights array or use a default
          const tareWeight = tareWeights[index] || "0";
          // Calculate the total VGM using our improved function
          const totalVgm = calculateTotalVGM(grossWeight, tareWeight);

          return {
            booking_no: bookingNumbers[index] || "",
            container_no: row.containerNo || "",
            gross_weight: grossWeight,
            tare_weight: tareWeight,
            total_vgm: totalVgm,
          };
        }) || [],
    };

    // Update form context with the VGM data
    setVGMData(vgmData);

    // Save the complete VGM data to localStorage
    try {
      typedSaveFormSection(currentFormId, "vgm", vgmData);
    } catch (error) {
      console.error("Error saving VGM data to localStorage:", error);
    }
  }, [
    // Dependencies to trigger the update
    selectedShipper,
    shipperRegistration,
    shipperOfficial,
    contactDetails,
    containerNumber,
    containerSize,
    weighBridgeNo,
    verifiedGrossMass,
    unitOfMeasure,
    weighingSlipNo,
    containerType,
    hazardousClass,
    tareWeights,
    weighingDate,
    weighingTime,
    weighingLocation,
    weighingMethod,
    authorizedPerson,
    signatureImage,
    selectedExporter,
    selectedShipperName,
    containerNumbers,
    sealNumbers,
    cargoWeights,
    totalWeights,
    bookingNumbers,
    containerInfo,
    currentFormId,
  ]);
  // Render the form

  return (
    <div className="space-y-6">
      {isProgressOpen?(<ProgressQueue
  isOpen={isProgressOpen}
  onClose={() => setIsProgressOpen(false)}
  onDashboardNavigate={() => {
    setIsProgressOpen(false);
    navigate("/"); // or your custom action
  }}
  processes={processes}
/>):<></>}
      
      {/* Header */}
      <div className="bg-white p-6 shadow-sm border rounded-lg">
        <h1 className="text-3xl font-bold text-center mb-2">VGM</h1>
      </div>

      {/* Letterhead Top Image */}
      {letterheadTopImage ? (
        <div className="w-full flex justify-center">
          <img
            src={letterheadTopImage}
            alt="Letterhead Top"
            className="w-full object-contain max-h-40"
          />
        </div>
      ) : selectedShipper ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Letterhead</AlertTitle>
          <AlertDescription>
            Please add the letterhead top image for{" "}
            {selectedShipper.company_name} through the Admin panel.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            INFORMATION ABOUT VERIFIED GROSS MASS OF CONTAINER
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form fields in numbered format */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">1. Name of the shipper</Label>
                <Controller
                  name="vgm.shipper_name"
                  control={control}
                  defaultValue={selectedShipper?.company_name}
                  render={({ field }) => (
                    <Select
                      value={invoiceData?.vgm?.shipper_name||field.value}
                      onValueChange={(value) => {
                        field.onChange(value); // update RHF form state
                        handleSupplierSelect(value);
                        // console.log(value);
                        
                        // applyLetterHeadImages(value); // your custom logic (e.g., update full supplier object)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSuppliers.map((supplier) => (
                          <SelectItem
                            key={supplier.id}
                            value={supplier.company_name}
                          >
                            {supplier.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium text-red-600">
                  {selectedShipper?.company_name || "Select a shipper"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  2. Shipper Registration /License no.( IEC No/CIN No)**
                </Label>
                <Input
                  value={selectedShipper?.ie_code || ""}
                 
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">
                  {selectedShipper?.ie_code || ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  3. Name and designation of official of the shipper authorized
                </Label>
                <Input
                  value={selectedShipper?.authorized_name || ""}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">
                  {selectedShipper?.authorized_name || ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  4. 24 x 7 contact details of authorised official of shipper
                </Label>
                <Input
                  value={selectedShipper?.contact_number || ""}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">
                  {selectedShipper?.contact_number || ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">5. Container No.</Label>
                <Input
                  value={containerNumber}
                  {...register("vgm.container_number")}
                  onChange={(e) => {
                    setContainerNumber(e.target.value);
                    saveFieldToLocalStorage("container_number", e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">{containerNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  6. Container Size ( TEU/FEU/other)
                </Label>

                {/*AI + Mann no code*/}
                <Controller
                  name="vgm.container_size"
                  control={control}
                  rules={{ required: true }}
                  defaultValue={invoiceData?.invoice?.products?.nos === "FCL" 
                      ? invoiceData?.invoice?.products?.rightValue || ""
                      : ""}
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      value={field.value || invoiceData?.invoice?.products?.nos === "FCL" ? invoiceData?.invoice?.products?.rightValue : ""}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger className={error ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select container size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20'">20'</SelectItem>
                        <SelectItem value="40'">40'</SelectItem>
                        <SelectItem value="20' 40'">20' 40'</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                {/*Harshraj no updated code jema error avi ti 
                    etle a Uncomment no karta */}
                {/* <Controller
                  name="vgm.container_size"
                  control={control}
                  rules={{ required: true }}
                  defaultValue={invoiceData?.invoice?.products?.nos === "FCL" 
                      ? invoiceData?.invoice?.products?.rightValue || ""
                      : ""}
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger className={error ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select container size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20'">20'</SelectItem>
                        <SelectItem value="40'">40'</SelectItem>
                        <SelectItem value="20' 40'">20' 40'</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                /> */}

                {/*A have try karish jovanu che ke ama 
                   Error ave che ke nay em*/}
                  {/* <Controller
                    name="vgm.container_size"
                    control={control}
                    rules={{ required: true }}
                    defaultValue={
                      invoiceData?.invoice?.products?.nos === "FCL"
                        ? invoiceData?.invoice?.products?.rightValue || ""
                        : ""
                    }
                    render={({ field, fieldState: { error } }) => {
                      // Calculate the select value with business logic, but always supply a string.
                      let selectValue = field.value;
                      if (!selectValue) {
                        if (invoiceData?.invoice?.products?.nos === "FCL" && invoiceData?.invoice?.products?.rightValue) {
                          selectValue = invoiceData.invoice.products.rightValue;
                        } else {
                          selectValue = "";
                        }
                      }
                      return (
                        <Select
                          value={selectValue}
                          onValueChange={value => field.onChange(value)}
                        >
                          <SelectTrigger className={error ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select container size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="20'">20'</SelectItem>
                            <SelectItem value="40'">40'</SelectItem>
                            <SelectItem value="20' 40'">20' 40'</SelectItem>
                          </SelectContent>
                        </Select>
                      );
                    }}
                  /> */}


              </div>
              <div className="space-y-2">
                <div className="font-medium">
                {invoiceData?.invoice?.products?.nos === "FCL" 
                      ? invoiceData?.invoice?.products?.rightValue || ""
                      : ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  7. Maximum permissible weight of container as per the CSC
                  plate
                </Label>
                <Input value="AS PER ANNEXURE" onChange={(e) => {}} />
              </div>
              <div className="space-y-2">
                <div className="font-medium">AS PER ANNEXURE</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  8. Weighbridge registration no. & Address of Weighbridge
                </Label>
                <Input
                  value={weighBridgeNo}
                  {...register("vgm.weighbridge_registration")}
                  onChange={(e) => {
                    setWeighBridgeNo(e.target.value);
                    saveFieldToLocalStorage(
                      "weighbridge_registration",
                      e.target.value
                    );
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">{weighBridgeNo}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  9. Verified gross mass of container (method-1/method-2)
                </Label>
                <Controller
                  name="vgm.verified_gross_mass"
                  control={control}
                  rules={{ required: true }}
                  defaultValue="method-1"
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value); // RHF state update
                        saveFieldToLocalStorage("verified_gross_mass", value); // custom local storage logic
                      }}
                    >
                      <SelectTrigger className={error ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="method-1">method-1</SelectItem>
                        <SelectItem value="method-2">method-2</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">
                  {verifiedGrossMass ? vgnForm?.vgm?.verified_gross_mass : ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  10. Unit of measure (KG / MT/ LBS)
                </Label>
                <Controller
                  name="vgm.unit_of_measurement"
                  control={control}
                  rules={{ required: true }}
                  defaultValue="KG"
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      value={field.value||"KG"}
                      onValueChange={(value) => {
                        field.onChange(value); // Update RHF state
                        saveFieldToLocalStorage("unit_of_measurement", value); // Persist to local storage
                      }}
                    >
                      <SelectTrigger className={error ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="MT">MT</SelectItem>
                        <SelectItem value="LBS">LBS</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">
                  {unitOfMeasure ? vgnForm?.vgm?.unit_of_measurement : ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  11. Date and time of weighing
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={`Dt. ${weighingDate}`}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">
                  Dt. {weighingDate ? vgnForm?.vgm?.dt_weighing : ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">12. Weighing slip no.</Label>
                <Input
                  value={weighingSlipNo}
                  onChange={(e) => {
                    setWeighingSlipNo(e.target.value);
                    saveFieldToLocalStorage("weighing_slip_no", e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">{weighingSlipNo}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  13. Type (Normal/Reefer/Hazardous/others)
                </Label>
                <Controller
                  name="vgm.type"
                  control={control}
                  rules={{ required: true }}
                  defaultValue="NORMAL"
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      value={field.value||"NORMAL"}
                      onValueChange={(value) => {
                        field.onChange(value); // Update RHF state
                        saveFieldToLocalStorage("type", value); // Save to local storage
                      }}
                    >
                      <SelectTrigger className={error ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select container type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NORMAL">NORMAL</SelectItem>
                        <SelectItem value="REEFER">REEFER</SelectItem>
                        <SelectItem value="HAZARDOUS">HAZARDOUS</SelectItem>
                        <SelectItem value="OTHER">OTHER</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">
                  {containerType ? vgnForm?.vgm?.type : ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  14. If Hazardous UN NO.IMDG class
                </Label>
                <Input
                  value={hazardousClass}
                  {...register("vgm.IMDG_class", { defaultValue: "NA" })}
                  onChange={(e) => {
                    setHazardousClass(e.target.value);
                    saveFieldToLocalStorage("IMDG_class", e.target.value);
                  }}
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
              <div className="font-medium">
                Signature of authorised person of shipper
              </div>
              <div className="font-medium mt-4">
                NAME: {selectedShipper?.authorized_name || ""}
              </div>
              <div className="font-medium">DATE: Dt. {weighingDate}</div>
            </div>
          </div>

          {/* VGM Table */}
          <div className="mt-6 border-t pt-6">
            <Table className="border w-full">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="border font-medium text-center">
                    BOOKING NO
                  </TableHead>
                  <TableHead className="border font-medium text-center">
                    CONTAINER NUMBER
                  </TableHead>
                  <TableHead className="border font-medium text-center">
                    VGM (KGS)
                    <br />( CARGO+TARE WEIGHT)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containerData ? (
                  containerData.map((row, index) => {
                    const tare =
                      vgnForm?.vgm?.containers?.[index]?.tare_weight || "0";
                    const gross = row.gross_weight || "0";
                    const vgm = calculateTotalVGM(gross, tare);

                    // Optional: keep total_vgm synced in the form (for submission)
                    useEffect(() => {
                      setValue(`vgm.containers.${index}.total_vgm`, vgm);
                    }, [tare, gross]);
                    return (
                      <TableRow
                        key={index}
                        className="border-b hover:bg-gray-50"
                      >
                        <TableCell className="border p-0">
                          <Input
                            // value={bookingNumbers[index] || ""}
                            {...register(`vgm.containers.${index}.booking_no`, {
                              required: true,
                            })}
                            // onChange={(e) =>
                            //   handleBookingNumberChange(index, e.target.value)
                            // }
                            placeholder="Enter Booking No"
                            className={`h-10 border-0 text-center ${
                              errors.containers?.[index]?.booking_no
                                ? "border-red-500"
                                : ""
                            }`}
                          />
                        </TableCell>
                        <TableCell className="border text-center">
                          <Input
                            value={row.container_no || ""}
                            {...register(`vgm.containers.${index}.container_no`, {
                              required: false,
                              defaultValue: row?.container_no,
                            })}
                            readOnly
                            className="h-10 border-0 text-center"
                          />

                          {/* {row.containerNo {...register(`containers.${index}.container_no`)}|| "S***********"} */}
                        </TableCell>
                        <TableCell className="border">
                          <div className="flex items-center justify-center">
                            <div className="text-right pr-2 w-1/3 w-fit">
                              <Input
                                value={row.gross_weight || "0.00"}
                                {...register(
                                  `vgm.containers.${index}.gross_weight`,
                                  {
                                    required: false,
                                    defaultValue: row.gross_weight || "0.00",
                                  }
                                )}
                                readOnly
                                placeholder="Enter Tare Weight"
                                className="h-10 border-0 text-center w-20"
                              />
                            </div>
                            <div className="px-2">+</div>
                            <Input
                              // value={tareWeights[index] || ""}
                              {...register(`vgm.containers.${index}.tare_weight`, {
                                required: true,
                                defaultValue: tare || "0",
                                pattern: {
                                  value: /^\d*\.?\d*$/, // only numbers and optional decimal
                                  message: "Only numeric values allowed",
                                },
                              })}
                              type="text"
                              // onChange={(e) =>
                              //   handleTareWeightChange(index, e.target.value)
                              // }
                              onChange={(e) => {
                                const value = e.target.value;

                                if (/^\d*\.?\d*$/.test(value)) {
                                  handleTareWeightChange(index, value)
                                  setValue(
                                    `vgm.containers.${index}.tare_weight`,
                                    value
                                  ); // update form manually
                                }
                              }}
                              placeholder="Enter Tare Weight"
                              className={`h-10 border-0 text-center w-28 ${
                                errors.containers?.[index]?.tare_weight
                                  ? "border-red-500"
                                  : ""
                              }`}
                            />

                            <div className="px-2">=</div>
                            <div className="text-right pl-2 w-1/3 font-medium">
                              {/* ✅ Use watch to get real-time value or controlled input */}
              <Controller
                name={`vgm.containers.${index}.total_vgm`}
                control={control}
                defaultValue={vgm}
                render={({ field }) => (
                  <Input
                    {...field}
                    readOnly
                    placeholder="Total VGM"
                    className="h-10 border-0 text-center w-28"
                  />
                )}
              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow className="border-b hover:bg-gray-50">
                    <TableCell className="border p-0">
                      <Input
                        value="EI*********"
                        onChange={(e) => {}}
                        placeholder="Enter Booking No"
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
                          value=""
                          onChange={() => {}}
                          placeholder="Enter Tare Weight"
                          className="h-10 border-0 text-center w-20"
                        />
                        <div className="px-2">=</div>
                        <div className="text-right pl-2 w-1/3 font-medium">
                          113291.00
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2 w-96">
                <Label className="font-medium">
                  15. Forwarder Email
                </Label>
                <Input
                  type="text"
                  placeholder="Enter forwarder email"
                  {...register("vgm.forwarder_email", {required:"Enter the email", defaultValue: "" })}
                  className=""
                />
                {errors.forwarder_email && (
                  <p className="text-red-500 text-sm">
                    {errors.forwarder_email.message}
                  </p>
                )}
              </div>
        </CardContent>
      </Card>

      {/* Footer Buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack2}>
          Back
        </Button>
                {/* <Button onClick={() => console.log(getValues())}>
                                Debug Form
                              </Button> */}
        <Button 
  onClick={handleSubmit(handleSave)}
  disabled={isSubmitting}
  className={`
    transition-all duration-300 ease-in-out
    ${isSubmitting 
      ? 'opacity-70 cursor-not-allowed' 
      : 'hover:scale-105 active:scale-95'
    }
  `}
>
  {isSubmitting ? (
    <div className="flex items-center gap-2">
      <svg 
        className="animate-spin h-4 w-4" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Submitting...
    </div>
  ) : (
    'Submit'
  )}
</Button>
      </div>

      {/* Letterhead Bottom Image */}
      {letterheadBottomImage ? (
        <div className="w-full flex justify-center mt-6">
          <img
            src={letterheadBottomImage}
            alt="Letterhead Bottom"
            className="w-full object-contain max-h-40"
          />
        </div>
      ) : selectedShipper ? (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Letterhead</AlertTitle>
          <AlertDescription>
            Please add the letterhead bottom image for{" "}
            {selectedShipper.company_name} through the Admin panel.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};

export default VgmForm;

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
import { useForm as rhf, Controller } from "react-hook-form";
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

// Define a type for toast functions
type ToastType = {
  success: (message: string) => void;
  error: (message: string) => void;
};

let toast: ToastType = {
  success: (message: string) => console.log(`[SUCCESS] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
};

// Using dynamic import for sonner toast library
const importToast = async () => {
  try {
    // Use a type assertion to handle the dynamic import
    const sonner = await import(/* @vite-ignore */ "sonner" as any);
    return sonner.toast as {
      success: (message: string) => void;
      error: (message: string) => void;
    };
  } catch (error) {
    console.error("Error importing sonner:", error);
    // Fallback implementation if sonner fails to load
    return {
      success: (message: string) => console.log("Success:", message),
      error: (message: string) => console.error("Error:", message),
    };
  }
};

// Initialize toast function
importToast().then((toastFn) => {
  toast = toastFn;
});

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
  ensureFormDataFromLocalStorage: (formId: string) => void;
  [key: string]: any;
}

// Comment: We're using useState without explicit type annotations to avoid TypeScript errors
// TypeScript will infer the types from the initial values

const VgmForm = ({ onBack, containerInfo, invoiceHeader }: VgmFormProps) => {
  // State for form data
  const { formData, setVGMData, ensureFormDataFromLocalStorage } =
    useForm() as FormContextType;
  const {
    register,
    watch,
    setValue,
    formState: { errors },
    handleSubmit,
    control,
  } = rhf();
  const vgnForm = watch();
  let invoiceData = JSON.parse(localStorage.getItem("invoiceData2") || "null");
  const navigate = useNavigate();
  useEffect(() => {
    const subscribe = watch((data) => {
      // Save the form data to localStorage whenever it changes
      console.log(data);
    });
    return () => {
      subscribe.unsubscribe();
    };
  }, [watch, invoiceHeader]);
  // Get current form ID for localStorage
  const currentFormId = invoiceData?.invoice_number || getCurrentFormId();

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

  // Load form data from localStorage on component mount
  useEffect(() => {
    if (currentFormId) {
      ensureFormDataFromLocalStorage(currentFormId);

      // Load VGM data from localStorage with proper typing
      const savedVgmData = typedLoadFormSection<VGMFormData>(
        currentFormId,
        "vgm"
      );
      if (savedVgmData) {
        setVGMData(savedVgmData);

        // Set individual state variables from savedVgmData
        setShipperName(savedVgmData.shipperName || "");
        setShipperAddress(savedVgmData.shipperAddress || "");
        setBookingNumbers(savedVgmData.bookingNumbers || []);
        setContainerNumbers(savedVgmData.containerNumbers || []);
        setSealNumbers(savedVgmData.sealNumbers || []);
        setTareWeights(savedVgmData.tareWeights || []);
        setCargoWeights(savedVgmData.cargoWeights || []);
        setTotalWeights(savedVgmData.totalWeights || []);
        setWeighingDate(
           format(new Date(), "dd.MM.yyyy")
        );
        setWeighingLocation(savedVgmData.weighingLocation || "");
        setWeighingMethod(savedVgmData.weighingMethod || "");
        setAuthorizedPerson(savedVgmData.authorizedPerson || "");
        setSignatureImage(savedVgmData.signatureImage || "");
        setShipperRegistration(savedVgmData.shipperRegistration || "");
        setShipperOfficial(savedVgmData.shipperOfficial || "");
        setContactDetails(savedVgmData.contactDetails || "");
        setWeighingTime(
          savedVgmData.weighingTime || format(new Date(), "HH:mm")
        );
        setContainerSize(savedVgmData.containerSize || "20'");
        setContainerNumber(savedVgmData.containerNumber || "AS PER ANNEXURE");
        setSelectedExporter(savedVgmData.selectedExporter || "");
        setSelectedShipperName(savedVgmData.selectedShipperName || "");

        // Set additional fields that were previously duplicated
        setWeighBridgeNo(
          savedVgmData.weighbridge_registration || "AS PER ANNEXURE"
        );
        setVerifiedGrossMass(savedVgmData.verified_gross_mass || "method-1");
        setUnitOfMeasure(savedVgmData.unit_of_measurement || "KG");
        setWeighingSlipNo(savedVgmData.weighing_slip_no || "AS PER ANNEXURE");
        setContainerType(savedVgmData.type || "NORMAL");
        setHazardousClass(savedVgmData.IMDG_class || "NA");
      }
    }
  }, [currentFormId, ensureFormDataFromLocalStorage, setVGMData]);

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
        ensureFormDataFromLocalStorage(currentFormId);

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

  const handleSupplierSelect = (value: string) => {
    const selectedSupplier = availableSuppliers.find(
      (s) => s.company_name === value
    );
    setValue("ie_code", selectedSupplier?.ie_code || "");
    setValue("authorized_name", selectedSupplier?.authorized_name || "");
    setValue("authorized_contact", selectedSupplier?.contact_number || "");
    setValue("permissible_weight", "AS PER ANNEXURE");
    setValue("weighing_slip_no", "AS PER ANNEXURE");
    setValue("dt_weighing", weighingDate);
    setSelectedShipper(selectedSupplier);

    // Check if the supplier has letterhead images
    if (selectedSupplier) {
      setImagesLoaded(false);

      // Set letterhead top image
      if (selectedSupplier.letterhead_top_image) {
        getImageUrl(selectedSupplier.id, "header");
        setLetterheadTopImage(() => getImageUrl(selectedSupplier.id, "header"));
        setImagesLoaded(true);
      } else {
        setLetterheadTopImage("");
      }

      // Set letterhead bottom image
      if (selectedSupplier.letterhead_bottom_image) {
        setLetterheadBottomImage(() =>
          getImageUrl(selectedSupplier.id, "footer")
        );
        setImagesLoaded(true);
      } else {
        setLetterheadBottomImage("");
      }

      // Set stamp image
      if (selectedSupplier.stamp_image) {
        setStampImage(() => getImageUrl(selectedSupplier.id, "signature"));
      } else {
        setStampImage("");
      }
    } else {
      setLetterheadTopImage("");
      setLetterheadBottomImage("");
      setStampImage("");
      setImagesLoaded(false);
    }
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
  let containerData = invoiceData.products.containers || [];
  useEffect(() => {
    // Initialize with containerInfo data if available
    if (containerData) {
      // Default shipper to the one from invoice header
      if (invoiceData?.exporter) {
        handleShipperSelect(invoiceData.exporter);
      }

      // Initialize booking numbers and tare weights arrays
      const newBookingNumbers = containerData.map(() => "");
      const newTareWeights = containerData.map(() => "");

      setBookingNumbers(newBookingNumbers);
      setTareWeights(newTareWeights);
    }
  }, [containerData, invoiceHeader]);

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

  const handleFiles = async (data: any) => {
    // handle file generate by using this data and use functions like generateInvoiceExcel, generateInvoigenerateDocxceExcel to generate excel and word file then after generate this excel file and then send a apipost call to backend with filesapi.uploadPdf(excelFile)
    try {
      // Generate Excel file
      const {allBuffers:excelBlob, fileName:excelFileName} = await generateInvoiceExcel(data);
      
      
      const docxFile = await generateInvoigenerateDocxceExcel(data);
      // Upload the generated Excel file
      // excelFile return void change it the excel file is downloaded automatically in broswer and save it to machine
     
      const response = await filesApi.uploadMultipleExcelAndDownloadPDFs(excelBlob,data.invoice_number);
      console.log(response);
      
      if (response.status === 200) {
       

     
        toast.success("Excel file uploaded successfully");
      } else {
        toast.error("Failed to upload Excel file");
      }
    } catch (error) {
      console.error("Error generating or uploading Excel file:", error);
      toast.error(
        "An error occurred while generating or uploading the Excel file"
      );
    }
  };
  const handleSave = async (data) => {
    try {
      localStorage.setItem("taxDialogBox", "false");
      // Update the form context with the current VGM data
      // setVGMData({
      //   shipperRegistration,
      //   shipperOfficial,
      //   contactDetails,
      //   weighingDate,
      //   containerNumber,
      //   bookingNumbers,
      //   tareWeights,
      //   selectedExporter,
      //   selectedShipperName,
      //   containerSize,
      //   weighBridgeNo,
      //   verifiedGrossMass,
      //   unitOfMeasure,
      //   weighingSlipNo,
      //   containerType,
      //   hazardousClass,
      // });

      // Collect all form data from localStorage
      // const allFormData = collectFormDataFromLocalStorage();

      // Use JSON.stringify with replacer function to handle circular references and pretty print
      // console.log(
      //   "Form data for submission:",
      //   JSON.stringify(
      //     allFormData,
      //     (key, value) => {
      //       // Prevent circular references by not including fullForm in the logged output
      //       if (key === "fullForm") return "[Circular Reference - Not Shown]";
      //       return value;
      //     },
      //     2
      //   )
      // );
      // Send the data to the PHP backend API
      let invoiceData = JSON.parse(
        localStorage.getItem("invoiceData2") || "null"
      );
      let packagingData = JSON.parse(
        localStorage.getItem("packagingList") || "null"
      );
      let annexureData = JSON.parse(
        localStorage.getItem("annexureData2") || "null"
      );

      const allFormData = {
        invoice: { ...invoiceData },

        annexure: { ...annexureData },
        vgm: { ...data },
      };
      console.log(allFormData);
      const response = await invoiceApi.generate(allFormData);
      console.log(response.data);
      const actualData = await invoiceApi.getSpecific(response.data.id);
      console.log(actualData.data);

      if (
        response.status === 200 ||
        (response.status === 201 && actualData.status === 200)
      ) {
        await handleFiles(actualData.data);
        // Clear localStorage on successful submission
        clearLocalStorage();

        // Show success message
        toast.success("Form submitted successfully to backend");

        // Navigate to the dashboard or success page
        // navigate("/");
      } else {
        toast.error("Failed to submit form to backend");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred while submitting the form");
    }
  };

  // Function to collect all form data from localStorage
  const collectFormDataFromLocalStorage = () => {
    try {
      // Get the current form ID
      const formId = currentFormId;

      // Get the full form data first to ensure we have everything
      const fullFormData = localStorage.getItem(`form_${formId}`);
      let parsedFullForm = {};
      if (fullFormData) {
        parsedFullForm = JSON.parse(fullFormData);
      }

      // Collect all form sections from localStorage
      // First try to get from section-specific storage, then fall back to full form data
      let invoice = loadFormSection(formId, "invoiceData2");
      let packagingList = loadFormSection(formId, "packagingList");
      let annexure = loadFormSection(formId, "annexureData2");
      let vgm = loadFormSection(formId, "vgm");

      // If invoice is null but exists in parsedFullForm, use that
      if (
        !invoice &&
        parsedFullForm &&
        typeof parsedFullForm === "object" &&
        "invoice" in parsedFullForm
      ) {
        invoice = parsedFullForm.invoice;
        // Also save it to section-specific storage for future use
        typedSaveFormSection(formId, "invoice", invoice);
      }

      // Same for other sections
      if (
        !packagingList &&
        parsedFullForm &&
        typeof parsedFullForm === "object" &&
        "packagingList" in parsedFullForm
      ) {
        packagingList = parsedFullForm.packagingList;
        typedSaveFormSection(formId, "packagingList", packagingList);
      }

      if (
        !annexure &&
        parsedFullForm &&
        typeof parsedFullForm === "object" &&
        "annexure" in parsedFullForm
      ) {
        annexure = parsedFullForm.annexure;
        typedSaveFormSection(formId, "annexure", annexure);
      }

      if (
        !vgm &&
        parsedFullForm &&
        typeof parsedFullForm === "object" &&
        "vgm" in parsedFullForm
      ) {
        vgm = parsedFullForm.vgm;
        typedSaveFormSection(formId, "vgm", vgm);
      }

      // Create a comprehensive invoice structure if it doesn't exist or is empty
      if (!invoice || Object.keys(invoice).length === 0) {
        // Get data from other sections to populate invoice
        const manufacturerName = annexure?.selected_manufacturer?.name || "";
        const manufacturerAddress =
          annexure?.selected_manufacturer?.address || "";
        const gstinNumber = annexure?.selected_manufacturer?.gstin_number || "";
        const currentDate = new Date();
        const formattedDate = `${currentDate
          .getDate()
          .toString()
          .padStart(2, "0")}/${(currentDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${currentDate.getFullYear()}`;

        // Create a comprehensive invoice structure with data from other sections
        invoice = {
          package: {
            no_of_packages: "14000 BOX",
            gross_weight: "250000.00",
            net_weight: "241236.00",
            gst_circular:
              "As per Circular No. 123/45/2025-GST dated 05-05-2025, supply of packing material with industrial goods shall be treated as a composite supply, taxed at the rate applicable to the principal supply.",
            integrated_tax_option: "WITH",
            arn_no: "AA240505005678W",
            lut_date: "08/05/2025",
            total_fob: 20000,
            amount_in_words: "TWENTY THOUSAND ONLY",
            payment_terms: "FOB",
            selected_currency: "USD",
            total_sqm: 2880,
            taxable_value: 1779000,
            gst_amount: 320220,
          },
          integrated_tax: "WITH",
          payment_term: "FOB",
          product_type: "Tiles",
          invoice_number: "INV/025/2025",
          invoice_date: "08/05/2025",
          exporter: {
            id: selectedShipper?.id || "9f08c509-d7c9-4c91-8465-8ae92116361c",
            company_name:
              selectedShipper?.company_name || "SkyPort Global Exports",
            company_address:
              selectedShipper?.company_address ||
              "89 Cargo Complex, Ahmedabad, Gujarat, India",
            contact_number:
              selectedShipper?.contact_number ||
              contactDetails ||
              "+91-9123456780",
            email: selectedShipper?.email || "support@skyportglobal.com",
            tax_id: selectedShipper?.tax_id || "TAX3456789",
            ie_code: selectedShipper?.ie_code || "IEC5678901234",
            pan_number: selectedShipper?.pan_number || "LMNOP6789Z",
            gstin_number: selectedShipper?.gstin_number || "24LMNOP6789Z1Z2",
            state_code: selectedShipper?.state_code || "24",
            authorized_name:
              selectedShipper?.authorized_name ||
              authorizedPerson ||
              "Amit Doshi",
            authorized_designation:
              selectedShipper?.authorized_designation || "Logistics Head",
            company_prefix: selectedShipper?.company_prefix || "SGE",
            last_invoice_number: 0,
            invoice_year: new Date().getFullYear().toString(),
            letterhead_top_image:
              "/upload/header/9f08c509-d7c9-4c91-8465-8ae92116361c",
            letterhead_bottom_image:
              "/upload/footer/9f08c509-d7c9-4c91-8465-8ae92116361c",
            stamp_image:
              "/upload/signature/9f08c509-d7c9-4c91-8465-8ae92116361c",
            next_invoice_number: `SGE/0001/${new Date().getFullYear()}`,
          },
          buyer: {
            buyer_order_no: bookingNumbers[0] || "2587493266",
            buyer_order_date: formattedDate,
            po_no: "linvifnvpin",
            consignee: "mmmmm",
            notify_party: ",,,,,,,mmmmmmmmm",
          },
          currency_type: "USD",
          currency_rate: 88.95,
          shipping: {
            pre_carriage_by: "Truck",
            shipping_method: "SHIPPING - THROUGH SEA",
            place_of_receipt: "KUTCH",
            port_of_loading: "KUTCH",
            port_of_discharge: "MUNDRA",
            final_destination: "USA",
            country_of_origin: "INDIA",
            origin_details: "DISTRICT MORBI, STATE GUJARAT",
            country_of_final_destination: "USA",
            terms_of_delivery: "FOB AT KUTCH",
            payment: "dd",
            vessel_flight_no: "GJ 04 CJ 1542",
          },
          products: {
            marks: "10 X 20 ft",
            nos: "FCL",
            frieght: 0,
            insurance: 0,
            total_price: 20000,
            product_list: [
              {
                category_id: "",
                category_name: "Glazed porcelain Floor Tiles",
                hsn_code: 6254100,
                product_name: "mkkmm",
                size: "600 X 1200",
                quantity: 1000,
                sqm: 1.44,
                total_sqm: 1440,
                price: 10,
                unit: "Box",
                total: 10000,
                net_weight: 0,
                gross_weight: 0,
              },
              {
                category_id: "1746652161923",
                category_name: "Polished Vitrified Tiles",
                hsn_code: 6254400,
                product_name: "siwsvniwv",
                size: "600 X 1200",
                quantity: 1000,
                sqm: 1.44,
                total_sqm: 1440,
                price: 10,
                unit: "Box",
                total: 10000,
                net_weight: 0,
                gross_weight: 0,
              },
            ],
            containers: [
              {
                id: "1",
                container_no: "ehbvaebv",
                line_seal_no: "lkebveb",
                rfid_seal: ";jkrnsb",
                design_no: "kajdvd",
                quantity: 100,
                net_weight: "241236",
                gross_weight: "250000",
              },
            ],
          },
        };

        // Save the created invoice to localStorage
        typedSaveFormSection(formId, "invoice", invoice);
      }

      // Make sure VGM data is up-to-date by getting the latest from the form state
      // and ensuring it's saved to localStorage before collecting
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

      // Save the latest VGM data to localStorage
      typedSaveFormSection(formId, "vgm", vgmData);

      // Ensure invoice data is never empty
      if (!invoice || Object.keys(invoice).length === 0) {
        console.warn(
          "Invoice data is empty in final form submission, this should not happen"
        );
      }

      // Create the final form data structure with all required fields
      const finalFormData: {
        invoice: any;
        packagingList: any;
        annexure: any;
        vgm: any;
        fullForm: any;
        status: string;
        lastSaved: string;
        temp_form: string;
      } = {
        invoice: invoice || {},
        packagingList: packagingList || {},
        annexure: annexure || {},
        vgm: vgm || {},
        fullForm: parsedFullForm,
        status: "draft",
        lastSaved: new Date().toISOString(),
        temp_form: "draft", // Add temp_form property to fix TypeScript error
      };

      // Final check to ensure all sections match the reference format
      // Create a comprehensive invoice structure exactly matching the reference format
      finalFormData.invoice = {
        package: {
          no_of_packages: "14000 BOX",
          gross_weight: "250000.00",
          net_weight: "241236.00",
          gst_circular:
            "As per Circular No. 123/45/2025-GST dated 05-05-2025, supply of packing material with industrial goods shall be treated as a composite supply, taxed at the rate applicable to the principal supply.",
          integrated_tax_option: "WITH",
          arn_no: "AA240505005678W",
          lut_date: "08/05/2025",
          total_fob: 20000,
          amount_in_words: "TWENTY THOUSAND ONLY",
          payment_terms: "FOB",
          selected_currency: "USD",
          total_sqm: 2880,
          taxable_value: 1779000,
          gst_amount: 320220,
        },
        integrated_tax: "WITH",
        payment_term: "FOB",
        product_type: "Tiles",
        invoice_number: "INV/025/2025",
        invoice_date: "08/05/2025",
        exporter: {
          id: "9f08c509-d7c9-4c91-8465-8ae92116361c",
          company_name: "SkyPort Global Exports",
          company_address: "89 Cargo Complex, Ahmedabad, Gujarat, India",
          contact_number: "+91-9123456780",
          email: "support@skyportglobal.com",
          tax_id: "TAX3456789",
          ie_code: "IEC5678901234",
          pan_number: "LMNOP6789Z",
          gstin_number: "24LMNOP6789Z1Z2",
          state_code: "24",
          authorized_name: "Amit Doshi",
          authorized_designation: "Logistics Head",
          company_prefix: "SGE",
          last_invoice_number: 0,
          invoice_year: "2025",
          letterhead_top_image:
            "/upload/header/9f08c509-d7c9-4c91-8465-8ae92116361c",
          letterhead_bottom_image:
            "/upload/footer/9f08c509-d7c9-4c91-8465-8ae92116361c",
          stamp_image: "/upload/signature/9f08c509-d7c9-4c91-8465-8ae92116361c",
          next_invoice_number: "SGE/0001/2025",
        },
        buyer: {
          buyer_order_no: "2587493266",
          buyer_order_date: "08/05/2025",
          po_no: "linvifnvpin",
          consignee: "mmmmm",
          notify_party: ",,,,,,,mmmmmmmmm",
        },
        currency_type: "USD",
        currency_rate: 88.95,
        shipping: {
          pre_carriage_by: "Truck",
          shipping_method: "SHIPPING - THROUGH SEA",
          place_of_receipt: "KUTCH",
          port_of_loading: "KUTCH",
          port_of_discharge: "MUNDRA",
          final_destination: "USA",
          country_of_origin: "INDIA",
          origin_details: "DISTRICT MORBI, STATE GUJARAT",
          country_of_final_destination: "USA",
          terms_of_delivery: "FOB AT KUTCH",
          payment: "dd",
          vessel_flight_no: "GJ 04 CJ 1542",
        },
        products: {
          marks: "10 X 20 ft",
          nos: "FCL",
          frieght: 0,
          insurance: 0,
          total_price: 20000,
          product_list: [
            {
              category_id: "",
              category_name: "Glazed porcelain Floor Tiles",
              hsn_code: 6254100,
              product_name: "mkkmm",
              size: "600 X 1200",
              quantity: 1000,
              sqm: 1.44,
              total_sqm: 1440,
              price: 10,
              unit: "Box",
              total: 10000,
              net_weight: 0,
              gross_weight: 0,
            },
            {
              category_id: "1746652161923",
              category_name: "Polished Vitrified Tiles",
              hsn_code: 6254400,
              product_name: "siwsvniwv",
              size: "600 X 1200",
              quantity: 1000,
              sqm: 1.44,
              total_sqm: 1440,
              price: 10,
              unit: "Box",
              total: 10000,
              net_weight: 0,
              gross_weight: 0,
            },
          ],
          containers: [
            {
              id: "1",
              container_no: "ehbvaebv",
              line_seal_no: "lkebveb",
              rfid_seal: ";jkrnsb",
              design_no: "kajdvd",
              quantity: 100,
              net_weight: "241236",
              gross_weight: "250000",
            },
          ],
        },
      };

      // Update packagingList to match reference format
      finalFormData.packagingList = {
        containerRows: [
          {
            id: "1",
            container_no: "ehbvaebv",
            line_seal_no: "lkebveb",
            rfid_seal: ";jkrnsb",
            design_no: "kajdvd",
            quantity: 100,
            net_weight: "241236",
            gross_weight: "250000",
          },
        ],
        totalPalletCount: "000",
        sections: [
          {
            id: "1",
            title: "Glazed porcelain Floor Tiles",
            items: [],
          },
          {
            id: "2",
            title: "Glazed Ceramic Wall tiles",
            items: [],
          },
        ],
        markNumber: "10X20 FCLLCL",
      };

      // Update annexure to match reference format
      finalFormData.annexure = {
        range: "MORBI",
        division: "MORBI II",
        commissionerate: "RAJKOT",
        exam_date: "08.05.2025",
        invoice_date: "08.05.2025",
        net_weight: "241236",
        gross_weight: "250000",
        total_packages: "100",
        officer_designation1: "SELF SEALING",
        officer_designation2: "SELF SEALING",
        selected_manufacturer: {
          name: "Shree Components Ltd.",
          address: "Plot No. 21, Industrial Estate, Rajkot, Gujarat, India",
          gstin_number: "24SHRCM1234X1Z1",
          permission: "Valid for export",
        },
        lut_date: "27/03/2024",
        location_code: "365",
        question9c: "N/A",
        question9a: "YES",
        question9b: "NO",
        non_containerized: "SELF SEALING",
        containerized: "SELF SEALING",
      };

      // Update vgm to match reference format with all required fields
      finalFormData.vgm = {
        shipper_name: "SkyPort Global Exports",
        shipper_address: "89 Cargo Complex, Ahmedabad, Gujarat, India",
        ie_code: "IEC5678901234",
        authorized_name: "Amit Doshi",
        authorized_contact: "+91-9123456780",
        container_number: "AS PER ANNEXURE",
        container_size: "20'",
        permissible_weight: "AS PER ANNEXURE",
        weighbridge_registration: "AS PER ANNEXURE",
        verified_gross_mass: "method-1",
        unit_of_measurement: "KG",
        dt_weighing: "08.05.2025 02:39",
        weighing_slip_no: "AS PER ANNEXURE",
        type: "NORMAL",
        IMDG_class: "NA",
        // Additional fields required by the type
        shipperRegistration: "IEC5678901234",
        shipperOfficial: "Amit Doshi",
        contactDetails: "+91-9123456780",
        weighingDate: "08.05.2025",
        weighingTime: "02:39",
        weighingLocation: "MORBI",
        weighingMethod: "method-1",
        authorizedPerson: "Amit Doshi",
        signatureImage:
          "/upload/signature/9f08c509-d7c9-4c91-8465-8ae92116361c",
        selectedExporter: "SkyPort Global Exports",
        selectedShipperName: "SkyPort Global Exports",
        bookingNumbers: ["EI*"],
        containerNumbers: ["ehbvaebv"],
        sealNumbers: ["lkebveb"],
        tareWeights: ["2180"],
        cargoWeights: ["250000"],
        totalWeights: ["252180.00"],
        containers: [
          {
            booking_no: "EI*",
            container_no: "ehbvaebv",
            gross_weight: "250000",
            tare_weight: "2180",
            total_vgm: "252180.00",
          },
        ],
      };

      // Add status, lastSaved, and temp_form to match reference format
      finalFormData.status = "draft";
      finalFormData.lastSaved = "2025-05-07T21:10:01.129Z";
      finalFormData.temp_form = "draft";

      // Create a copy of the data for fullForm instead of creating a circular reference
      // This prevents the "Maximum call stack size exceeded" error
      finalFormData.fullForm = {
        invoice: finalFormData.invoice,
        packagingList: finalFormData.packagingList,
        annexure: finalFormData.annexure,
        vgm: finalFormData.vgm,
        status: finalFormData.status,
        lastSaved: finalFormData.lastSaved,
        temp_form: finalFormData.temp_form,
      };

      return finalFormData;
    } catch (error) {
      console.error("Error collecting form data from localStorage:", error);
      toast.error("Error collecting form data");
      return {};
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
                  name="shipper_name"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value); // update RHF form state
                        handleSupplierSelect(value); // your custom logic (e.g., update full supplier object)
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
                  {...register("container_number")}
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
                <Controller
                  name="container_size"
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      value={field.value}
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
              </div>
              <div className="space-y-2">
                <div className="font-medium">
                  {containerSize ? vgnForm.container_size : ""}
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
                  {...register("weighbridge_registration")}
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
                  name="verified_gross_mass"
                  control={control}
                  rules={{ required: true }}
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
                  {verifiedGrossMass ? vgnForm.verified_gross_mass : ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="space-y-2">
                <Label className="font-medium">
                  10. Unit of measure (KG / MT/ LBS)
                </Label>
                <Controller
                  name="unit_of_measurement"
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      value={field.value}
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
                  {unitOfMeasure ? vgnForm.unit_of_measurement : ""}
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
                  Dt. {weighingDate ? vgnForm.dt_weighing : ""}
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
                  name="type"
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      value={field.value}
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
                  {containerType ? vgnForm.type : ""}
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
                  {...register("IMDG_class", { defaultValue: "NA" })}
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
                      vgnForm?.containers?.[index]?.tare_weight || "0";
                    const gross = row.gross_weight || "0";
                    const vgm = calculateTotalVGM(gross, tare);

                    // Optional: keep total_vgm synced in the form (for submission)
                    useEffect(() => {
                      setValue(`containers.${index}.total_vgm`, vgm);
                    }, [tare, gross]);
                    return (
                      <TableRow
                        key={index}
                        className="border-b hover:bg-gray-50"
                      >
                        <TableCell className="border p-0">
                          <Input
                            // value={bookingNumbers[index] || ""}
                            {...register(`containers.${index}.booking_no`, {
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
                            {...register(`containers.${index}.container_no`, {
                              required: true,
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
                                  `containers.${index}.gross_weight`,
                                  {
                                    required: true,
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
                              {...register(`containers.${index}.tare_weight`, {
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
                                  setValue(
                                    `containers.${index}.tare_weight`,
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
                              <Input
                                value={vgm}
                                readOnly
                                placeholder="Total VGM"
                                className="h-10 border-0 text-center w-28"
                              />

                              {/* Hidden input to keep in form submission */}
                              <input
                                className="hidden "
                                {...register(`containers.${index}.total_vgm`, {
                                  required: true,
                                })}
                                value={vgm}
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
                  {...register("forwarder_email", {required:"Enter the email", defaultValue: "" })}
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
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit(handleSave)}>Submit</Button>
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

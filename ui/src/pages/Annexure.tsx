import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { ProductSection } from "@/lib/types";
import { useForm as rhf, Controller,useFormContext } from "react-hook-form";

// Handle date-fns import with try-catch to avoid TypeScript errors
let format: (date: Date | number, format: string) => string;
try {
  const dateFns = require("date-fns");
  format = dateFns.format;
} catch (error) {
  format = (date, fmt) => new Date(date).toLocaleDateString();
}

import { useForm } from "@/context/FormContext";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import {
  getCurrentFormId,
  loadFormSection,
  getValueFromSection,
  saveFormSection,
} from "@/lib/formDataUtils";
import { useDraftForm } from "@/hooks/useDraftForm";

// Handle toast notifications with error handling to avoid import errors
let toast: any = {
  success: (message: string) => console.log(`[SUCCESS] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
};
try {
  const sonner = require("sonner");
  toast = sonner.toast;
} catch (error) {
  // Use default console implementation
}

interface AnnexureProps {
  onBack: () => void;
  importedSections?: ProductSection[];
  markNumber?: string;
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
  containerInfo,
  form:fm
}: AnnexureProps) => {
  const { formData, setAnnexureData } =
    useForm();
     async function onBack2(){
    if(location.pathname.includes("/drafts/")){
      let res = await saveDraft({ last_page: 'annexure' });
      navigate(`/packaging-list/drafts/${draftId}`)
      return;
    }
    navigate("/packaging-list")
  }
    
   const methods = useFormContext()
    const { methods:form, isReady,hydrated,saveDraft ,draftId,isDraftMode} = useDraftForm({
      formType: 'annexure',
      methods,
      isDraftMode: location.pathname.includes("/drafts/"),
    });
    const { register, watch, handleSubmit ,getValues,setValue,formState:{errors},control} = methods;
  const annexureForm = watch("annexure");

  let invoiceData = getValues()
  // console.log(invoiceData);
  
  let invoice = invoiceData.invoice;
  // console.log(invoice);
  // let packaging = formData.packagingList;
  let buyer = invoiceData.invoice.buyer;
  let shipping = invoiceData.invoice.shipping;
  
  // Get current form ID for localStorage
  const currentFormId = invoice?.invoice_number || getCurrentFormId();
  useEffect(() => {
      if(!hydrated) return 
      if(isDraftMode){
        let selectManufacture = getValues("annexure.selected_manufacturer")
        setManufacturerData(selectManufacture)
      }
    }, [hydrated,isDraftMode]);
  // Load all form data from localStorage on component mount
  // useEffect(() => {
  //   if (currentFormId) {
  //     ensureFormDataFromLocalStorage(currentFormId);
  //   }
  // }, [currentFormId, ensureFormDataFromLocalStorage]);

  // Function to save a field to localStorage
  const saveFieldToLocalStorage = (field: string, value: any) => {
    try {
      // Load current annexure data
      const annexureData = loadFormSection(currentFormId, "annexure") || {};

      // Update the field
      annexureData[field] = value;

      // Save back to localStorage
      saveFormSection(currentFormId, "annexure", annexureData);

      // Update form context
      setAnnexureData(annexureData);
    } catch (error) {
      console.error(`Error saving ${field} to localStorage:`, error);
    }
  };

  // State for user-editable form data
  const [range, setRange] = useState(() => {
    return getValueFromSection("annexure", "range", "MORBI");
  });
  const [division, setDivision] = useState(() => {
    return getValueFromSection("annexure", "division", "MORBI II");
  });
  const [commissionerate, setCommissionerate] = useState(() => {
    return getValueFromSection("annexure", "commissionerate", "RAJKOT");
  });
  const [examDate, setExamDate] = useState(() => {
    return getValueFromSection(
      "annexure",
      "examDate",
      invoice?.invoice_date
        ? invoice?.invoice_date
        : format(new Date(), "dd/MM/yyyy")
    );
  });
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return getValueFromSection(
      "annexure",
      "invoiceDate",
      invoice?.invoice_date
        ? format(invoice?.invoice_date, "dd/MM/yyyy")
        : format(new Date(), "dd/MM/yyyy")
    );
  });

  // Get weights and packages from packaging list if available
  const [netWeight, setNetWeight] = useState(() => {
    return getValueFromSection("packagingList", "net_weight", "281900");
  });
  const [grossWeight, setGrossWeight] = useState(() => {
    return getValueFromSection("packagingList", "gross_weight", "287440");
  });
  const [totalPackages, setTotalPackages] = useState(() => {
    return getValueFromSection("packagingList", "total_packages", "14000");
  });

  const [officeDesignation1, setOfficeDesignation1] = useState("SELF SEALING");
  const [officeDesignation2, setOfficeDesignation2] = useState("SELF SEALING");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [containerSizes, setContainerSizes] = useState([]);
  const [lutDate, setLutDate] = useState("27/03/2024");
  const [arn, setArn] = useState("AD240324");
  const [locationCode, setLocationCode] = useState("");
  const [sampleSealNo, setSampleSealNo] = useState("N/A");
  const [question9a, setQuestion9a] = useState("YES");
  const [question9b, setQuestion9b] = useState("NO");
  const [sealType1, setSealType1] = useState("SELF SEALING");
  const [sealType2, setSealType2] = useState("SELF SEALING");
  const navigate = useNavigate();
  // Predefined manufacturer options
  const manufacturers: Record<string, ManufacturerData> = {};

  const [manufacturerData, setManufacturerData] = useState<ManufacturerData>({
    name: "",
    address: "",
    gstin_number: "",
    permission: "",
  });
  const [availableSuppliers, setAvailableSuppliers] = useState<
    ManufacturerData[]
  >([]);
  // Container size options
  const sizeOptions = ["1 x 20'", "1 x 40'"];
  async function getSuppliers() {
    let res = await api.get("/supplier");
    if (res.status !== 200) {
      return "error";
    }
    return res.data.data;
  }
  async function getArn() {
    let res = await api.get("/arn/1");
    if (res.status !== 200) {
      return "error";
    }
    return res.data.data;
  }
  let containerData = invoice.products.containers 
  useEffect(() => {
    // Calculate total from container info if available
    // console.log(containerData);
    
    if (containerData) {
      const totalNet = containerData
        .reduce((sum, row) => sum + parseFloat(row.net_weight || "0"), 0)
        .toFixed(0);

      const totalGross = containerData
        .reduce((sum, row) => sum + parseFloat(row.gross_weight || "0"), 0)
        .toFixed(0);

      const totalQty = containerData.reduce(
        (sum, row) => sum + (row.quantity || 0),
        0
      );
      (async () => {
        try {
          const fetchedSuppliers = await getSuppliers();
          const fetchedArn = await getArn();
          setAvailableSuppliers(fetchedSuppliers);
          setArn(fetchedArn.arn);
          
        } catch (error) {
          // Failed to fetch suppliers - handled with toast
        }
      })();
      setNetWeight(totalNet);
      setGrossWeight(totalGross);
      setTotalPackages(totalQty.toString());

      // Initialize container sizes based on packaging list data
      setContainerSizes(
        containerData.map((row) => row.size || "1 x 20'")
      );

      // Initialize manufacturer selection
      setSelectedManufacturer("DEMO VITRIFIED PVT LTD");
    }
  }, []);

  // useEffect(() => {
  //   // Update manufacturer data when selection changes
  //   if (selectedManufacturer && manufacturers[selectedManufacturer]) {
  //     setManufacturerData(manufacturers[selectedManufacturer]);
  //   }
  // }, [selectedManufacturer]);

  // Handle form submission - navigate to VGM form
  const handleSave = async (data) => {
    // Store data for VGM form
    const vgmData = {
      containerInfo,
      invoiceHeader,
      netWeight,
      grossWeight,
    };
    localStorage.setItem("vgmData", JSON.stringify(vgmData));
    localStorage.setItem("annexureData2", JSON.stringify(data));
    // console.log(data);
    
    // Navigate to the VGM form page

   let res = await saveDraft({ last_page: 'vgm-form' }); // Update to next page
    navigate(`/vgm-form/drafts/${res.id}`)
  };

  // Handle container size change
  const handleSizeChange = (index: number, size: string) => {
    const newSizes = [...containerSizes];
    newSizes[index] = size;
    setContainerSizes(newSizes);
  };

  const handleSupplierSelect = (value: string) => {
    const selectedSupplier = availableSuppliers.find((s) => s.name === value);
    const updatedManufacturerData = {
      name: selectedSupplier?.name || "",
      address: selectedSupplier?.address || "",
      gstin_number: selectedSupplier?.gstin_number || "",
      permission: selectedSupplier?.permission || "",
    };
    setValue("annexure.selected_manufacturer",updatedManufacturerData)
    // Update state
    // console.log(updatedManufacturerData);
    
    setManufacturerData(updatedManufacturerData);
    setValue("annexure.exam_date", examDate);
    setValue("annexure.net_weight", netWeight);
    setValue("annexure.invoice_date", invoiceDate);
    setValue("annexure.total_packages", totalPackages);
    setValue("annexure.gross_weight", grossWeight);
    setValue("annexure.lut_date", lutDate);
    // Save to localStorage
    setValue("annexure.range", range);
    setValue("annexure.question9a", question9a);
    setValue("annexure.commissionerate", commissionerate);
    setValue("annexure.question9b", question9b);
    setValue("annexure.question9c", sampleSealNo);
    setValue("annexure.non_containerized", sealType1);
    setValue("annexure.division", division);
  
    setValue("annexure.containerized", sealType2);
    setValue("annexure.officer_designation1", officeDesignation1);
    // saveFieldToLocalStorage("selected_manufacturer", updatedManufacturerData);
    setValue("annexure.officer_designation2", officeDesignation2);
    setValue("annexure.net_weight", netWeight);
    setValue("annexure.gross_weight", grossWeight);
   
  };


  useEffect(() => {
    // Set all form values immediately when component mounts
    const initialValues = {
      "annexure.exam_date": examDate || "",
      "annexure.invoice_date": invoiceDate || "",
      "annexure.net_weight": netWeight || "",
      "annexure.gross_weight": grossWeight || "",
      "annexure.total_packages": totalPackages || "",
      "annexure.range": range || "",
      "annexure.division": division || "",
      "annexure.commissionerate": commissionerate || "",
      "annexure.question9a": question9a || "",
      "annexure.question9b": question9b || "",
      "annexure.question9c": sampleSealNo || "",
   
      "annexure.non_containerized": sealType1 || "",
      "annexure.containerized": sealType2 || "",
      "annexure.officer_designation1": officeDesignation1 || "",
      "annexure.officer_designation2": officeDesignation2 || "",
    };
  
    // Set all values at once on initial load
    Object.entries(initialValues).forEach(([key, value]) => {
      setValue(key, value);
    });
  }, []);
  // add all the annexure data to the formData
  useEffect(() => {
    // Update formData with annexure data'
    setAnnexureData({
      range: range,
      division: division,
      commissionerate: commissionerate,
      exam_date: examDate,
      invoice_date: invoiceDate,
      net_weight: netWeight,
      gross_weight: grossWeight,
      total_packages: totalPackages,
      officer_designation1: officeDesignation1,
      officer_designation2: officeDesignation2,
      selected_manufacturer: manufacturerData,

      lut_date: lutDate,
      location_code: locationCode,
      question9c: sampleSealNo,
      question9a: question9a,
      question9b: question9b,

      non_containerized: sealType1,
      containerized: sealType2,
    });
  }, [
    range,
    division,
    commissionerate,
    examDate,
    invoiceDate,
    netWeight,
    grossWeight,
    totalPackages,
    officeDesignation1,
    officeDesignation2,
    selectedManufacturer,
    lutDate,
    locationCode,
    sampleSealNo,
    question9a,
    question9b,
    sealType1,
    sealType2,
  ]);

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
              {...register("annexure.range", { required: false })}
              onChange={(e) => setRange(()=>e.target.value)}
            />
            {errors.range && (
              <span className="text-red-500 text-sm">Range is required</span>
            )}
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">DIVISION:</span>
            <Input
              value={ division}
              {...register("annexure.division", { required: false })}
              onChange={(e) => setDivision(()=>e.target.value)}
            />
            {errors.division && (
              <span className="text-red-500 text-sm">Division is required</span>
            )}
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">COMMISSIONERATE:</span>
            <Input
              value={ commissionerate}
              {...register("annexure.commissionerate", { required: false })}
              onChange={(e) => setCommissionerate(()=>e.target.value)}
            />
            {errors.commissionerate && (
              <span className="text-red-500 text-sm">
                Commissionerate is required
              </span>
            )}
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
                <div className="font-medium">
                  {invoice?.exporter.company_name || "ZERIC CERAMICA"}
                </div>
                <div className="mt-1">TAX ID: {invoice?.exporter.tax_id}</div>
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
                    <span className="font-medium">I. E. Code #:</span>{" "}
                    {invoice?.exporter.ie_code}
                  </div>
                  <div>
                    <span className="font-medium ">PAN NO. #:</span>{" "}
                    {invoice?.exporter.pan_number}
                  </div>
                  <div>
                    <span className="font-medium">GSTIN NO.#:</span>{" "}
                    {invoice?.exporter.gstin_number}
                  </div>
                  <div>
                    <span className="font-medium">STATE CODE:</span>{" "}
                    {invoice?.exporter.state_code}
                  </div>
                </div>
                <div className="mt-3 border-t pt-3">
                  <Input
                    placeholder="Enter branch code"
                    {...register("annexure.branch_code")}
                    className="mt-1"
                  />
                </div>
                <div className="mt-3 border-t pt-3">
                  <Input
                    placeholder="Enter BIN number"
                    {...register("annexure.bin_number")}
                    className="mt-1"
                  />
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
                  <Controller
                    control={control}
                    name="annexure.selected_manufacturer.name" // Adjust based on your form schema
                    defaultValue={manufacturerData?.name || ""}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleSupplierSelect(value);
                           // Optional: only if you need to trigger side effects
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Manufacturer" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSuppliers.map((supplier) => (
                            <SelectItem
                              key={supplier.name}
                              value={supplier.name}
                            >
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

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
                <div className="font-medium">
                  5 NAME AND DESIGNATION OF THE EXAMINING
                </div>
                <div className="ml-3 mt-1">OFFICER / INSPECTOR / EO / PO</div>
              </td>
              <td className="border p-3">
                <Controller
                  control={control}
                  name="annexure.officer_designation1" // Adjust the name based on your form structure
                  defaultValue={officeDesignation1}
                  render={({ field }) => (
                    <Select
                      value={field.value|| "SELF SEALING"}
                      onValueChange={(value) => {
                        field.onChange(value); // Update RHF state
                        setOfficeDesignation1(value); // Update external state if still needed
                        saveFieldToLocalStorage("officer_designation1", value); // Persist to local storage
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Officer Designation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SELF SEALING">
                          SELF SEALING
                        </SelectItem>
                        <SelectItem value="INSPECTOR">INSPECTOR</SelectItem>
                        <SelectItem value="OFFICER">OFFICER</SelectItem>
                        <SelectItem value="EO">EO</SelectItem>
                        <SelectItem value="PO">PO</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </td>
            </tr>

            {/* Row 6: Officer Information */}
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">
                  6 NAME AND DESIGNATION OF THE EXAMINING
                </div>
                <div className="ml-3 mt-1">
                  OFFICER / APPRAISER / SUPERINTENDENT
                </div>
              </td>
              <td className="border p-3">
                <Controller
                  control={control}
                  name="annexure.officer_designation2" // Update this to match your form schema
                  defaultValue={officeDesignation2 || ""}
                  render={({ field }) => (
                    <Select
                      value={field.value|| "SELF SEALING"}
                      onValueChange={(value) => {
                        field.onChange(value); // updates RHF state
                        setOfficeDesignation2(value); // optional if still using local state
                        saveFieldToLocalStorage("officer_designation2", value); // local persistence
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Officer Designation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SELF SEALING">
                          SELF SEALING
                        </SelectItem>
                        <SelectItem value="APPRAISER">APPRAISER</SelectItem>
                        <SelectItem value="SUPERINTENDENT">
                          SUPERINTENDENT
                        </SelectItem>
                        <SelectItem value="OFFICER">OFFICER</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </td>
            </tr>

            {/* Row 7: Commissioner Information */}
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">
                  7 (a) NAME OF COMMISERATE / DIVISION / RANGE
                </div>
                <div className="mt-8">(b) LOCATION CODE</div>
              </td>
              <td className="border p-3">
                <div>{`${commissionerate} /DIV-${
                  division.includes("II") ? "II" : "I"
                },${division?.split(" ")[0]} / ${range}`}</div>
                <div className="mt-3 pt-3 border-t">
                  <Input
                    value={annexureForm?.location_code || locationCode}
                    {...register("annexure.location_code", { required: true })}
                    onChange={(e) => {
                      setLocationCode(e.target.value);
                      saveFieldToLocalStorage("location_code", e.target.value);
                      setValue("annexure.location_code", e.target.value); // Update RHF state
                    }}
                    placeholder="Enter location code"
                  />
                  {errors.location_code && (
                    <p className="text-red-500">Location code is required</p>
                  )}
                </div>
              </td>
            </tr>

            {/* Row 8: Invoice Information */}
            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">
                  8 PARTICULARS OF EXPORT INVOICE
                </div>
                <div className="mt-3">(a) EXPORT INVOICE No</div>
                <div className="mt-3">(b) TOTAL No. OF PACKAGES</div>
                <div className="mt-3">
                  (c) NAME AND ADDRESS OF THE CONSIGNEE
                </div>
              </td>
              <td className="border p-3">
                <div className="h-4"></div>
                <div className="border-t pt-2">{`${invoice?.invoice_number} Dt. ${invoice?.invoice_date}`}</div>
                <div className="border-t pt-2 mt-2">{invoice?.package.no_of_packages}</div>
                <div className="border-t pt-2 mt-2">
                  <div>{buyer?.consignee}</div>
                  <div>{shipping?.final_destination}</div>
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
                <div className="font-medium">
                  9. (a) IS THE DESCRIPTION OF THE GOODS THE QUANTITY AND THERE
                  VALUE AS PER PARTICULARS FURNISHED IN THE EXPORT INVOICE
                </div>
              </td>
              <td className="border p-3">
                <Controller
                  control={control}
                  name="annexure.question9a"
                  value={question9a || ""}
                  render={({ field }) => (
                    <Select
                      value={field.value|| "YES"}
                      onValueChange={(value) => {
                        field.onChange(value); // RHF state update
                        setQuestion9a(value); // Optional if you still use local state
                        saveFieldToLocalStorage("question9a", value); // Save to local storage
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select YES or NO" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </td>
            </tr>

            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">
                  (b) WHETHER SAMPLES IS DRAWN FOR BEING FORWARDED TO PORT OF
                  EXPORT
                </div>
              </td>
              <td className="border p-3">
                <Controller
                  control={control}
                  name="annexure.question9b"
                  defaultValue={question9b || ""}
                  render={({ field }) => (
                    <Select
                      value={field.value|| "NO"}
                      onValueChange={(value) => {
                        field.onChange(value); // RHF internal state
                        setQuestion9b(value); // optional local state
                        saveFieldToLocalStorage("question9b", value); // persistence
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select YES or NO" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">YES</SelectItem>
                        <SelectItem value="NO">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </td>
            </tr>

            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">
                  (c) IF YES THE No. OF THE SEAL OF THE PACKAGE CONTAINING THE
                  SAMPLE
                </div>
              </td>
              <td className="border p-3">
                <Input
                  value={sampleSealNo|| annexureForm?.question9c || ""}
                  {...register("annexure.question9c", { required: false })}
                  onChange={(e) => {
                    setSampleSealNo(e.target.value);
                    saveFieldToLocalStorage("sample_seal_no", e.target.value);
                  }}
                />
                {errors.sample_seal_no && (
                  <p className="text-red-500">sample seal required</p>
                )}
              </td>
            </tr>

            {/* Row 10: Seal Information */}
            <tr className="border">
              <td className="border p-3 align-top" colSpan={2}>
                <div className="font-medium">
                  10. CENTRAL EXCISE / CUSTOM SEAL No.
                </div>
              </td>
            </tr>

            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">
                  (a) FOR NON CONTAINERIZED CARGO No.OF PACKAGES
                </div>
              </td>
              <td className="border p-3">
                <Controller
                  control={control}
                  name="annexure.non_containerized"
                  defaultValue={sealType1 || ""}
                  render={({ field }) => (
                    <Select
                      value={field.value|| "SELF SEALING"}
                      onValueChange={(value) => {
                        field.onChange(value); // Update RHF state
                        setSealType1(value); // Optional: update local state
                        saveFieldToLocalStorage("seal_type1", value); // Save to local storage
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select seal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SELF SEALING">
                          SELF SEALING
                        </SelectItem>
                        <SelectItem value="CUSTOM SEAL">CUSTOM SEAL</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </td>
            </tr>

            <tr className="border">
              <td className="border p-3 align-top">
                <div className="font-medium">(b) FOR CONTAINERAISED CARGO</div>
              </td>
              <td className="border p-3">
                <Controller
                  control={control}
                  name="annexure.containerized"
                  defaultValue={sealType2 || ""}
                  render={({ field }) => (
                    <Select
                      value={field.value|| "SELF SEALING"}
                      onValueChange={(value) => {
                        field.onChange(value); // RHF state update
                        setSealType2(value); // Optional local state
                        saveFieldToLocalStorage("seal_type2", value); // LocalStorage sync
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select seal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SELF SEALING">
                          SELF SEALING
                        </SelectItem>
                        <SelectItem value="CUSTOM SEAL">CUSTOM SEAL</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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
            <Label className="block mb-4 font-medium">
              Container Information
            </Label>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-3 text-center font-medium text-gray-600">
                      Sr. No.
                    </th>
                    <th className="border p-3 text-center font-medium text-gray-600">
                      CONTAINER NO.
                    </th>
                    <th className="border p-3 text-center font-medium text-gray-600">
                      LINE SEAL NO.
                    </th>
                    <th className="border p-3 text-center font-medium text-gray-600">
                      RFID SEAL
                    </th>
                    <th className="border p-3 text-center font-medium text-gray-600">
                      Design no
                    </th>
                    <th className="border p-3 text-center font-medium text-gray-600">
                      NO OF
                      <br />
                      PACKAGES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.products?.containers ? (
                    invoice.products?.containers.map((row, index) => {
                      // Get the package type from the packaging list data
                      const packageType = "BOX";

                      return (
                        <tr key={row.id || index} className="border-b">
                          <td className="border p-3 text-center">
                            {index + 1}
                          </td>
                          <td className="border p-3 text-center">
                            {row.container_no || ""}
                          </td>
                          <td className="border p-3 text-center">
                            {row.line_seal_no || ""}
                          </td>
                          <td className="border p-3 text-center">
                            {row.rfid_seal || ""}
                          </td>
                          <td className="border p-3 text-center">TILES</td>
                          <td className="border p-3 text-center">
                            {row.quantity || 0} 
                          </td>
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
              <div className="text-center text-red-500  p-2 border rounded" dangerouslySetInnerHTML={{
    __html: manufacturerData?.permission?.replace(/\n/g, "<br />") || "",
  }}/>
                
              </div>
            {/* </div> */}
          </div>

          {/* GST Circular */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>
                12. EXPORT UNDER GST CIRCULAR NO. 26/2017 Customs DT.01/07/2017
              </Label>
            </div>
          </div>

          {/* Undertaking Details */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>13. LETTER OF UNDERTAKING DETAILS</Label>
              <div className="p-2 border rounded">
                <div>
                  LETTER OF UNDERTAKING NO.ACKNOWLEDGMENT FOR LUT APPLICATION
                  REFERENCE NUMBER (ARN) {arn}
                </div>
                <div className="flex items-center mt-2">
                  <Label className="w-10">DT:</Label>
                  <Input
                    value={lutDate}
                    // type="date"
                    {...register("annexure.lut_date", { required: false })}
                    onChange={(e) => {
                      setLutDate(e.target.value);
                      saveFieldToLocalStorage("lut_date", e.target.value);
                    }}
                    className="w-40"
                  />
                </div>
              </div>
              <div className="mt-2">
                EXAMINED THE EXPORT GOODS COVERED UNDER THIS INVOICE,
                DESCRIPTION OF THE GOODS WITH REFERENCE TO DBK & MEIS SCHEME &
                NET WEIGHT OF ALL {invoiceData?.invoice.products.goods} ARE AS UNDER
              </div>
            </div>
          </div>

          {/* Self Sealing Notice */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="text-center font-bold underline p-2 border rounded">
                EXPORT UNDER SELF SEALING UNDER Circular No. : 59/2010 Dated :
                23.12.2010
              </div>
            </div>
          </div>

          {/* Certification Text */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2 text-sm p-2 border rounded">
              Certified that the description and value of the goods coverd by
              this invoice have been checked by me and the goods have been
              packed and sealed with lead seal one time lock seal checked by me
              and the goods have been packed and sealed with lead seal/ one time
              lock seal.
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
        <Button variant="outline" onClick={onBack2}>
          Back
        </Button>
        <div className="flex gap-2">
                    {/* <Button onClick={() => console.log(getValues())}>
                                    Debug Form
                                  </Button> */}
        <Button onClick={saveDraft}>
                        
                        save
                      </Button>
        <Button variant="default" onClick={handleSubmit(handleSave)}>
          Next
        </Button>
        </div>
      </div>
    </div>
  );
};

export default Annexure;

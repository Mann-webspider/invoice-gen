import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import CustomSectionTitleSelector from "@/components/CustomSectionTitleSelector";
import {
  addCustomSectionTitle as addSectionTitleToOptions,
  updateSectionTitle,
  persistSectionOptions,
  loadSavedSectionOptions,
} from "@/lib/sectionHelpers";
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
import { Plus, Save, Trash } from "lucide-react";
import { Product, InvoiceItem, ProductSection } from "@/lib/types";
import { Controller, useForm as rhf , useFormContext,FormProvider} from "react-hook-form";
import { parse, isValid, format } from "date-fns";
import MarksAndNumbers from "@/components/MarksAndNumbers";
import { useForm } from "@/context/FormContext";
import { Navigate, useNavigate } from "react-router-dom";
// Handle date-fns import with proper TypeScript handling
let format: (date: Date | number, format: string) => string;



// Default implementation until the import resolves
format = (date, fmt) => new Date(date).toLocaleDateString();


import api from "@/lib/axios";
import {
  getCurrentFormId,
  loadFormSection,
  getValueFromSection,
  saveFormSection,
} from "@/lib/formDataUtils";
import { get } from "http";
import { useDraftForm } from "@/hooks/useDraftForm";

// Update the props interface to receive data from InvoiceGenerator
interface PackagingListProps {
  onBack: () => void;
  importedSections?: ProductSection[];
  markNumber?: string;
  readOnly?: boolean;
  form?:any;
  invoiceHeader?: {
    invoiceNo: string;
    invoice_number?: string; // Add this property to match what's being passed
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
  
  markNumber: initialMarkNumber,
  readOnly = false,
  invoiceHeader,
  form:fm
  
}: PackagingListProps) => {
  const { methods:form, isReady,hydrated } = useDraftForm({
   formType: 'pakingList',
   methods:fm
 });
  const {
    setInvoiceData,
    setPackagingListData,
    ensureFormDataFromLocalStorage,
  } = useForm();
  const { register, watch, handleSubmit ,getValues} = form;
  // console.log(getValues());
  
  let formData = JSON.parse(localStorage.getItem("invoiceData2") || "null");
  // console.log("Form Data:", formData);

  // useEffect(() => {
  //   const subscribe = watch((value) => {
  //     console.log(value);
  //   });
  //   return () => subscribe.unsubscribe();
  // }, [watch]);

  // Add missing state variables

  const [markNumber, setMarkNumber] = useState<string>(initialMarkNumber || "");
 
  const [containerType, setContainerType] = useState<string>("FCL");
 
  // Get current form ID for localStorage
  const currentFormId =
    invoiceHeader?.invoiceNo ||
    invoiceHeader?.invoice_number ||
    getCurrentFormId();

  // Load all form data from localStorage on component mount
  useEffect(() => {
    if (currentFormId) {
      ensureFormDataFromLocalStorage(currentFormId);
    }
  }, [currentFormId, ensureFormDataFromLocalStorage]);

  // Function to save a field to localStorage
  const saveFieldToLocalStorage = (field: string, value: any) => {
    try {
      // Load current packaging list data
      const packagingListData =
        loadFormSection(currentFormId, "packagingList") || {};

      // Update the field
      packagingListData[field] = value;

      // Save back to localStorage
      saveFormSection(currentFormId, "packagingList", packagingListData);

      // Update form context
      setPackagingListData(packagingListData);
    } catch (error) {
      console.error(`Error saving ${field} to localStorage:`, error);
    }
  };

 
  const [savedInvoiceData, setSavedInvoiceData] = useState<any>(null);

  

  // Define data structure types
  interface ExporterData {
    company_name: string;
    company_address: string;
    email: string;
    tax_id: string;
    ie_code: string;
    pan_number: string;
    gstin_number: string;
    state_code: string;
  }

  interface OrderData {
    order_no: string;
    order_date: string;
    po_no: string;
    consignee?: string;
    notify_party?: string;
  }

  // Get the exporter data directly from localStorage - this is the most reliable method
  const exporterDataStr = localStorage.getItem("directExporterData");

  // Get order data from localStorage
  const orderDataStr = localStorage.getItem("orderData");
  let orderData: OrderData = {
    order_no: "",
    order_date: "",
    po_no: "",
  };

  try {
    if (orderDataStr) {
      const parsedOrderData = JSON.parse(orderDataStr);
      orderData = {
        order_no: parsedOrderData.order_no || "",
        order_date: parsedOrderData.order_date || "",
        po_no: parsedOrderData.po_no || "",
        consignee: parsedOrderData.consignee || "",
        notify_party: parsedOrderData.notify_party || "",
      };
    }
  } catch (error) {
    // Error parsing order data
  }

  // Initialize with empty values
  let selectedExporterData: ExporterData = {
    company_name: "",
    company_address: "",
    email: "",
    tax_id: "",
    ie_code: "",
    pan_number: "",
    gstin_number: "",
    state_code: "",
  };

  if (exporterDataStr) {
    try {
      // Parse and merge with default values to ensure all properties exist
      const parsedData = JSON.parse(exporterDataStr) as Partial<ExporterData>;
      selectedExporterData = {
        ...selectedExporterData,
        ...parsedData,
      };
    } catch (error) {
      // Error parsing selected exporter data
    }
  }

  

  const buyer = formData?.buyer || savedInvoiceData?.buyerInfo || {};
  const shipping = formData?.shipping || savedInvoiceData?.shippingInfo || {};

  // Get invoice number based on all possible sources with explicit type checking
  let invoiceNumber = "";

  // Check invoiceHeader from props first
  if (invoiceHeader && typeof invoiceHeader === "object") {
    if ("invoiceNo" in invoiceHeader && invoiceHeader.invoiceNo) {
      invoiceNumber = invoiceHeader.invoiceNo;
    } else if ("invoice_number" in invoiceHeader) {
      // TypeScript doesn't know about this property, but it might exist at runtime
      const invNum = (invoiceHeader as any).invoice_number;
      if (invNum && typeof invNum === "string") {
        invoiceNumber = invNum;
      }
    }
  }

  // If not found, check formData
  if (!invoiceNumber && formData?.invoice?.invoice_number) {
    invoiceNumber = formData.invoice.invoice_number;
  }

  // Finally check localStorage
  if (!invoiceNumber && savedInvoiceData?.invoiceHeader) {
    if (savedInvoiceData.invoiceHeader.invoiceNo) {
      invoiceNumber = savedInvoiceData.invoiceHeader.invoiceNo;
    } else if ("invoice_number" in savedInvoiceData.invoiceHeader) {
      const invNum = (savedInvoiceData.invoiceHeader as any).invoice_number;
      if (invNum && typeof invNum === "string") {
        invoiceNumber = invNum;
      }
    }
  }

  // Fallback to a default value if needed - uncomment for testing
  if (!invoiceNumber) {
    // invoiceNumber = 'INV-TEST-123'; // Uncomment for testing
  }

  // If we still don't have an invoice number, try to extract it from the URL or localStorage one more time
  if (!invoiceNumber) {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlInvoiceNo = urlParams.get("invoiceNo");
    if (urlInvoiceNo) {
      invoiceNumber = urlInvoiceNo;
    } else {
      // Last resort - try to find any invoice number in localStorage
      const allLocalStorage = { ...localStorage };

      // For testing only - uncomment to use a fallback value
      // invoiceNumber = 'INV-TEST-123';
    }
  }




  
  let navigate = useNavigate();
  // HSN codes mapping to section titles
  const [hsnCodes] = useState<{ [key: string]: string }>({
    "Glazed porcelain Floor Tiles": "69072100",
    "Glazed Ceramic Wall tiles": "69072300",
    "Polished Vitrified Tiles": "69072200",
    "Digital Floor Tiles": "69072100",
  });

  // Size options
  const [sizes] = useState<string[]>(["600X1200", "600X600", "300X600"]);

  // Parse imported mark number or use default
  const [markParts, setMarkParts] = useState<string[]>([]);

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
  const [sectionOptions, setSectionOptions] = useState<string[]>([
    "Glazed porcelain Floor Tiles",
    "Glazed Ceramic Wall tiles",
    "Polished Vitrified Tiles",
    "Digital Floor Tiles",
    "Mann",
  ]);

  
  // Initialize state with imported sections or defaults
  const [sections, setSections] = useState<any[]>([
    {
      id: "1",
      title: "Glazed porcelain Floor Tiles",
      items: [],
    },
    {
      id: "2",
      title: "Mann",
      items: [],
    },
  ]);

  

 

  

  // Update section title and auto-fill HSN codes for all items in that section
  const handleSectionTitleChange = (sectionId: string, title: string) => {
    if (readOnly) return; // Prevent updating if read-only

    // Add the custom title to options if it's not already there
    const updatedOptions = addSectionTitleToOptions(title, sectionOptions);
    setSectionOptions(updatedOptions);

    // Persist the updated options to localStorage
    persistSectionOptions(updatedOptions);

    // Update the section title and HSN codes
    setSections((currentSections) => {
      return updateSectionTitle(sectionId, title, currentSections, hsnCodes);
    });
  };

  // Add a new section
  const addNewSection = () => {
    if (readOnly) return; // Prevent adding if read-only

    const newSectionId = Date.now().toString();
    const updatedSections = [
      ...sections,
      {
        id: newSectionId,
        title: sectionOptions[0],
        items: [],
      },
    ];

    setSections(updatedSections);
    saveFieldToLocalStorage("sections", updatedSections);
  };

  // Add a new row to a section with the correct HSN code based on section title
  const addNewRow = (sectionId: string) => {
    if (readOnly) return; // Prevent adding if read-only

    setSections((currentSections) => {
      return currentSections.map((section) => {
        if (section.id === sectionId) {
          const isWallTile = section.title.includes("Wall");
          // Get the HSN code based on the section title
          const hsnCode =
            hsnCodes[section.title] || (isWallTile ? "69072300" : "69072100");

          const newItem: InvoiceItem = {
            id: Date.now().toString(),
            product: {
              id: Date.now().toString(),
              description: isWallTile ? "1621" : "LUCKY PANDA",
              hsnCode: hsnCode,
              size: isWallTile ? "300X600" : "600X1200",
              price: 0,
              sqmPerBox: 0,
              marksAndNos: `${markParts[0]}X${markParts[1]}${markParts[2]}`,
              netWeight: "0.00", // Initialize with default value
              grossWeight: "0.00", // Initialize with default value
            },
            quantity: 1000,
            unitType: "BOX",
            totalSQM: 0,
            totalFOB: 0,
          };

          return {
            ...section,
            items: [...section.items, newItem],
          };
        }
        return section;
      });
    });
  };

  // Remove a row from a section
  const removeRow = (sectionId: string, itemId: string) => {
    if (readOnly) return; // Prevent removing if read-only

    setSections((currentSections) => {
      const updatedSections = currentSections.map((section) => {
        if (section.id === sectionId) {
          const updatedItems = section.items.filter(
            (item) => item.id !== itemId
          );
          return { ...section, items: updatedItems };
        }
        return section;
      });
      return updatedSections;
    });
  };

  // Update product description
  const handleDescriptionChange = (
    sectionId: string,
    itemId: string,
    description: string
  ) => {
    if (readOnly) return; // Prevent updating if read-only

    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        description,
                      },
                    }
                  : item
              ),
            }
          : section
      )
    );
  };

  
  // Update HSN code
  const handleHSNChange = (
    sectionId: string,
    itemId: string,
    hsnCode: string
  ) => {
    if (readOnly) return; // Prevent updating if read-only

    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        hsnCode,
                      },
                    }
                  : item
              ),
            }
          : section
      )
    );
  };

  // Update size
  const handleSizeChange = (
    sectionId: string,
    itemId: string,
    size: string
  ) => {
    if (readOnly) return; // Prevent updating if read-only

    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        size,
                      },
                    }
                  : item
              ),
            }
          : section
      )
    );
  };

  // Update quantity
  const handleQuantityChange = (
    sectionId: string,
    itemId: string,
    quantity: number
  ) => {
    if (readOnly) return; // Prevent updating if read-only

    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      quantity,
                    }
                  : item
              ),
            }
          : section
      )
    );
  };

  // Update net weight - Always allowed regardless of readOnly
  const handleNetWeightChange = (
    sectionId: string,
    itemId: string,
    weight: string,
    productName: string
  ) => {
    // Do not check readOnly for this field

    // Update sections state
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        netWeight: weight,
                      },
                    }
                  : item
              ),
            }
          : section
      )
    );

    // Safely update invoice data if it exists
    if (formData?.invoice?.products?.product_list) {
      // Create a safe copy of the product list
      const updatedProductList = formData.invoice.products.product_list.map(
        (product) => {
          if (product.product_name === productName) {
            return {
              ...product,
              net_weight: weight,
            };
          }
          return product;
        }
      );

      // Update invoice data with the new product list
      setInvoiceData({
        ...formData.invoice,
        products: {
          ...formData.invoice.products,
          product_list: updatedProductList,
        },
      });
    }
  };

  // Update gross weight - Always allowed regardless of readOnly
  const handleGrossWeightChange = (
    sectionId: string,
    itemId: string,
    weight: string,
    productName: string
  ) => {
    // Do not check readOnly for this field

    // Update sections state
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        grossWeight: weight,
                      },
                    }
                  : item
              ),
            }
          : section
      )
    );

    // Safely update invoice data if it exists
    if (formData?.invoice?.products?.product_list) {
      // Create a safe copy of the product list
      const updatedProductList = formData.invoice.products.product_list.map(
        (product) => {
          if (product.product_name === productName) {
            return {
              ...product,
              gross_weight: weight,
            };
          }
          return product;
        }
      );

      // Update invoice data with the new product list
      setInvoiceData({
        ...formData.invoice,
        products: {
          ...formData.invoice.products,
          product_list: updatedProductList,
        },
      });
    }
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
  const [totalPalletCount, setTotalPalletCount] = useState<string>("");
  // dummy values
  const [containerRows, setContainerRows] = useState<ContainerInfo[]>([
    {
      id: "1",
      containerNo: "",
      lineSealNo: "",
      rfidSeal: "",
      designNo: "",
      quantity: "",
      netWeight: "",
      grossWeight: "",
    },
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
        grossWeight: lastRow.grossWeight,
      };
    } else {
      // Default values for first row
      newRow = {
        id: Date.now().toString(),
        containerNo: "",
        lineSealNo: "",
        rfidSeal: "",
        designNo: "",
        quantity: 0,
        netWeight: "",
        grossWeight: "",
      };
    }

    const updatedRows = [...containerRows, newRow];
    setContainerRows(updatedRows);
    saveFieldToLocalStorage("containerRows", updatedRows);
  };

  // Remove container row
  const removeContainerRow = (id: string) => {
    const updatedRows = containerRows.filter((row) => row.id !== id);
    setContainerRows(updatedRows);
    saveFieldToLocalStorage("containerRows", updatedRows);

    // Also update total weights
    saveFieldToLocalStorage(
      "net_weight",
      calculateTotalWeight(updatedRows, "netWeight")
    );
    saveFieldToLocalStorage(
      "gross_weight",
      calculateTotalWeight(updatedRows, "grossWeight")
    );
  };

  // Calculate total weight from container rows
  const calculateTotalWeight = (
    rows: ContainerInfo[],
    weightField: "netWeight" | "grossWeight"
  ): string => {
    const total = rows.reduce((sum, row) => {
      const weight = parseFloat(row[weightField] || "0");
      return isNaN(weight) ? sum : sum + weight;
    }, 0);
    return total.toString();
  };

  // Update container field
  const updateContainerField = (
    id: string,
    field: keyof ContainerInfo,
    value: any
  ) => {
    setContainerRows((currentRows) => {
      const updatedRows = currentRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      );

      // Save container rows to localStorage
      saveFieldToLocalStorage("containerRows", updatedRows);

      // If updating weights, also save them separately
      if (field === "netWeight") {
        saveFieldToLocalStorage(
          "net_weight",
          calculateTotalWeight(updatedRows, "netWeight")
        );
      } else if (field === "grossWeight") {
        saveFieldToLocalStorage(
          "gross_weight",
          calculateTotalWeight(updatedRows, "grossWeight")
        );
      }

      return updatedRows;
    });
  };

  // Container type is already declared above

  // Extract container type from markNumber
  useEffect(() => {
    if (markNumber) {
      if (markNumber.includes("LCL")) {
        setContainerType("LCL");
      } else if (markNumber.includes("FCL")) {
        setContainerType("FCL");
      }
    }
  }, [markNumber]);

  // Add a handler for when the marks and numbers change
  const handleMarksAndNumbersChange = (value: string) => {
    if (value === "LCL") {
      setContainerType("LCL");
      setMarkParts(["", "", "LCL"]);
      saveFieldToLocalStorage("containerType", "LCL");
      saveFieldToLocalStorage("markParts", ["", "", "LCL"]);
      saveFieldToLocalStorage("markNumber", "LCL");
    } else {
      // Parse the value in the format "10X20 FCL"
      const parts = value.match(/^(\d+)X(\d+)\s+(\w+)$/);
      if (parts) {
        setContainerType(parts[3]);
        setMarkParts([parts[1], parts[2], parts[3]]);
        saveFieldToLocalStorage("containerType", parts[3]);
        saveFieldToLocalStorage("markParts", [parts[1], parts[2], parts[3]]);
        saveFieldToLocalStorage("markNumber", value);
      }
    }
  };



  function formatCustomDate(
    inputDate: string | null | undefined,
    outputFormat: string = "PP"
  ): string {
    if (!inputDate) return "";

    const parsed = parse(inputDate, "dd/MM/yyyy", new Date());

    if (!isValid(parsed)) return "";

    return format(parsed, outputFormat);
  }

  function convertProductsToSections(productsData) {
    if (!productsData?.product_list?.length) return [];

    // Group products by category_name
    const groupedByCategory = productsData.product_list.reduce(
      (acc, product) => {
        const category = product.category_name || "Untitled Section";
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
      },
      {}
    );

    // Convert each group to a section
    const sections = Object.entries(groupedByCategory).map(
      ([category, items], index) => ({
        id: `section-${index + 1}`,
        title: category,
        items: items.map((product, idx) => ({
          id: `item-${index + 1}-${idx + 1}`,
          quantity: product.quantity,
          product: {
            hsnCode: product.hsn_code || "",
            description: product.product_name,
            size: product.size,
            netWeight: product.net_weight == 0 ? "" : product.net_weight,
            grossWeight: product.gross_weight == 0 ? "" : product.gross_weight,
          },
        })),
      })
    );

    return sections;
  }

  useEffect(() => {
    const productData = JSON.parse(localStorage.getItem("invoiceData2"));
    if (productData?.products) {
      const transformedSections = convertProductsToSections(
        productData.products
      );
      setSections(transformedSections);
    }
  }, []);

  function updateInvoiceProducts(formData, newObject) {
    const updatedForm = { ...formData };

    const newProductList = newObject.products?.product_list || [];

     // Flatten all net_weight/gross_weight entries
  const flatWeights = newObject.products?.product_list?.flatMap(p =>
    p.items?.map(item => ({
      net_weight: parseFloat(item.net_weight || 0),
      gross_weight: parseFloat(item.gross_weight || 0),
    })) || []
  ) || [];

  let weightIndex = 0;

  // Sequentially assign weights to products
  updatedForm.products.product_list = updatedForm.products.product_list.map(product => {
    const weightEntry = flatWeights[weightIndex] || { net_weight: 0, gross_weight: 0 };
    weightIndex += 1;

    return {
      ...product,
      net_weight: weightEntry.net_weight,
      gross_weight: weightEntry.gross_weight,
    };
  });

    // ✅ Copy containers
    if (Array.isArray(newObject.products?.containers)) {
      updatedForm.products.containers = [...newObject.products.containers];
    }
    updatedForm.products["total_pallet_count"] =
      newObject.products?.total_pallet_count || "";

    // ✅ Calculate total weights
    let totalNetWeight = 0;
    let totalGrossWeight = 0;

    updatedForm.products.containers.forEach((product) => {
      totalNetWeight += parseFloat(product.net_weight || 0);
      totalGrossWeight += parseFloat(product.gross_weight || 0);
    });

    // ✅ Store totals in formData.package
    if (!updatedForm.package) updatedForm.package = {};
    updatedForm.package.net_weight = totalNetWeight.toFixed(2);
    updatedForm.package.gross_weight = totalGrossWeight.toFixed(2);

    return updatedForm;
  }

  function handleNext(data) {
    let finalData = updateInvoiceProducts(formData, data);
    // console.log(finalData);
    localStorage.setItem("invoiceData2", JSON.stringify(finalData));

    navigate("/annexure");
  }

  // Handle potential rendering errors
  try {
    return (
      <div className="space-y-6">
        {/* Add the Customs Invoice Header */}
        <div className="bg-white p-6 shadow-sm border rounded-lg">
          <h1 className="text-3xl font-bold text-center mb-2">
            PACKAGING LIST
          </h1>
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
                    <Input
                      value={formData.exporter.company_name}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Address</Label>
                    <textarea
                      className="w-full p-2 rounded-md border bg-gray-50"
                      value={formData.exporter.company_address}
                      readOnly
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={formData.exporter.email}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID</Label>
                    <Input
                      value={formData.exporter.tax_id}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Invoice Number</Label>
                      <Input
                        value={formData.invoice_number || ""}
                        readOnly
                        className="bg-gray-50 font-medium"
                        placeholder="No invoice number available"
                      />
                      {!formData.invoice_number && (
                        <p className="text-xs text-red-500 mt-1">
                          Invoice number not found
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Date</Label>
                      <Input
                        value={
                          formData?.invoice_date
                            ? formatCustomDate(formData?.invoice_date)
                            : ""
                        }
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
                      <Input
                        value={formData?.exporter.ie_code}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PAN No. #</Label>
                      <Input
                        value={formData?.exporter.pan_number}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GSTIN No. #</Label>
                      <Input
                        value={formData?.exporter.gstin_number}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State Code</Label>
                      <Input
                        value={formData?.exporter.state_code}
                        readOnly
                        className="bg-gray-50"
                      />
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
                      <Input
                        value={buyer.buyer_order_no}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Order Date</Label>
                      <Input
                        value={
                          buyer.buyer_order_date
                            ? formatCustomDate(buyer.buyer_order_date)
                            : ""
                        }
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>PO No.</Label>
                    <Input
                      value={buyer?.po_no || "unavailable"}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="space-y-2">
                      <Label>Consignee</Label>
                      <Input
                        value={buyer.consignee}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notify Party</Label>
                      <Input
                        value={buyer.notify_party}
                        readOnly
                        className="bg-gray-50"
                      />
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
                  <Input
                    value={shipping.pre_carriage_by}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Place of Receipt</Label>
                  <Input
                    value={shipping.place_of_receipt}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Origin Details</Label>
                  <Input
                    value={shipping.origin_details}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vessel/Flight No.</Label>
                  <Input
                    value={shipping.vessel_flight_no}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port of Loading</Label>
                  <Input
                    value={shipping.port_of_loading}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port of Discharge</Label>
                  <Input
                    value={shipping.port_of_discharge}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Final Destination</Label>
                  <Input
                    value={shipping.final_destination}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country of Final Destination</Label>
                  <Input
                    value={shipping.country_of_final_destination}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country of Origin</Label>
                  <Input
                    value={shipping.country_of_origin}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Terms of Delivery</Label>
                  <Input
                    value={shipping.terms_of_delivery}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Input
                    value={shipping?.payment}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Method</Label>
                  <Input
                    value={shipping?.shipping_method}
                    readOnly
                    className="bg-gray-50"
                  />
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
                      {containerType === "LCL"
                        ? "LCL"
                        : `${markParts[0]} ${markParts[1]} ${markParts[2]}`}
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
              {sections && sections.length > 0 ? (
                sections.map((section, sectionIndex) => (
                  <div
                    key={section.id || `section-${sectionIndex}`}
                    className="space-y-4 border"
                  >
                    <Table className="border">
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="border font-bold text-center w-16">
                            SR NO
                          </TableHead>
                          <TableHead className="border font-bold text-center">
                            HSN CODE
                          </TableHead>
                          <TableHead className="border font-bold text-center">
                            Description of Goods
                          </TableHead>
                          <TableHead className="border font-bold text-center w-32">
                            Size
                          </TableHead>
                          <TableHead className="w-[140px] border font-bold text-center">
                            QUANTITY BOX
                          </TableHead>
                          <TableHead className="w-[140px] border font-bold text-center">
                            NET.WT. IN KGS.
                          </TableHead>
                          <TableHead className="w-[140px] border font-bold text-center">
                            GRS.WT. IN KGS.
                          </TableHead>
                          {!readOnly && (
                            <TableHead className="w-[60px] border font-bold text-center">
                              Actions
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Section Title Row */}
                        {sectionIndex === 0 && (
                          <TableRow className="bg-gray-100">
                            <TableCell
                              colSpan={7}
                              className="border font-bold text-center p-2"
                            >
                              {readOnly ? (
                                <div className="text-center w-full flex justify-center items-center">
                                  {section.title}
                                </div>
                              ) : (
                                <Select
                                  value={section.title}
                                  onValueChange={(value) =>
                                    handleSectionTitleChange(section.id, value)
                                  }
                                  disabled={readOnly}
                                >
                                  <SelectTrigger className="border-0 bg-transparent font-bold">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sectionOptions.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        )}

                        {/* Zero row for second section - Make title selectable */}
                        {sectionIndex === 1 && (
                          <TableRow className="bg-gray-100">
                            <TableCell
                              colSpan={7}
                              className="border font-bold text-center p-2"
                            >
                              {readOnly ? (
                                <div className="text-center w-full flex justify-center items-center">
                                  {section.title}
                                </div>
                              ) : (
                                <Select
                                  value={section.title}
                                  onValueChange={(value) =>
                                    handleSectionTitleChange(section.id, value)
                                  }
                                  disabled={readOnly}
                                >
                                  <SelectTrigger className="border-0 bg-transparent font-bold">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sectionOptions.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        )}

                        {section.items.map((item, itemIndex) => {
                          return (
                            <TableRow
                              key={item.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="border text-center p-0">
                                <div className="p-2">
                                  {sectionIndex === 0
                                    ? itemIndex + 1
                                    : itemIndex + sections[0].items.length + 1}
                                </div>
                              </TableCell>
                              <TableCell className="border p-0">
                                {readOnly ? (
                                  <div className="p-2 text-center">
                                    {item.product.hsnCode}
                                  </div>
                                ) : (
                                  <Input
                                    value={item.product.hsnCode}
                                    onChange={(e) =>
                                      handleHSNChange(
                                        section.id,
                                        item.id,
                                        e.target.value
                                      )
                                    }
                                    className="h-9 border-0"
                                    readOnly={readOnly}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="border p-0">
                                {readOnly ? (
                                  <div className="p-2">
                                    {item.product.description}
                                  </div>
                                ) : (
                                  <Input
                                    value={item.product.description}
                                    onChange={(e) =>
                                      handleDescriptionChange(
                                        section.id,
                                        item.id,
                                        e.target.value
                                      )
                                    }
                                    className="h-9 border-0"
                                    readOnly={readOnly}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="border p-0">
                                {readOnly ? (
                                  <div className="p-2 text-center">
                                    {item.product.size}
                                  </div>
                                ) : (
                                  <Select
                                    value={item.product.size}
                                    onValueChange={(value) =>
                                      handleSizeChange(
                                        section.id,
                                        item.id,
                                        value
                                      )
                                    }
                                    disabled={readOnly}
                                  >
                                    <SelectTrigger className="h-9 border-0">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {sizes.map((size) => (
                                        <SelectItem key={size} value={size}>
                                          {size}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                              <TableCell className="border p-0">
                                {readOnly ? (
                                  <div className="p-2 text-center">
                                    {item.quantity}
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        section.id,
                                        item.id,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="h-9 border-0 text-center"
                                    readOnly={readOnly}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="border p-0">
                                {/* NET.WT. IN KGS. column - Always editable */}
                                <Input
                                  value={item.product.netWeight ?? "0.00"}
                                  {...register(
                                    `products.product_list.${sectionIndex}.items.${itemIndex}.net_weight`,
                                    {
                                      required: true,
                                    }
                                  )}
                                  onChange={(e) => {
                                    handleNetWeightChange(
                                      section.id,
                                      item.id,
                                      e.target.value,
                                      item.product.description
                                    );
                                  }}
                                  className="h-9 border-0 text-center bg-white w-full hover:bg-gray-50 focus:bg-white"
                                  placeholder="Enter net weight"
                                  title="This field is always editable"
                                  readOnly={false}
                                />
                              </TableCell>
                              <TableCell className="border p-0">
                                {/* GRS.WT. IN KGS. column - Always editable */}
                                <Input
                                  value={item.product.grossWeight ?? "0.00"}
                                  {...register(
                                    `products.product_list.${sectionIndex}.items.${itemIndex}.gross_weight`,
                                    {
                                      required: true,
                                    }
                                  )}
                                  onChange={(e) => {
                                    handleGrossWeightChange(
                                      section.id,
                                      item.id,
                                      e.target.value,
                                      item.product.description
                                    );
                                  }}
                                  className="h-9 border-0 text-center bg-white w-full hover:bg-gray-50 focus:bg-white"
                                  placeholder="Enter gross weight"
                                  title="This field is always editable"
                                  readOnly={false}
                                />
                              </TableCell>
                              {!readOnly && (
                                <TableCell className="border p-0 text-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeRow(section.id, item.id)
                                    }
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
                            <TableCell
                              colSpan={readOnly ? 7 : 8}
                              className="text-center py-4 border"
                            >
                              No items added.{" "}
                              {!readOnly && 'Click "Add Row" to add a new row.'}
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
                ))
              ) : (
                <div className="p-4 text-center border">
                  <p className="text-gray-500">
                    No product sections available.
                  </p>
                </div>
              )}

              {/* Container Information Table */}
              <div className="space-y-4 border">
                <div className="flex justify-between items-center p-3">
                  <h3 className="font-bold text-lg">Container Information</h3>
                  <div className="flex items-center gap-4">
                    {/* Invoice No and Payment Terms commented out as requested */}
                    {/* 
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Invoice No:</span>
                    <span className="font-bold">{invoiceNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Payment Terms:</span>
                    <span className="font-bold">{paymentTerms}</span>
                  </div>
                  */}
                  </div>
                </div>

                <Table className="border w-full">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="border font-bold text-center w-[15%]">
                        CONTAINER NO.
                      </TableHead>
                      <TableHead className="border font-bold text-center w-[12%]">
                        LINE SEAL NO.
                      </TableHead>
                      <TableHead className="border font-bold text-center w-[12%]">
                        RFID SEAL
                      </TableHead>
                      <TableHead className="border font-bold text-center w-[12%]">
                        Design no
                      </TableHead>
                      <TableHead className="border font-bold text-center w-[10%]">
                        QUANTITY BOX
                      </TableHead>
                      <TableHead className="border font-bold text-center w-[15%]">
                        NET.WT. IN KGS.
                      </TableHead>
                      <TableHead className="border font-bold text-center w-[15%]">
                        GRS.WT. IN KGS.
                      </TableHead>
                      <TableHead className="w-[60px] border font-bold text-center">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {containerRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="border p-0">
                          <Input
                            value={row.containerNo}
                            {...register(
                              `products.containers.${index}.container_no`,
                              {
                                required: true,
                              }
                            )}
                            onChange={(e) =>
                              updateContainerField(
                                row.id,
                                "containerNo",
                                e.target.value
                              )
                            }
                            className="h-10 border-0 text-center bg-white w-full"
                            placeholder="Enter container no."
                          />
                        </TableCell>
                        <TableCell className="border p-0">
                          <Input
                            value={row.lineSealNo}
                            {...register(
                              `products.containers.${index}.line_seal_no`,
                              {
                                required: true,
                              }
                            )}
                            onChange={(e) =>
                              updateContainerField(
                                row.id,
                                "lineSealNo",
                                e.target.value
                              )
                            }
                            className="h-10 border-0 text-center bg-white w-full"
                            placeholder="Enter line seal no."
                          />
                        </TableCell>
                        <TableCell className="border p-0">
                          <Input
                            value={row.rfidSeal}
                            {...register(
                              `products.containers.${index}.rfid_seal`,
                              {
                                required: true,
                              }
                            )}
                            onChange={(e) =>
                              updateContainerField(
                                row.id,
                                "rfidSeal",
                                e.target.value
                              )
                            }
                            className="h-10 border-0 text-center bg-white w-full"
                            placeholder="Enter RFID seal"
                          />
                        </TableCell>
                        <TableCell className="border p-0">
                          <Input
                            value={row.designNo}
                            {...register(
                              `products.containers.${index}.design_no`,
                              {
                                required: true,
                              }
                            )}
                            onChange={(e) =>
                              updateContainerField(
                                row.id,
                                "designNo",
                                e.target.value
                              )
                            }
                            className="h-10 border-0 text-center bg-white w-full"
                            placeholder="Enter design no."
                          />
                        </TableCell>
                        <TableCell className="border p-0">
                          <Input
                            type="text"
                            value={row.quantity}
                            {...register(
                              `products.containers.${index}.quantity`,
                              {
                                required: true,
                              }
                            )}
                            onChange={(e) =>
                              updateContainerField(
                                row.id,
                                "quantity",
                                parseInt(e.target.value) || ""
                              )
                            }
                            className="h-10 border-0 text-center bg-white w-full"
                            placeholder="Enter quantity"
                          />
                        </TableCell>
                        <TableCell className="border p-0">
                          <Input
                          type={"text"}
                            value={row.netWeight}
                            {...register(
                              `products.containers.${index}.net_weight`,
                              {
                                required: true,
                              }
                            )}
                            onChange={(e) =>
                              updateContainerField(
                                row.id,
                                "netWeight",
                                e.target.value
                              )
                            }
                            className="h-10 border-0 text-center bg-white w-full"
                            placeholder="Enter net weight"
                          />
                        </TableCell>
                        <TableCell className="border p-0">
                          <Input
                          type={"text"}
                            value={row.grossWeight}
                            {...register(
                              `products.containers.${index}.gross_weight`,
                              {
                                required: true,
                              }
                            )}
                            onChange={(e) =>
                              updateContainerField(
                                row.id,
                                "grossWeight",
                                e.target.value
                              )
                            }
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
                        Total &nbsp;&nbsp;&nbsp;
                        &gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="border p-4 text-center bg-gray-50 text-lg"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-[16px] text-center font-bold">
                            TOTAL PALLET -
                          </span>
                          <Input
                            value={totalPalletCount}
                            {...register("products.total_pallet_count", {
                              required: true,
                            })}
                            onChange={(e) => {
                              setTotalPalletCount(e.target.value);
                              saveFieldToLocalStorage(
                                "totalPalletCount",
                                e.target.value
                              );
                            }}
                            className="h-8 border-0 text-center bg-gray-300 font-bold w-14 p-0 mx-1"
                          />
                          <span className="text-[16px] text-center font-bold">
                            NOS
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[16px] text-center font-bold">
                        {containerRows.reduce(
                          (sum, row) => sum + row.quantity,
                          0
                        )}
                      </TableCell>
                      <TableCell className="text-[16px] text-center font-bold">
                        {containerRows
                          .reduce(
                            (sum, row) =>
                              sum + parseFloat(row.netWeight || "0"),
                            0
                          )
                          .toFixed(2)}
                      </TableCell>
                      <TableCell className="text-[16px] text-center font-bold">
                        {containerRows
                          .reduce(
                            (sum, row) =>
                              sum + parseFloat(row.grossWeight || "0"),
                            0
                          )
                          .toFixed(2)}
                      </TableCell>
                      <TableCell className="border bg-gray-50"></TableCell>
                    </TableRow>

                    {/* Unit Row */}
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="border bg-gray-100"
                      ></TableCell>
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
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              {/* <Button onClick={ () => {
               

                 handleSaveInvoice()
              }}>
                <Save className="mr-2 h-4 w-4" />
                Save Invoice
              </Button> */}
              <Button variant="default" onClick={handleSubmit(handleNext)}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    // Error rendering PackagingList
    console.log(error);

    return (
      <div className="p-6 bg-white shadow rounded-lg">
        <h2 className="text-xl font-bold text-red-600">
          Error Rendering Packaging List
        </h2>
        <p className="mt-2">
          There was an error rendering the packaging list. Please try again or
          contact support.
        </p>
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto text-sm">
          {error instanceof Error ? error.message : "Unknown error"}
        </pre>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }
};

export default PackagingList;

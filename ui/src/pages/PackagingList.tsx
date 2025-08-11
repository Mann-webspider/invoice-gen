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

import { useDraftForm } from "@/hooks/useDraftForm";
import { nanoid } from "nanoid"; 



const PackagingList = ({
  onBack,
  

  readOnly = true,

  form:methods2
  
}: PackagingListProps) => {
  
  const methods = useFormContext()
  const { methods:form, isReady,hydrated,saveDraft ,draftId,isDraftMode} = useDraftForm({
    formType: 'packaging-list',
    methods,
    isDraftMode: location.pathname.includes("/drafts/"),
  });
  const { register, watch, handleSubmit ,getValues,setValue} = methods ;

 
  // console.log(getValues());

 
  function onBack2(){
    if(location.pathname.includes("/drafts/")){
      navigate(`/invoice/drafts/${draftId}`)
      return;
    }
    navigate("/invoice")
  }

  // Solution: Move to useEffect or useCallback
const [formData, setFormData] = useState(null);





 
 
  const [containerType, setContainerType] = useState<string>("FCL");
 
  // Get current form ID for localStorage
  const currentFormId =
    formData?.invoice.invoice_number 



 

  // Get the exporter data directly from localStorage - this is the most reliable method
  const exporterDataStr = localStorage.getItem("directExporterData");

  // Get order data from localStorage
  const orderDataStr = localStorage.getItem("orderData");
  let orderData = {
    order_no: "",
    order_date: "",
    po_no: "",
    consignee:"",
    notify_party:""
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
  let selectedExporterData = {
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
      const parsedData = JSON.parse(exporterDataStr);
      selectedExporterData = {
        ...selectedExporterData,
        ...parsedData,
      };
    } catch (error) {
      // Error parsing selected exporter data
    }
  }

  

  const buyer = formData?.invoice.buyer || {};
  const shipping = formData?.invoice.shipping || {};
  const products = formData?.invoice.products

  // Get invoice number based on all possible sources with explicit type checking
  let invoiceNumber = "";



  
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

    const newSectionId = nanoid();
    const updatedSections = [
      ...sections,
      {
        id: newSectionId,
        title: sectionOptions[0],
        items: [],
      },
    ];

    setSections(updatedSections);
    
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
            id: nanoid(),
            product: {
              id: nanoid(),
              description: isWallTile ? "1621" : "LUCKY PANDA",
              hsnCode: hsnCode,
              size: isWallTile ? "300X600" : "600X1200",
              price: 0,
              sqmPerBox: 0,
              marksAndNos: `${markParts[0]}X${markParts[1]}${markParts[2]}`,
              netWeight: "", // Initialize with default value
              grossWeight: "", // Initialize with default value
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
  const [containerRows, setContainerRows] = useState([
    {
      id: "1",
      containerNo: "",
      lineSealNo: "",
      rfidSeal: "",
      designNo: "",
      quantity: 0,
      netWeight: "",
      grossWeight: "",
    },
  ]);
  useEffect(() => {
  
  // if (!hydrated) return;
  let formDraft = getValues()
  console.log("Form Draft:", formDraft?.containerRows?.length != 0);
  
  setFormData(()=>formDraft);
setContainerRows(prev => 
  (formDraft?.containerRows?.length ?? 0) !== 0 
    ? formDraft.containerRows 
    : prev
);



  setTotalPalletCount(formDraft?.totalPallet || "");
}, [hydrated]);
 useEffect(()=>{
    setValue("containerRows", containerRows);
    setValue("totalPallet", totalPalletCount);
  },[containerRows,totalPalletCount])
  // Add new container row
  const addContainerRow = () => {
    let newRow: ContainerInfo;

    // If there are existing rows, copy values from the last row
    if (containerRows.length > 0) {
      const lastRow = containerRows[containerRows.length - 1];
      newRow = {
        id: nanoid(),
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
        id: nanoid(),
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
    
  };

  // Remove container row
  const removeContainerRow = (id: string) => {
    const updatedRows = containerRows.filter((row) => row.id !== id);
    setContainerRows(updatedRows);
    

    
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
      

      // If updating weights, also save them separately
     

      return updatedRows;
    });
  };

  // Container type is already declared above

 

  // Add a handler for when the marks and numbers change
  const handleMarksAndNumbersChange = (value: string) => {
    if (value === "LCL") {
      setContainerType("LCL");
      setMarkParts(["", "", "LCL"]);
      
    } else {
      // Parse the value in the format "10X20 FCL"
      const parts = value.match(/^(\d+)X(\d+)\s+(\w+)$/);
      if (parts) {
        setContainerType(parts[3]);
        setMarkParts([parts[1], parts[2], parts[3]]);
       
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

  
  function convertToSection(productArray) {
  if (!Array.isArray(productArray)) productArray = [productArray];

  const sectionMap = new Map();

  for (const item of productArray) {
    const sectionKey = item.category_id + "::" + item.category_name;

    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, {
        id: nanoid(), // or use uuidv4()
        title: item.category_name,
        items: [],
      });
    }

    sectionMap.get(sectionKey).items.push({
      id: nanoid(),
      product: {
        hsnCode: item.hsn_code,
        description: item.product_name || "",
        size: item.size,
        sqmPerBox: item.sqm,
        price: item.price,
        
        marksAndNos: "1020 FCL",
      },
      quantity: item.quantity,
      unitType: item.unit,
      totalSQM: item.quantity * item.sqm,
      totalFOB: item.quantity * item.price,
    });
  }

  return Array.from(sectionMap.values());
}

  useEffect(() => {
    const productData = formData?.invoice.products.product_list
    
    if (productData) {
      const transformedSections = convertToSection(
        productData
      );
      console.log(transformedSections);
      setSections(transformedSections);
    }
  }, [formData?.invoice.products.product_list]);

  function updateInvoiceProducts(formData, newObject) {
    const updatedForm = { ...formData };
    console.log(newObject);
    
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
  updatedForm.invoice.products.product_list = updatedForm.invoice.products.product_list.map(product => {
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
      updatedForm.invoice.products.containers = [...newObject.products.containers];
    }
    updatedForm.invoice.products["total_pallet_count"] =
      newObject.products?.total_pallet_count || "";

    // ✅ Calculate total weights
    let totalNetWeight = 0;
    let totalGrossWeight = 0;

    updatedForm.invoice.products.containers.forEach((product) => {
      totalNetWeight += parseFloat(product.net_weight || 0);
      totalGrossWeight += parseFloat(product.gross_weight || 0);
    });

    // ✅ Store totals in formData.package
    if (!updatedForm.invoice.package) updatedForm.invoice.package = {};
    updatedForm.invoice.package.net_weight = totalNetWeight.toFixed(2);
    updatedForm.invoice.package.gross_weight = totalGrossWeight.toFixed(2);

    return updatedForm;
  }

  async function handleNext(data) {
    // let finalData = updateInvoiceProducts(formData, data);
    // console.log(finalData);
    // localStorage.setItem("invoiceData2", JSON.stringify(finalData));
   let res = await saveDraft({ last_page: 'annexure' }); // Update to next page
    navigate(`/annexure/drafts/${res.id}`)
    // navigate("/annexure");
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
                      value={formData?.invoice?.exporter?.company_name}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Address</Label>
                    <textarea
                      className="w-full p-2 rounded-md border bg-gray-50"
                      value={formData.invoice.exporter.company_address}
                      readOnly
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={formData.invoice.exporter.email}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID</Label>
                    <Input
                      value={formData.invoice.exporter.tax_id}
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
                        value={formData.invoice.invoice_number || ""}
                        readOnly
                        className="bg-gray-50 font-medium"
                        placeholder="No invoice number available"
                      />
                      {!formData.invoice.invoice_number && (
                        <p className="text-xs text-red-500 mt-1">
                          Invoice number not found
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Date</Label>
                      <Input
                        value={
                          formData?.invoice.invoice_date
                            ? formatCustomDate(formData?.invoice.invoice_date)
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
                        value={formData?.invoice.exporter.ie_code}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PAN No. #</Label>
                      <Input
                        value={formData?.invoice.exporter.pan_number}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GSTIN No. #</Label>
                      <Input
                        value={formData?.invoice.exporter.gstin_number}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State Code</Label>
                      <Input
                        value={formData?.invoice.exporter.state_code}
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
                        value={buyer?.buyer_order_no}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Order Date</Label>
                     <Input
  value={
    buyer?.buyer_order_date
      ? new Date(buyer?.buyer_order_date).toLocaleDateString('en-GB')
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
                        value={buyer?.consignee}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notify Party</Label>
                      <Input
                        value={buyer?.notify_party}
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
                        : `${products?.leftValue} X ${products?.rightValue} ${products?.nos}`}
                    </div>
                  </div>
                ) : (
                  <></>
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
                        {sectionIndex && (
                          <TableRow className="bg-gray-100">
                            <TableCell
                              colSpan={7}
                              className="border font-bold text-center p-2"
                            >
                              
                                <div className="text-center w-full flex justify-center items-center">
                                  {section.title}
                                </div>
                              
                            </TableCell>
                          </TableRow>
                        )}
                        {console.log("Section Items:", section)}
                        {section.items.map((item, itemIndex) => {
                          const calculateCumulativeIndex = (sections, sectionIndex, itemIndex) => {
                            let cumulativeIndex = 0;
                            for (let i = 0; i < sectionIndex; i++) {
                              cumulativeIndex += sections[i].items.length;
                            }
                            return cumulativeIndex + itemIndex;
                          };
                         // Calculate cumulative index for both SR NO and product registration
                            let cumulativeIndex = 0;
                            for (let i = 0; i < sectionIndex; i++) {
                              cumulativeIndex += sections[i].items.length;
                            }
                            const actualProductIndex = calculateCumulativeIndex(sections, sectionIndex, itemIndex);
                            const srNumber = actualProductIndex + 1; // SR NO is 1-based

                            console.log(`Section ${sectionIndex} (${section.title}), Item ${itemIndex} -> SR NO: ${srNumber}, Product Index: ${actualProductIndex}`);
                          return (
                            <TableRow
                              key={item.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="border text-center p-0">
                                <div className="p-2">
                                  {srNumber}
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
                                type={"text"}
                                  value={item.product.netWeight}
                                  {...register(
                                    `invoice.products.product_list.${actualProductIndex}.net_weight`,
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
                                type={"text"}
                                  value={item.product.grossWeight}
                                  {...register(
                                    `invoice.products.product_list.${actualProductIndex}.gross_weight`,
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
                              `invoice.products.containers.${index}.container_no`,
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
                              `invoice.products.containers.${index}.line_seal_no`,
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
                              `invoice.products.containers.${index}.rfid_seal`,
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
                              `invoice.products.containers.${index}.design_no`,
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
                              `invoice.products.containers.${index}.quantity`,
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
                              `invoice.products.containers.${index}.net_weight`,
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
                              `invoice.products.containers.${index}.gross_weight`,
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
                            {...register("invoice.products.total_pallet_count", {
                              required: false,
                            })}
                            onChange={(e) => {
                              setTotalPalletCount(e.target.value);
                             
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
              <Button variant="outline" onClick={onBack2}>
                Back
              </Button>
               
              <div className="flex gap-2">

              <Button onClick={saveDraft}>
                
                save
              </Button>
              <Button onClick={() => console.log(getValues())}>
                Debug Form
              </Button>
              <Button variant="default" onClick={handleSubmit(handleNext)}>
                Next
              </Button>
              </div>
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

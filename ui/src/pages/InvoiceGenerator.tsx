import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Use react-router-dom for navigation
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash, Plus, FileText, Save, ArrowRight } from "lucide-react";
import { saveInvoice } from "@/lib/dataService";
import {
  Client,
  Product,
  ShippingTerm,
  CompanyProfile,
  InvoiceItem,
  Invoice,
  ProductSection,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import InvoicePDFPreview from "@/components/InvoicePDFPreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MarksAndNumbers from "@/components/MarksAndNumbers";
import ExporterInfo from "@/components/forms/ExporterInfo";
import { SupplierDetails } from "@/components/forms/SupplierDetails";
import ShippingInformationPage from "@/components/forms/ShippingInformationPage";
import BuyerInformationCard from "@/components/forms/BuyerInformationCard";
import PackageInfoSection from "@/components/forms/PackageInfoSection";
import ProductInformation from "@/components/forms/ProductInfomation";
import { useForm } from "@/context/FormContext";
import api from "@/lib/axios";
import { Controller, useForm as rhf } from "react-hook-form";

// Check if invoice data exists in local storage
const invoiceData = localStorage.getItem("invoiceData");

// Helper function to convert number to words for invoice use

function numberToWords(num: number) {
  const ones = [
    "",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
  ];
  const tens = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];
  const scales = ["", "THOUSAND", "MILLION", "BILLION"];

  if (num === 0) return "ZERO";

  const numStr = num.toString();
  if (numStr.length > 12) return "Number too large";

  const result = [];
  let scaleIndex = 0;
  let start = numStr.length;

  while (start > 0) {
    const end = start;
    start = Math.max(0, start - 3);

    const chunk = parseInt(numStr.substring(start, end));
    if (chunk !== 0) {
      let chunkStr = "";

      const hundreds = Math.floor(chunk / 100);
      const remainder = chunk % 100;

      if (hundreds > 0) {
        chunkStr = ones[hundreds] + " HUNDRED";
        if (remainder > 0) chunkStr += " AND ";
      }

      if (remainder > 0) {
        if (remainder < 20) {
          chunkStr += ones[remainder];
        } else {
          const ten = Math.floor(remainder / 10);
          const one = remainder % 10;
          chunkStr += tens[ten] + (one > 0 ? " " + ones[one] : "");
        }
      }

      if (scaleIndex > 0 && chunkStr !== "") {
        chunkStr += " " + scales[scaleIndex];
      }

      result.unshift(chunkStr);
    }

    scaleIndex++;
  }

  return result.join(" ") + " ONLY";
}

const InvoiceGenerator = () => {
  const navigate = useNavigate(); // Use useNavigate from react-router-dom
  const { formData, setInvoiceData } = useForm();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingTerms, setShippingTerms] = useState<ShippingTerm[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null
  );

  const [previewOpen, setPreviewOpen] = useState(false);
  const [taxOptionDialogOpen, setTaxOptionDialogOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const form = rhf({
  "invoice_number": "",
  "exporter": {
    "id": "",
    "company_name": "",
    "company_address": "",
    "contact_number": "",
    "email": "",
    "tax_id": "",
    "ie_code": "",
    "pan_number": "",
    "gstin_number": "",
    "state_code": "",
    "authorized_name": "",
    "authorized_designation": "",
    "company_prefix": "",
    "last_invoice_number": 0,
    "invoice_year": "",
    "letterhead_top_image": "",
    "letterhead_bottom_image": "",
    "stamp_image": "",
    "next_invoice_number": ""
  },
  "invoice_date": "",
  "buyer": {
    "buyer_order_no": "",
    "po_no": "",
    "consignee": "",
    "notify_party": "",
    "buyer_order_date": ""
  },
  "shipping": {
    "pre_carriage_by": "",
    "vessel_flight_no": "",
    "country_of_origin": "",
    "origin_details": "",
    "terms_of_delivery": "",
    "payment": "",
    "place_of_receipt": "",
    "place_of_loading": "",
    "place_of_discharge": "",
    "final_destination": "",
    "country_of_final_destination": "",
    "shipping_method": ""
  },
  "currency_rate": 0,
  "currancy_type": "",
  "products": {
    "nos": "",
    "marks": "",
    "rightValue": "",
    "leftValue": "",
    "insurance":0,
    "freight": 0,
    "product_list": [
      {
        "category_id": "",
        "category_name": "",
        "product_name": "",
        "size": "",
        "quantity": 0,
        "sqm": 0,
        "total_sqm": 0,
        "price": 0,
        "unit": "",
        "total": 0,
        "net_weight": 0,
        "gross_weight": 0
      }
    ],
    "total_price": 0,
    "containers": []
  },
  "package": {
    "no_of_packages": "",
    "no_of_sqm": "",
    "gross_weight": "",
    "net_weight": "",
    "gst_circular": "",
    "arn_no": "",
    "lut_date": "",
    "total_fob": "",
    "amount_in_words": "",
    "gst_amount":0,
    "taxable_value":0
  },
  "invoice": {
    "integrated_tax": "",
    "product_type": ""
  },
  "integrated_tax_option": "",
  "payment_terms": "",
  "product_type": "",
  "suppliers": [
    {
      "tax_invoice_number": "",
      "date": "",
      "name": "",
      "gstin_number": ""
    }
  ]
}
);
  // State for expanded section
  const [expandedSection, setExpandedSection] = useState<
    "exporter" | "shipping" | "product" | "gst"
  >("exporter");

  // Function to toggle section expansion
  const toggleSection = (
    section: "exporter" | "shipping" | "product" | "gst"
  ) => {
    setExpandedSection(section);
  };

  //exporter details
  const [exporterData, setExporterData] = useState([{}]);
  const [exporter, setExporter] = useState({
    company_name: "",
    company_address: "",
    email: "",
    tax_id: "",
    ie_code: "",
    pan_number: "",
    gstin_number: "",
    state_code: "",
    invoice_number: "",
    invoice_date: "",
    consignee: "",
    notify_party: "",
    buyers_order_no: "",
    buyers_order_date: "",
    po_no: "",
  });

  // shipping details
  const [shippingData, setShippingData] = useState({});
  const [shipping, setShipping] = useState({
    pre_carriage_by: "",
    place_of_receipt: "",
    vessel_flight_no: "",
    port_of_loading: "",
    port_of_discharge: "",
    final_destination: "",
    country_of_origin: "",
    origin_details: "",
    country_of_final_destination: "",
    terms_of_delivery: "",
    payment_terms: "",
    shipping_method: "",
  });

  // product details
  const [productData, setProductData] = useState([{}]);
  const [product, setProduct] = useState({
    marks: "",
    nos: "",

    size: "",
    quantity: "",
    price: "",
    total: "",
  });

  const [gstData, setGstData] = useState([{}]);
  const [gst, setGst] = useState({
    arn: "",
    lut_date: "",
    rate: "",
    tax: "",
    total: "",
  });

  // Invoice Header
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [taxid, setTaxid] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [ieCode, setIeCode] = useState("1234567890");
  const [panNo, setPanNo] = useState("");
  const [gstinNo, setGstinNo] = useState("");
  const [stateCode, setStateCode] = useState("24");
  const [buyersOrderNo, setBuyersOrderNo] = useState("");
  const [buyersOrderDate, setBuyersOrderDate] = useState<Date>(new Date());
  const [poNo, setPoNo] = useState("");

  // Supplier Info
  const [authorizedName, setAuthorizedName] = useState("ABC");
  const [authorizedGstin, setAuthorizedGstin] = useState("XXXXXXXXXXXX");
  const [gstInvoiceNoDate, setGstInvoiceNoDate] =
    useState("GST/XXX XX.XX.XXXX");
  const [suppliers, setSuppliers] = useState([]);
  const [declarationText, setDeclarationText] = useState(
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct."
  );

  // Client Info
  const [consignee, setConsignee] = useState("");
  const [notifyParty, setNotifyParty] = useState("");
  const [selectedExporter, setSelectedExporter] = useState<string>("");
  const [companyAddress, setCompanyAddress] = useState("");

  // Shipping Info
  const [selectedShippingTerm, setSelectedShippingTerm] = useState<string>("");
  const [preCarriageBy, setPreCarriageBy] = useState("");
  const [placeOfReceipt, setPlaceOfReceipt] = useState("MORBI");
  const [vesselFlightNo, setVesselFlightNo] = useState("");
  const [portOfLoading, setPortOfLoading] = useState("Mundra");
  const [portOfDischarge, setPortOfDischarge] = useState("NEW YORK");
  const [finalDestination, setFinalDestination] = useState("USA");
  const [countryOfOrigin, setCountryOfOrigin] = useState("INDIA");
  const [originDetails, setOriginDetails] = useState(
    "DISTRICT MORBI, STATE GUJARAT"
  );
  const [countryOfFinalDestination, setCountryOfFinalDestination] =
    useState("USA");
  const [termsOfDelivery, setTermsOfDelivery] = useState("FOB AT MUNDRA PORT");
  const [paymentTerms, setPaymentTerms] = useState("FOB");
  const [shippingMethod, setShippingMethod] = useState(
    "SHIPPING - THROUGH SEA"
  );
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [currencyRate, setCurrencyRate] = useState<number>(88.95);

  // Dropdown options
  const [exporters, setExporters] = useState<string[]>([]);
  const [placesOfReceipt, setPlacesOfReceipt] = useState<string[]>([]);
  const [portsOfLoading, setPortsOfLoading] = useState<string[]>([]);
  const [portsOfDischarge, setPortsOfDischarge] = useState<string[]>([]);
  const [finalDestinations, setFinalDestinations] = useState<string[]>([]);
  const [countriesOfFinalDestination, setCountriesOfFinalDestination] =
    useState<string[]>([]);
  const [shippingMethods, setShippingMethods] = useState<string[]>([
    "SHIPPING - THROUGH SEA",
    "SHIPPING - THROUGH AIR",
  ]);
  const [currencies, setCurrencies] = useState<string[]>([
    "USD",
    "EUR",
    "GBP",
    "INR",
    "AED",
  ]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([
    "Box",
    "Pallet",
    "Carton",
    "Piece",
  ]);
  const [hsnCodes, setHsnCodes] = useState<{ [key: string]: string }>({});
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [paymentTermsOptions, setPaymentTermsOptions] = useState<string[]>([
    "FOB",
    "CIF",
    "CNF",
  ]);

  const [productType, setProductType] = useState<string>("Tiles");
  const [productTypeOptions, setProductTypeOptions] = useState<string[]>([
    "Sanitary",
    "Tiles",
    "Mix",
  ]);

  // Product Info
  const [sections, setSections] = useState<ProductSection[]>([
    {
      id: "",
      title: "",
      items: [],
    },
  ]);

  // Package Info
  const [noOfPackages, setNoOfPackages] = useState("14000 BOX");
  const [grossWeight, setGrossWeight] = useState("");
  const [netWeight, setNetWeight] = useState("");
  const [exportUnderDutyDrawback, setExportUnderDutyDrawback] = useState(true);
  const [ftpIncentiveDeclaration, setFtpIncentiveDeclaration] = useState(
    "I/we shall claim under chapter 3 incentive of FTP as admissible at time policy in force - MEIS, RODTEP"
  );
  const [exportUnderGstCircular, setExportUnderGstCircular] = useState(
    ""
  );
  const [lutNo, setLutNo] = useState("");
  const [lutDate, setLutDate] = useState<Date>(new Date());
  const [integratedTaxOption, setIntegratedTaxOption] = useState<
    "WITH" | "WITHOUT"
  >("WITHOUT");
  const [selectedSupplier, setSelectedSupplier] = useState<Array<object>>([{}]);

  // Totals
  const [totalSQM, setTotalSQM] = useState<number>(0);
  const [totalFOBEuro, setTotalFOBEuro] = useState<number>(0);
  const [amountInWords, setAmountInWords] = useState<string>("");

  // Replace the marksAndNosConfig and containerType state, keeping containerTypes as a reference
  const [marksAndNumbersValues, setMarksAndNumbersValues] = useState({
    containerType: "FCL",
    leftValue: "10",
    rightValue: "20",
  });

  // Add additional state variables for insurance and freight
  const [insuranceAmount, setInsuranceAmount] = useState<number>(0);
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [showInsuranceFreight, setShowInsuranceFreight] =
    useState<boolean>(false);

  // Add the missing markNumber state
  const [markNumber, setMarkNumber] = useState<string>("10X20 FCL");

  // Add a mapping for size to SQM/BOX values
  const [sizeToSqmMap, setSizeToSqmMap] = useState<{ [key: string]: number }>(
    {}
  );

  // Add new state for tracking custom section titles and HSN codes
  const [customSectionHsnCodes, setCustomSectionHsnCodes] = useState<{
    [key: string]: string;
  }>({});
  const [showSectionOptions, setShowSectionOptions] = useState<boolean>(false);

  // Replace the single showSectionOptions state with a map to track each section's dropdown state
  const [openSectionDropdowns, setOpenSectionDropdowns] = useState<{
    [key: string]: boolean;
  }>({});

  // Calculate tax values
  const taxableValue =
    integratedTaxOption === "WITH" ? totalFOBEuro * currencyRate : 0;
  const gstAmount = taxableValue * 0.18; // 18% GST

  // Format date to string
  const formattedLutDate = lutDate ? format(lutDate, "yyyy-MM-dd") : "";

  // Add missing exporterRef state
  const [exporterRef, setExporterRef] = useState<string>("Exp/0001/2024-25");

  useEffect(() => {
    // Always show the tax option dialog when component mounts
    // Force it to be open by default
    setTaxOptionDialogOpen(true);

    // Reset localStorage value to ensure dialog shows
    localStorage.removeItem("taxDialogBox");

    // Set initial data from companyProfile
    if (companyProfile) {
      setPanNo(companyProfile.pan);
      setGstinNo(companyProfile.gstin);
      setDeclarationText(companyProfile.declarationText);
    }

    // Check for annexure data from packaging list
    const annexureDataStr = localStorage.getItem("annexureData");
    const vgmFormDataStr = localStorage.getItem("vgmFormData");

    if (annexureDataStr) {
      try {
        const annexureData = JSON.parse(annexureDataStr);
        if (
          annexureData.containerRows &&
          annexureData.containerRows.length > 0
        ) {
          // Calculate total gross weight and net weight from container rows
          const totalGrossWeight = annexureData.containerRows
            .reduce(
              (sum: number, row: any) =>
                sum + parseFloat(row.grossWeight || "0"),
              0
            )
            .toFixed(2);

          const totalNetWeight = annexureData.containerRows
            .reduce(
              (sum: number, row: any) => sum + parseFloat(row.netWeight || "0"),
              0
            )
            .toFixed(2);

          // Update state with the calculated values
          setGrossWeight(totalGrossWeight);
          setNetWeight(totalNetWeight);
        }
      } catch (error) {
        // Error parsing annexure data - handled silently
      }
    } else if (vgmFormDataStr) {
      // Check if we're returning from VGM form
      try {
        const vgmFormData = JSON.parse(vgmFormDataStr);
        if (vgmFormData.containers && vgmFormData.containers.length > 0) {
          // Use the gross weight from VGM form if available
          const totalGrossWeight = vgmFormData.containers
            .reduce(
              (sum: number, container: any) =>
                sum + parseFloat(container.grossWeight || "0"),
              0
            )
            .toFixed(2);

          // For VGM, we might not have net weight, so only set gross weight
          if (totalGrossWeight && parseFloat(totalGrossWeight) > 0) {
            setGrossWeight(totalGrossWeight);
          }
        }
      } catch (error) {
        // Error parsing VGM form data - handled silently
      }
    }

    // Add an empty row to the first section
    addNewRow(sections[0].id);
  }, []); // Empty dependency array ensures this only runs once on mount

  useEffect(() => {
    // Calculate totals
    let sqmTotal = 0;
    let fobTotal = 0;

    sections.forEach((section) => {
      section.items.forEach((item) => {
        sqmTotal += item.totalSQM;
        fobTotal += item.totalFOB;
      });
    });

    setTotalSQM(sqmTotal);

    // Add insurance and freight if CIF or CNF is selected
    let finalTotal = fobTotal;
    if (paymentTerms === "CIF") {
      finalTotal += insuranceAmount + freightAmount;
    } else if (paymentTerms === "CNF") {
      finalTotal += freightAmount;
    }

    setTotalFOBEuro(finalTotal);
    setAmountInWords(numberToWords(Math.round(finalTotal)));
  }, [sections, insuranceAmount, freightAmount, paymentTerms]);

  // Add effect to update marks and nos for all items when configuration changes
  useEffect(() => {
    setSections(
      sections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          product: {
            ...item.product,
            marksAndNos: `${marksAndNumbersValues.leftValue}${marksAndNumbersValues.rightValue} ${marksAndNumbersValues.containerType}`,
          },
        })),
      }))
    );
  }, [marksAndNumbersValues, sections]);

  const addNewRow = (sectionId: string) => {
    // Find the section to get its title
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    // Determine HSN code based on section title and custom mappings
    let hsnCode;

    
      // First check predefined hsnCodes
      
      
      hsnCode = hsnCodes[section.title];
      
      
      

      // If not found in predefined codes, check custom mappings
      if (!hsnCode) {
        hsnCode = customSectionHsnCodes[section.title];
        
        
      }

      // If still not found and there are existing items, use HSN code from the last item
      if (!hsnCode && section.items.length > 0) {
        hsnCode = section.items[section.items.length - 1].product.hsnCode;
      }

      // // Default fallback
      // if (!hsnCode) {
      //   hsnCode = "69072100";
      // }
    

    // Use the default size and its corresponding SQM value
    const defaultSize = sizes[0];
    const defaultSqmPerBox = sizeToSqmMap[defaultSize] || 1.44;

    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product: {
        id: "",
        description: "",
        hsnCode: hsnCode,
        size: defaultSize,
        price: 0,
        sqmPerBox: defaultSqmPerBox,
        marksAndNos: `${marksAndNumbersValues.leftValue}${marksAndNumbersValues.rightValue} ${marksAndNumbersValues.containerType}`,
      },
      quantity: 0,
      unitType: "Box",
      totalSQM: 0 * defaultSqmPerBox,
      totalFOB: 0,
      sectionId,
    };

    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? { ...section, items: [...section.items, newItem] }
          : section
      )
    );
  };

  const addNewSection = () => {
    // Use the first option from sectionOptions as the default title
    const defaultTitle = sectionOptions[0] || "Glazed porcelain Floor Tiles";

    const newSection: ProductSection = {
      id: Date.now().toString(),
      title: defaultTitle,
      items: [],
    };
    setSections([...sections, newSection]);

    // Add an empty row to the new section
    addNewRow(newSection.id);
  };

  const removeRow = (sectionId: string, itemId: string) => {
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

      // Remove section if it's empty and not the last section
      return updatedSections.filter(
        (section) => section.items.length > 0 || updatedSections.length === 1
      );
    });
  };

  const handleProductSelect = (productId: string, itemId: string) => {
    const product = products.find((p) => p.id === productId);

    if (!product) return;

    setSections(
      sections.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (item.id === itemId) {
            const quantity = item.quantity || 0;
            const totalSQM = quantity * product.sqmPerBox;
            const totalFOB = totalSQM * product.price; // i change this line this can be changed in future id 7 task

            return {
              ...item,
              product,
              totalSQM,
              totalFOB,
            };
          }
          return item;
        }),
      }))
    );
  };

  const handleQuantityChange = (quantity: number, itemId: string) => {
    setSections(
      sections.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (item.id === itemId) {
            const parsedQuantity = quantity || 0;
            const totalSQM = parsedQuantity * item.product.sqmPerBox;
            const totalFOB = parsedQuantity * item.product.price;

            return {
              ...item,
              quantity: parsedQuantity,
              totalSQM,
              totalFOB,
            };
          }
          return item;
        }),
      }))
    );
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);

    if (client) {
      setConsignee(client.consignee);
      setNotifyParty(client.notifyParty);
    }
  };

  const handleShippingTermSelect = (termId: string) => {
    const term = shippingTerms.find((t) => t.id === termId);

    if (term) {
      setSelectedShippingTerm(termId);
      setPortOfLoading(term.port);
      setCurrencyRate(parseFloat(term.euroRate.toString())); // Convert to number before setting

      // Update Terms of Delivery based on current payment terms
      if (paymentTerms === "CIF" || paymentTerms === "CNF") {
        if (paymentTerms === "CIF") {
          setTermsOfDelivery(`CIF AT ${portOfDischarge}`);
        } else {
          setTermsOfDelivery(`CNF AT ${portOfDischarge}`);
        }
      } else {
        setTermsOfDelivery(`FOB AT ${term.port}`);
      }
    }
  };

  const saveInvoiceData = async () => {
    // Validate required fields
    if (!invoiceNo.trim()) {
      if (formSubmitted) {
        toast.error("Please enter an invoice number");
      }
      return;
    }

    if (!buyersOrderNo.trim()) {
      if (formSubmitted) {
        toast.error("Please enter a buyer's order number");
      }
      return;
    }

    if (!poNo.trim()) {
      if (formSubmitted) {
        toast.error("Please enter a PO number");
      }
      return;
    }

    if (!consignee.trim()) {
      if (formSubmitted) {
        toast.error("Please enter a consignee");
      }
      return;
    }

    // if (!selectedShippingTerm) {
    //   if (formSubmitted) {
    //     toast.error("Please select shipping terms");
    //   }
    //   return;
    // }

    if (sections.length === 0) {
      if (formSubmitted) {
        toast.error("Please add at least one section");
      }
      return;
    }

    // const hasEmptyItems = sections.some(section => section.items.some(item => !item.product.id || item.quantity <= 0));
    // if (hasEmptyItems) {
    //   if (formSubmitted) {
    //     toast.error("Please complete all items in all sections");
    //   }
    //   return;
    // }

    // Create invoice object
    const invoice: Invoice = {
      invoiceNo,
      date: invoiceDate,
      client: {
        consignee,
        notifyParty,
        buyerOrderNoFormat: buyersOrderNo,
      },
      items: sections.flatMap((section) => section.items),
      shippingTerm: shippingTerms.find(
        (s) => s.id === selectedShippingTerm
      ) as ShippingTerm,
      totalSQM,
      totalFOBEuro,
      amountInWords,
    };

    // Save invoice to backend
    try {
      const response = await api.post("/invoice", invoice);
      toast.success("Invoice saved successfully");
      if (response.status === 200) {
        // Invoice saved successfully
        return response.data;
      }
    } catch (error) {
      // Error saving invoice - handled silently
      toast.error("Error saving invoice");
      throw error;
    }
  };

  // Add validation state to track which fields are invalid
  const [validationErrors, setValidationErrors] = useState<{
    invoiceNumber: boolean;
    invoiceDate: boolean;
    exporter: boolean;
    consignee: boolean;
    portOfLoading: boolean;
    portOfDischarge: boolean;
    finalDestination: boolean;
    countryOfOrigin: boolean;
    countryOfFinalDestination: boolean;
    termsOfDelivery: boolean;
    paymentTerms: boolean;
    selectedCurrency: boolean;
    productItems: boolean;
  }>({
    invoiceNumber: false,
    invoiceDate: false,
    exporter: false,
    consignee: false,
    portOfLoading: false,
    portOfDischarge: false,
    finalDestination: false,
    countryOfOrigin: false,
    countryOfFinalDestination: false,
    termsOfDelivery: false,
    paymentTerms: false,
    selectedCurrency: false,
    productItems: false,
  });

  // Function to reset validation errors
  const resetValidationErrors = () => {
    setValidationErrors({
      invoiceNumber: false,
      invoiceDate: false,
      exporter: false,
      consignee: false,
      portOfLoading: false,
      portOfDischarge: false,
      finalDestination: false,
      countryOfOrigin: false,
      countryOfFinalDestination: false,
      termsOfDelivery: false,
      paymentTerms: false,
      selectedCurrency: false,
      productItems: false,
    });
  };

  // Add useEffect to reset validation errors when fields are filled
  useEffect(() => {
    // Create a new validation errors object
    const newValidationErrors = { ...validationErrors };

    // Check each field and reset its validation error if it's now filled
    if (formData.invoice?.invoice_number)
      newValidationErrors.invoiceNumber = false;
    if (formData.invoice?.invoice_date) newValidationErrors.invoiceDate = false;
    if (formData.invoice?.exporter?.company_name)
      newValidationErrors.exporter = false;
    if (formData.invoice?.buyer?.consignee)
      newValidationErrors.consignee = false;
    if (portOfLoading) newValidationErrors.portOfLoading = false;
    if (portOfDischarge) newValidationErrors.portOfDischarge = false;
    if (finalDestination) newValidationErrors.finalDestination = false;
    if (countryOfOrigin) newValidationErrors.countryOfOrigin = false;
    if (countryOfFinalDestination)
      newValidationErrors.countryOfFinalDestination = false;
    if (termsOfDelivery) newValidationErrors.termsOfDelivery = false;
    if (paymentTerms) newValidationErrors.paymentTerms = false;
    if (selectedCurrency) newValidationErrors.selectedCurrency = false;

    // Check if sections have at least one item
    const hasSections = sections.length > 0;
    const hasItems = sections.some((section) => section.items.length > 0);
    if (hasSections && hasItems) newValidationErrors.productItems = false;

    // Update validation errors state if any changes were made
    setValidationErrors(newValidationErrors);
  }, [
    formData.invoice?.invoice_number,
    formData.invoice?.invoice_date,
    formData.invoice?.exporter?.company_name,
    formData.invoice?.buyer?.consignee,
    portOfLoading,
    portOfDischarge,
    finalDestination,
    countryOfOrigin,
    countryOfFinalDestination,
    termsOfDelivery,
    paymentTerms,
    selectedCurrency,
    sections,
  ]);

  // Update the handleNext function to pass data to PackagingList
  const handleNext = (data) => {
    // Track if any validation errors occurred
    let hasErrors = false;
    const errorMessages: string[] = [];
    const newValidationErrors = { ...validationErrors };
    console.log(data);
    localStorage.setItem(`invoiceData2`, JSON.stringify(data));
    
    // VALIDATION CHECKS COMMENTED OUT AS REQUESTED
    /*
    // Check for required fields, but make Pre-Carriage By, Vessel/Flight No, and Supplier Details optional
    // Validate invoice number
    if (!formData.invoice?.invoice_number) {
      newValidationErrors.invoiceNumber = true;
      errorMessages.push("Please enter an invoice number");
      hasErrors = true;
    } else {
      newValidationErrors.invoiceNumber = false;
    }
    
    // Validate invoice date
    if (!formData.invoice?.invoice_date) {
      newValidationErrors.invoiceDate = true;
      errorMessages.push("Please enter an invoice date");
      hasErrors = true;
    } else {
      newValidationErrors.invoiceDate = false;
    }
    
    // Validate exporter
    if (!formData.invoice?.exporter?.company_name) {
      newValidationErrors.exporter = true;
      errorMessages.push("Please select an exporter");
      hasErrors = true;
    } else {
      newValidationErrors.exporter = false;
    }
    
    // Validate consignee
    if (!formData.invoice?.buyer?.consignee) {
      newValidationErrors.consignee = true;
      errorMessages.push("Please enter consignee details");
      hasErrors = true;
    } else {
      newValidationErrors.consignee = false;
    }
    
    // Validate port of loading
    if (!portOfLoading) {
      newValidationErrors.portOfLoading = true;
      errorMessages.push("Please select port of loading");
      hasErrors = true;
    } else {
      newValidationErrors.portOfLoading = false;
    }
    
    // Validate port of discharge
    if (!portOfDischarge) {
      newValidationErrors.portOfDischarge = true;
      errorMessages.push("Please select port of discharge");
      hasErrors = true;
    } else {
      newValidationErrors.portOfDischarge = false;
    }
    
    // Validate final destination
    if (!finalDestination) {
      newValidationErrors.finalDestination = true;
      errorMessages.push("Please select final destination");
      hasErrors = true;
    } else {
      newValidationErrors.finalDestination = false;
    }
    
    // Validate country of origin
    if (!countryOfOrigin) {
      newValidationErrors.countryOfOrigin = true;
      errorMessages.push("Please enter country of origin");
      hasErrors = true;
    } else {
      newValidationErrors.countryOfOrigin = false;
    }
    
    // Validate country of final destination
    if (!countryOfFinalDestination) {
      newValidationErrors.countryOfFinalDestination = true;
      errorMessages.push("Please select country of final destination");
      hasErrors = true;
    } else {
      newValidationErrors.countryOfFinalDestination = false;
    }
    
    // Validate terms of delivery
    if (!termsOfDelivery) {
      newValidationErrors.termsOfDelivery = true;
      errorMessages.push("Please enter terms of delivery");
      hasErrors = true;
    } else {
      newValidationErrors.termsOfDelivery = false;
    }
    
    // Validate payment terms
    if (!paymentTerms) {
      newValidationErrors.paymentTerms = true;
      errorMessages.push("Please select payment terms");
      hasErrors = true;
    } else {
      newValidationErrors.paymentTerms = false;
    }
    
    // Validate currency
    if (!selectedCurrency) {
      newValidationErrors.selectedCurrency = true;
      errorMessages.push("Please select currency");
      hasErrors = true;
    } else {
      newValidationErrors.selectedCurrency = false;
    }
    
    // Check if sections have at least one item
    const hasSections = sections.length > 0;
    const hasItems = sections.some(section => section.items.length > 0);
    
    if (!hasSections || !hasItems) {
      newValidationErrors.productItems = true;
      errorMessages.push("Please add at least one product item");
      hasErrors = true;
    } else {
      newValidationErrors.productItems = false;
    }
    
    // Update the validation errors state
    setValidationErrors(newValidationErrors);
    
    // If there are validation errors, show them
    if (hasErrors) {
      // Show a toast with the first error message
      toast.error(errorMessages[0]);
      
      // Also show a summary of all errors
      if (errorMessages.length > 1) {
        toast.error(`Please fill in all required fields (${errorMessages.length} errors found)`);
      }
      
      // Scroll to the top of the page to make error messages visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    */

    //Prepare supplier data for WITHOUT PAYMENT OF INTEGRATED TAX option
    const supplierData =
      integratedTaxOption === "WITHOUT"
        ? suppliers.map((s) => ({
            id: s.id,
            name: s.name,
            gstin_number: s.gstin_number,
            tax_invoice_number: s.tax_invoice_number || "",
            date: s.date || "",
            authorizedName: s.name || "ABC",
            authorizedGstin: s.gstin_number || "XXXXXXXXXXXX",
            contactNo: s.contactNo || "",
          }))
        : [];

    // Create a complete invoice data object
    const completeInvoiceData = {
      invoice_number: invoiceNo,
      invoice_date: invoiceDate ? format(invoiceDate, "yyyy-MM-dd") : "",
      currency_type: selectedCurrency,
      currency_rate: currencyRate,
      integrated_tax: integratedTaxOption,
      payment_term: paymentTerms,
      product_type: productType,
      exporter: {
        company_name: selectedExporter,
        company_address: companyAddress,
        email: email,
        tax_id: taxid,
        ie_code: ieCode,
        pan_number: panNo,
        gstin_number: gstinNo,
        state_code: stateCode,
      },
      buyer: {
        consignee: consignee,
        notify_party: notifyParty,
        buyers_order_no: buyersOrderNo,
        buyers_order_date: buyersOrderDate
          ? format(buyersOrderDate, "yyyy-MM-dd")
          : "",
        po_no: poNo,
      },
      shipping: {
        pre_carriage_by: preCarriageBy,
        place_of_receipt: placeOfReceipt,
        vessel_flight_no: vesselFlightNo,
        port_of_loading: portOfLoading,
        port_of_discharge: portOfDischarge,
        final_destination: finalDestination,
        country_of_origin: countryOfOrigin,
        origin_details: originDetails,
        country_of_final_destination: countryOfFinalDestination,
        terms_of_delivery: termsOfDelivery,
        payment_terms: paymentTerms,
        shipping_method: shippingMethod,
      },
      products: sections,
      package: {
        no_of_packages: noOfPackages,
        gross_weight: grossWeight,
        net_weight: netWeight,
      },
      supplier: supplierData,
      sections: sections,
      markNumber: markNumber,
    };

    // Update the form context with the complete invoice data
    setInvoiceData(completeInvoiceData);

    // Save the current state before navigating
    const formData2 = {
      sections: sections,
      markNumber: markNumber, // Use the markNumber from state
      readOnly: true,
      // Add invoice header information
      invoiceHeader: {
        invoiceNo,
        invoiceDate,
        email,
        taxid,
        ieCode,
        panNo,
        gstinNo,
        stateCode,
        selectedExporter,
        companyAddress,
        invoice_number: invoiceNo,
        invoice_date: invoiceDate,
        exporter: completeInvoiceData.exporter,
        buyer: completeInvoiceData.buyer,
        shipping: completeInvoiceData.shipping,
        // Include supplier information for WITHOUT PAYMENT OF INTEGRATED TAX
        supplier: supplierData,
        integratedTaxOption: integratedTaxOption,
        authorizedName: authorizedName,
        authorizedGstin: authorizedGstin,
        gstInvoiceNoDate: gstInvoiceNoDate,
      },
      // Add buyer information
      buyerInfo: {
        consignee,
        notifyParty,
        buyersOrderNo,
        buyersOrderDate,
        poNo,
      },
      // Add shipping information
      shippingInfo: {
        preCarriageBy,
        placeOfReceipt,
        vesselFlightNo,
        portOfLoading,
        portOfDischarge,
        finalDestination,
        countryOfOrigin,
        originDetails,
        countryOfFinalDestination,
        termsOfDelivery,
        paymentTerms,
        shippingMethod,
        selectedCurrency,
        currencyRate,
      },
    };

    // Store the data in localStorage with a direct structure that's easier to access
    // This is a more reliable approach for passing data between components
    const directExporterData = {
      company_name: selectedExporter,
      company_address: companyAddress,
      email: email,
      tax_id: taxid,
      ie_code: ieCode,
      pan_number: panNo,
      gstin_number: gstinNo,
      state_code: stateCode,
    };

    // Store order details explicitly
    const orderData = {
      order_no: buyersOrderNo,
      order_date: buyersOrderDate ? format(buyersOrderDate, "yyyy-MM-dd") : "",
      po_no: poNo,
      consignee: consignee,
      notify_party: notifyParty,
    };

    // Store the original form data
    localStorage.setItem("invoiceFormData", JSON.stringify(formData2));

    // Store simplified versions of the data for direct access
    localStorage.setItem(
      "directExporterData",
      JSON.stringify(directExporterData)
    );
    localStorage.setItem("orderData", JSON.stringify(orderData));

    // // Navigate to the packaging list page
    navigate("/packaging-list");
  };

  // Update the paymentTerms handler to show/hide insurance and freight fields
  const handlePaymentTermsChange = (value: string) => {
    setPaymentTerms(value);

    // Show insurance and freight fields for CIF and CNF
    if (value === "CIF" || value === "CNF") {
      setShowInsuranceFreight(true);

      // Update Terms of Delivery based on payment terms
      if (value === "CIF") {
        setTermsOfDelivery(`CIF AT ${portOfDischarge}`);
      } else {
        setTermsOfDelivery(`CNF AT ${portOfDischarge}`);
      }
    } else {
      setShowInsuranceFreight(false);
      // For FOB, use port of loading
      setTermsOfDelivery(`FOB AT ${portOfLoading}`);
    }
  };

  useEffect(() => {
    const markNumber =
      marksAndNumbersValues.containerType === "LCL"
        ? `LCL`
        : `${marksAndNumbersValues.leftValue}X${marksAndNumbersValues.rightValue} ${marksAndNumbersValues.containerType}`;

    setMarkNumber(markNumber);
  }, [sections]);

  // Add handler for product type change
  const handleProductTypeChange = (newType: string) => {
    setProductType(newType);

    // If Sanitary is selected, update the section title to CERAMIC SANITARYWARE
    if (newType === "Sanitary") {
      setSections((currentSections) =>
        currentSections.map((section) => {
          // Update section title to CERAMIC SANITARYWARE
          return {
            ...section,
            title: "CERAMIC SANITARYWARE",
            items: section.items.map((item) => ({
              ...item,
              product: {
                ...item.product,
                hsnCode: "69101000",
              },
            })),
          };
        })
      );
    }
    // If Faucets is selected, update the section title to BRASS FAUCETS
    else if (newType === "Faucets") {
      setSections((currentSections) =>
        currentSections.map((section) => {
          // Update section title to BRASS FAUCETS
          return {
            ...section,
            title: "BRASS FAUCETS",
            items: section.items.map((item) => ({
              ...item,
              product: {
                ...item.product,
                hsnCode: "84818090",
              },
            })),
          };
        })
      );
    }
  };

  const COMMON_SUPPLIERS = [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-center">CUSTOMS INVOICE</CardTitle>
              <p className="text-center text-sm">
                SUPPLY MEANT FOR EXPORT UNDER BOND & LUT- LETTER OF UNDERTAKING{" "}
                {integratedTaxOption} PAYMENT OF INTEGRATED TAX
              </p>
            </CardHeader>
          </Card>

          {/* Exporter Information */}
          <ExporterInfo
            selectedExporter={selectedExporter}
            exporters={exporters}
            handleExporterSelect={(value) => {
              // Set the selected exporter name
              setSelectedExporter(value);

              // Find the selected exporter object
              const selectedExporterObj = exporters.find(
                (e) => e.company_name === value
              );

              if (selectedExporterObj) {
                // Update all related fields
                setCompanyAddress(selectedExporterObj.company_address || "");
                setEmail(selectedExporterObj.email || "");
                setTaxid(selectedExporterObj.tax_id || "");
                setIeCode(selectedExporterObj.ie_code || "");
                setPanNo(selectedExporterObj.pan_number || "");
                setGstinNo(selectedExporterObj.gstin_number || "");
                setStateCode(selectedExporterObj.state_code || "");

                // Save this data to localStorage for direct access by PackagingList
                localStorage.setItem(
                  "selectedExporterData",
                  JSON.stringify({
                    company_name: value,
                    company_address: selectedExporterObj.company_address || "",
                    email: selectedExporterObj.email || "",
                    tax_id: selectedExporterObj.tax_id || "",
                    ie_code: selectedExporterObj.ie_code || "",
                    pan_number: selectedExporterObj.pan_number || "",
                    gstin_number: selectedExporterObj.gstin_number || "",
                    state_code: selectedExporterObj.state_code || "",
                  })
                );
              }
            }}
            companyAddress={companyAddress}
            email={email}
            taxid={taxid}
            invoiceNo={invoiceNo}
            invoiceDate={invoiceDate}
            setInvoiceNo={setInvoiceNo}
            setInvoiceDate={setInvoiceDate}
            ieCode={ieCode}
            panNo={panNo}
            gstinNo={gstinNo}
            stateCode={stateCode}
            setIeCode={setIeCode}
            setPanNo={setPanNo}
            setGstinNo={setGstinNo}
            setStateCode={setStateCode}
            setTaxid={setTaxid}
            setEmail={setEmail}
            setExporters={setExporters}
            hasInvoiceNumberError={validationErrors.invoiceNumber}
            hasInvoiceDateError={validationErrors.invoiceDate}
            hasExporterError={validationErrors.exporter}
            form={form}
          />

          {/* Buyer Information */}
          <BuyerInformationCard
            buyersOrderNo={buyersOrderNo}
            setBuyersOrderNo={setBuyersOrderNo}
            buyersOrderDate={buyersOrderDate}
            setBuyersOrderDate={setBuyersOrderDate}
            poNo={poNo}
            setPoNo={setPoNo}
            consignee={consignee}
            setConsignee={setConsignee}
            notifyParty={notifyParty}
            setNotifyParty={setNotifyParty}
            hasConsigneeError={validationErrors.consignee}
            form={form}
          />

          {/* Shipping Information */}
          <ShippingInformationPage
            preCarriageBy={preCarriageBy}
            setPreCarriageBy={setPreCarriageBy}
            placeOfReceipt={placeOfReceipt}
            setPlaceOfReceipt={setPlaceOfReceipt}
            placesOfReceipt={placesOfReceipt}
            setPlacesOfReceipt={setPlacesOfReceipt}
            vesselFlightNo={vesselFlightNo}
            setVesselFlightNo={setVesselFlightNo}
            portOfLoading={portOfLoading}
            setPortOfLoading={setPortOfLoading}
            portsOfLoading={portsOfLoading}
            setPortsOfLoading={setPortsOfLoading}
            portOfDischarge={portOfDischarge}
            setPortOfDischarge={setPortOfDischarge}
            setPortsOfDischarge={setPortsOfDischarge}
            portsOfDischarge={portsOfDischarge}
            finalDestination={finalDestination}
            setFinalDestination={setFinalDestination}
            setFinalDestinations={setFinalDestinations}
            finalDestinations={finalDestinations}
            countryOfOrigin={countryOfOrigin}
            setCountryOfOrigin={setCountryOfOrigin}
            originDetails={originDetails}
            countryOfFinalDestination={countryOfFinalDestination}
            setCountryOfFinalDestination={setCountryOfFinalDestination}
            setOriginDetails={setOriginDetails}
            countriesOfFinalDestination={countriesOfFinalDestination}
            setCountriesOfFinalDestination={setCountriesOfFinalDestination}
            termsOfDelivery={termsOfDelivery}
            setTermsOfDelivery={setTermsOfDelivery}
            paymentTerms={paymentTerms}
            shippingMethod={shippingMethod}
            setShippingMethod={setShippingMethod}
            shippingMethods={shippingMethods}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            currencies={currencies}
            currencyRate={currencyRate}
            setCurrencyRate={setCurrencyRate}
            hasPortOfLoadingError={validationErrors.portOfLoading}
            hasPortOfDischargeError={validationErrors.portOfDischarge}
            hasFinalDestinationError={validationErrors.finalDestination}
            hasCountryOfOriginError={validationErrors.countryOfOrigin}
            hasCountryOfFinalDestinationError={
              validationErrors.countryOfFinalDestination
            }
            hasTermsOfDeliveryError={validationErrors.termsOfDelivery}
            hasPaymentTermsError={validationErrors.paymentTerms}
            hasCurrencyError={validationErrors.selectedCurrency}
            form={form}
          />

          {/* Product Information */}
          <ProductInformation
            addNewSection={addNewSection}
            sections={sections}
            setSections={setSections}
            setSectionOptions={setSectionOptions}
            setHsnCodes={setHsnCodes}
            hsnCodes={hsnCodes}
            sectionOptions={sectionOptions}
            sizes={sizes}
            setSizes={setSizes}
            setSizeToSqmMap={setSizeToSqmMap}
            units={units}
            setUnits={setUnits}
            removeRow={removeRow}
            addNewRow={addNewRow}
            showInsuranceFreight={showInsuranceFreight}
            insuranceAmount={insuranceAmount}
            setInsuranceAmount={setInsuranceAmount}
            freightAmount={freightAmount}
            setFreightAmount={setFreightAmount}
            totalFOBEuro={totalFOBEuro}
            paymentTerms={paymentTerms}
            marksAndNumbersValues={marksAndNumbersValues}
            setMarksAndNumbersValues={setMarksAndNumbersValues}
            customSectionHsnCodes={customSectionHsnCodes}
            setCustomSectionHsnCodes={setCustomSectionHsnCodes}
            openSectionDropdowns={openSectionDropdowns}
            setOpenSectionDropdowns={setOpenSectionDropdowns}
            productType={productType}
            sizeToSqmMap={sizeToSqmMap}
            form={form}
          />

          {/* Package Information */}
          <PackageInfoSection
            noOfPackages={noOfPackages}
            grossWeight={grossWeight}
            netWeight={netWeight}
            paymentTerms={paymentTerms}
            selectedCurrency={selectedCurrency}
            exportUnderGstCircular={exportUnderGstCircular}
            sections={sections}
            totalSQM={totalSQM}
            setExportUnderGstCircular={setExportUnderGstCircular}
            integratedTaxOption={integratedTaxOption}
            lutNo={lutNo}
            setLutNo={setLutNo}
            lutDate={formattedLutDate}
            setLutDate={(val: string) => setLutDate(new Date(val))}
            totalFOBEuro={totalFOBEuro}
            amountInWords={amountInWords}
            currencyRate={currencyRate}
            form={form}
          />
          {/* Supplier Information */}
          <SupplierDetails
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            setSelectedSupplier={setSelectedSupplier}
            integratedTaxOption={integratedTaxOption}
            selectedSupplier={selectedSupplier}
            setAuthorizedName={setAuthorizedName}
            setAuthorizedGstin={setAuthorizedGstin}
            setGstInvoiceNoDate={setGstInvoiceNoDate}
            form={form}
          />

          {/* Footer Buttons */}
          <Card className="mt-6">
            <CardFooter className="flex justify-end gap-4">
              <Button
                onClick={() => {
                  // setFormSubmitted(true);
                  // handleSaveInvoice();
                  // localStorage.setItem("taxDialogBox", "false");
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Invoice
              </Button>
              <Button onClick={form.handleSubmit(handleNext)}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Next
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Dialogs */}
        {/* PDF Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            <div className="border p-1 mt-2">
              <InvoicePDFPreview
                // Invoice Header
                invoiceNo={invoiceNo}
                date={format(invoiceDate, "yyyy-MM-dd")}
                exporterRef={exporterRef}
                ieCode={ieCode}
                companyName={selectedExporter}
                companyAddress={companyAddress}
                companyEmail={email}
                taxId={taxid}
                stateCode={stateCode}
                panNo={panNo}
                gstinNo={gstinNo}
                buyersOrderNo={buyersOrderNo}
                buyersOrderDate={format(buyersOrderDate, "yyyy-MM-dd")}
                poNo={poNo}
                consignee={consignee}
                notifyParty={notifyParty}
                // Shipping Information
                termsOfDelivery={termsOfDelivery}
                paymentTerms={paymentTerms}
                shippingMethod={shippingMethod}
                placeOfReceipt={placeOfReceipt}
                preCarriageBy={preCarriageBy}
                countryOfOrigin={countryOfOrigin}
                originDetails={originDetails}
                vesselFlightNo={vesselFlightNo}
                portOfLoading={portOfLoading}
                portOfDischarge={portOfDischarge}
                finalDestination={finalDestination}
                countryOfFinalDestination={countryOfFinalDestination}
                euroRate={currencyRate.toString()}
                selectedCurrency={selectedCurrency}
                // Product Information
                items={sections.flatMap((section) =>
                  section.items.map((item, index) => ({
                    id: parseInt(item.id),
                    srNo: index + 1,
                    marks: item.product.marksAndNos,
                    description: item.product.description,
                    quantity: item.quantity,
                    unitType: "BOX",
                    sqmPerBox: item.product.sqmPerBox,
                    size: item.product.size,
                    hsnCode: item.product.hsnCode,
                    totalSqm: item.totalSQM,
                    price: item.product.price,
                    totalAmount: item.totalFOB,
                  }))
                )}
                // Package and Declaration
                noOfPackages={noOfPackages}
                grossWeight={grossWeight}
                netWeight={netWeight}
                exportUnderDutyDrawback={exportUnderDutyDrawback}
                ftpIncentiveDeclaration={ftpIncentiveDeclaration}
                exportUnderGstCircular={exportUnderGstCircular}
                lutNo={lutNo}
                lutDate={formattedLutDate}
                fobEuro={totalFOBEuro.toFixed(2)}
                totalFobEuro={totalFOBEuro.toFixed(2)}
                amountInWords={amountInWords}
                integratedTaxOption={integratedTaxOption}
                // Supplier Details
                supplierDetails1={`SUPPLIER DETAILS :- 1\nNAME: ${
                  suppliers[0]?.name || ""
                }\nGSTIN: ${suppliers[0]?.gstin || ""}`}
                supplierDetails2={
                  suppliers[1]
                    ? `SUPPLIER DETAILS :- 2\nNAME: ${suppliers[1].name}\nGSTIN: ${suppliers[1].gstin}`
                    : ""
                }
                supplierDetails3={
                  suppliers[2]
                    ? `SUPPLIER DETAILS :- 3\nNAME: ${suppliers[2].name}\nGSTIN: ${suppliers[2].gstin}`
                    : ""
                }
                gstInvoiceNoDate={gstInvoiceNoDate}
                companyNameFooter={companyProfile?.name}
                declarationText={declarationText}
                authorizedName={authorizedName}
                authorizedGstin={authorizedGstin}
                currencyRate={currencyRate}
                taxableValue={taxableValue}
                gstAmount={gstAmount}
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => {
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                    <html>
                      <head>
                        <title>Invoice ${invoiceNo}</title>
                        <style>
                          body { font-family: Arial, sans-serif; }
                          table { width: 100%; border-collapse: collapse; }
                          th, td { border: 1px solid black; padding: 5px; }
                          th { background-color: #f2f2f2; }
                          .container { max-width: 210mm; margin: 0 auto; padding: 10mm; }
                          @media print {
                            body { width: 210mm; height: 297mm; }
                            .no-print { display: none; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          ${
                            document.querySelector(".dialog-content")
                              ?.innerHTML || ""
                          }
                        </div>
                        <script>
                          window.onload = function() { window.print(); }
                        </script>
                      </body>
                    </html>
                  `);
                    printWindow.document.close();
                  }
                }}
              >
                Print PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tax Option Dialog */}
        <Dialog
          open={taxOptionDialogOpen}
          onOpenChange={(open) => {
            // Only allow closing if all fields are filled
            if (
              !open &&
              (!integratedTaxOption || !paymentTerms || !productType)
            ) {
              toast.error(
                "Please fill all required fields in the Tax Option form"
              );
              return; // Prevent closing
            }
            setTaxOptionDialogOpen(open);
          }}
          modal={true}
        >
          <DialogContent
            className="max-w-5xl max-h-[80vh] overflow-y-auto"
            onInteractOutside={(e) => {
              // Prevent any interaction outside the dialog
              e.preventDefault();
              toast.error(
                "Please fill and submit the Tax Option form to continue"
              );
            }}
            onEscapeKeyDown={(e) => {
              // Prevent closing with Escape key
              e.preventDefault();
              toast.error(
                "Please fill and submit the Tax Option form to continue"
              );
            }}
            // Hide the close button
            hideCloseButton={true}
          >
            <DialogHeader>
              <DialogTitle>Tax Option</DialogTitle>
            </DialogHeader>
            <div className="border p-4 mt-2">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-3">Tax Option</h3>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="integratedTaxOption">
                        Integrated Tax Option
                      </Label>
                      <Controller
                        control={form.control}
                        name="integrated_tax" // change this path based on your form structure
                        defaultValue={integratedTaxOption}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(value: "WITH" | "WITHOUT") => {
                              field.onChange(value);
                              setIntegratedTaxOption(value); // still updates local state if needed
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select integrated tax option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WITHOUT">
                                WITHOUT PAYMENT OF INTEGRATED TAX
                              </SelectItem>
                              <SelectItem value="WITH">
                                WITH PAYMENT OF INTEGRATED TAX
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentTerms">Payment Terms</Label>
                      <Controller
                        control={form.control}
                        name="payment_term" // Update the name based on your form structure
                        defaultValue={paymentTerms}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              handlePaymentTermsChange(value); // still call your handler if needed
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentTermsOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productType">Product Type</Label>
                      <Controller
                        control={form.control}
                        name="product_type" // Change to match your schema
                        defaultValue={productType}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(value: string) => {
                              field.onChange(value);
                              handleProductTypeChange(value); // Optional: for local side effects
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select product type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sanitary">Sanitary</SelectItem>
                              <SelectItem value="Faucets">Faucets</SelectItem>
                              <SelectItem value="Tiles">Tiles</SelectItem>
                              <SelectItem value="Mix">Mix</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => {
                  // Validate that all required fields are filled
                  if (!integratedTaxOption || !paymentTerms || !productType) {
                    toast.error(
                      "Please fill all required fields in the Tax Option form"
                    );
                    return;
                  }

                  localStorage.setItem("taxDialogBox", "false");
                  setTaxOptionDialogOpen(false);
                  setInvoiceData({
                    ...formData.invoice,
                    integrated_tax: integratedTaxOption,
                    payment_term: paymentTerms,
                    product_type: productType,
                  });
                }}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InvoiceGenerator;

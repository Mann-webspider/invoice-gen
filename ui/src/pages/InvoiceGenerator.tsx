import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'; // Use react-router-dom for navigation
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  getClients,
  getProducts,
  getShippingTerms,
  getCompanyProfile,
  saveInvoice
} from "@/lib/dataService";
import {
  Client,
  Product,
  ShippingTerm,
  CompanyProfile,
  InvoiceItem,
  Invoice,
  ProductSection
} from "@/lib/types";
import {
  generateInvoiceNumber,
  convertAmountToWords,
  formatCurrency
} from "@/lib/utils";
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
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
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
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingTerms, setShippingTerms] = useState<ShippingTerm[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [taxOptionDialogOpen, setTaxOptionDialogOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // State for expanded section
  const [expandedSection, setExpandedSection] = useState<'exporter' | 'shipping' | 'product' | 'gst'>('exporter');
  
  // Function to toggle section expansion
  const toggleSection = (section: 'exporter' | 'shipping' | 'product' | 'gst') => {
    setExpandedSection(section);
  };

  //exporter details
  const[exporterData,setExporterData] = useState([{}]);
  const [exporter,setExporter] = useState({
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
  const [shippingData,setShippingData] = useState({})
  const [shipping,setShipping] = useState({
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
    
  })

  // product details
  const [productData,setProductData] = useState([{}]);
  const [product,setProduct] = useState({
    marks: "",
    nos:"",

    size: "",
    quantity: "",
    price: "",
    total: ""
  })

  const [gstData,setGstData] = useState([{}]);  
  const [gst ,setGst] = useState({
    arn: "",
    lut_date: "",
    rate: "",
    tax: "",
    total: ""    
  })

  // Invoice Header
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [taxid, setTaxid] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [ieCode, setIeCode] = useState("1234567890");
  const [panNo, setPanNo] = useState("");
  const [gstinNo, setGstinNo] = useState("");
  const [stateCode, setStateCode] = useState("24");
  const [buyersOrderNo, setBuyersOrderNo] = useState("");
  const [buyersOrderDate, setBuyersOrderDate] = useState<Date>(new Date);
  const [poNo, setPoNo] = useState("");

  // Supplier Info
  const [authorizedName, setAuthorizedName] = useState("ABC");
  const [authorizedGstin, setAuthorizedGstin] = useState("XXXXXXXXXXXX");
  const [gstInvoiceNoDate, setGstInvoiceNoDate] = useState("GST/XXX XX.XX.XXXX");
  const [suppliers, setSuppliers] = useState([
   
  ]);
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
  const [originDetails, setOriginDetails] = useState("DISTRICT MORBI, STATE GUJARAT");
  const [countryOfFinalDestination, setCountryOfFinalDestination] = useState("USA");
  const [termsOfDelivery, setTermsOfDelivery] = useState("FOB AT MUNDRA PORT");
  const [paymentTerms, setPaymentTerms] = useState("FOB");
  const [shippingMethod, setShippingMethod] = useState("SHIPPING - THROUGH SEA");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [currencyRate, setCurrencyRate] = useState(88.95);

  // Dropdown options
  const [exporters, setExporters] = useState<string[]>([
    
  ]);
  const [placesOfReceipt, setPlacesOfReceipt] = useState<string[]>([
    
  ]);
  const [portsOfLoading, setPortsOfLoading] = useState<string[]>([
    
  ]);
  const [portsOfDischarge, setPortsOfDischarge] = useState<string[]>([
    
  ]);
  const [finalDestinations, setFinalDestinations] = useState<string[]>([
    
  ]);
  const [countriesOfFinalDestination, setCountriesOfFinalDestination] = useState<string[]>([
    
  ]);
  const [shippingMethods, setShippingMethods] = useState<string[]>([
    "SHIPPING - THROUGH SEA", "SHIPPING - THROUGH AIR"
  ]);
  const [currencies, setCurrencies] = useState<string[]>([
    "USD", "EUR", "GBP", "INR", "AED"
  ]);
  const [sizes, setSizes] = useState<string[]>([
    "600 X 1200", "600 X 600", "800 X 800", "300 X 600", "300 X 300"
  ]);
  const [units, setUnits] = useState<string[]>([
    "Box", "Pallet", "Carton", "Piece"
  ]);
  const [hsnCodes] = useState<{ [key: string]: string }>({
    "Glazed porcelain Floor Tiles": "69072100",
    "Polished Vitrified Tiles": "69072200",
    "Ceramic Wall Tiles": "69072300",
    "Digital Floor Tiles": "69072100",
    "CERAMIC SANITARYWARE": "69101000"
  });
  const [sectionOptions, setSectionOptions] = useState<string[]>([
    "Glazed porcelain Floor Tiles",
    "Polished Vitrified Tiles",
    "Ceramic Wall Tiles",
    "Digital Floor Tiles",
    "CERAMIC SANITARYWARE"
  ]);
  const [paymentTermsOptions, setPaymentTermsOptions] = useState<string[]>([
    "FOB",
    "CIF",
    "CNF",
  ]);

  const [productType, setProductType] = useState<string>("Tiles");
  const [productTypeOptions, setProductTypeOptions] = useState<string[]>([
    "Sanitary",
    "Tiles",
    "Mix"
  ]);

  // Product Info
  const [sections, setSections] = useState<ProductSection[]>([
    {
      id: '1',
      title: 'Glazed porcelain Floor Tiles',
      items: []
    },
    {
      id: '2',
      title: 'Ceramic Wall Tiles',
      items: []
    }
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
    "EXPORT UNDER GST CIRCULAR NO. XX/20XX Customs DT.XX/XX/20XX"
  );
  const [lutNo, setLutNo] = useState(
    "ACXXXXXXXXXXXXXXX"
  );
  const [lutDate, setLutDate] = useState<Date>(new Date);
  const [integratedTaxOption, setIntegratedTaxOption] = useState<"WITH" | "WITHOUT">("WITHOUT");
  const [selectedSupplier, setSelectedSupplier] = useState<Array<object>>([{}]);

  // Totals
  const [totalSQM, setTotalSQM] = useState<number>(0);
  const [totalFOBEuro, setTotalFOBEuro] = useState<number>(0);
  const [amountInWords, setAmountInWords] = useState<string>("");

  // Replace the marksAndNosConfig and containerType state, keeping containerTypes as a reference
  const [marksAndNumbersValues, setMarksAndNumbersValues] = useState({
    containerType: "FCL",
    leftValue: "10",
    rightValue: "20"
  });

  

  // Add additional state variables for insurance and freight
  const [insuranceAmount, setInsuranceAmount] = useState<number>(0);
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [showInsuranceFreight, setShowInsuranceFreight] = useState<boolean>(false);

  // Add the missing markNumber state
  const [markNumber, setMarkNumber] = useState<string>("10X20 FCL");

  // Add a mapping for size to SQM/BOX values
  const [sizeToSqmMap] = useState<{ [key: string]: number }>({
    "600 X 1200": 1.44,
    "600 X 600": 0.72,
    "800 X 800": 1.28,
    "300 X 600": 0.36,
    "300 X 300": 0.18
  });

  // Add new state for tracking custom section titles and HSN codes
  const [customSectionHsnCodes, setCustomSectionHsnCodes] = useState<{ [key: string]: string }>({});
  const [showSectionOptions, setShowSectionOptions] = useState<boolean>(false);

  // Replace the single showSectionOptions state with a map to track each section's dropdown state
  const [openSectionDropdowns, setOpenSectionDropdowns] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Show the tax option dialog
    console.log(localStorage.getItem("taxDialogBox"));
    // if(localStorage.getItem("taxDialogBox")=="false"){
      
    //   setTaxOptionDialogOpen(false);
    // }else{
    if(true){

      setTaxOptionDialogOpen(true);
      
    }

    // Set initial data from companyProfile
    if (companyProfile) {
      setPanNo(companyProfile.pan);
      setGstinNo(companyProfile.gstin);
      setDeclarationText(companyProfile.declarationText);
    }

    // Check for annexure data from packaging list
    const annexureDataStr = localStorage.getItem('annexureData');
    const vgmFormDataStr = localStorage.getItem('vgmFormData');
    
    if (annexureDataStr) {
      try {
        const annexureData = JSON.parse(annexureDataStr);
        if (annexureData.containerRows && annexureData.containerRows.length > 0) {
          // Calculate total gross weight and net weight from container rows
          const totalGrossWeight = annexureData.containerRows.reduce(
            (sum: number, row: any) => sum + parseFloat(row.grossWeight || "0"), 
            0
          ).toFixed(2);
          
          const totalNetWeight = annexureData.containerRows.reduce(
            (sum: number, row: any) => sum + parseFloat(row.netWeight || "0"), 
            0
          ).toFixed(2);
          
          // Update state with the calculated values
          setGrossWeight(totalGrossWeight);
          setNetWeight(totalNetWeight);
        }
      } catch (error) {
        console.error("Error parsing annexure data:", error);
      }
    } else if (vgmFormDataStr) {
      // Check if we're returning from VGM form
      try {
        const vgmFormData = JSON.parse(vgmFormDataStr);
        if (vgmFormData.containers && vgmFormData.containers.length > 0) {
          // Use the gross weight from VGM form if available
          const totalGrossWeight = vgmFormData.containers.reduce(
            (sum: number, container: any) => sum + parseFloat(container.grossWeight || "0"), 
            0
          ).toFixed(2);
          
          // For VGM, we might not have net weight, so only set gross weight
          if (totalGrossWeight && parseFloat(totalGrossWeight) > 0) {
            setGrossWeight(totalGrossWeight);
          }
        }
      } catch (error) {
        console.error("Error parsing VGM form data:", error);
      }
    }

    // Add an empty row to the first section
    addNewRow(sections[0].id);
  }, []); // Empty dependency array ensures this only runs once on mount

  useEffect(() => {
    // Calculate totals
    let sqmTotal = 0;
    let fobTotal = 0;

    sections.forEach(section => {
      section.items.forEach(item => {
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
    setSections(sections.map(section => ({
      ...section,
      items: section.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          marksAndNos: `${marksAndNumbersValues.leftValue}${marksAndNumbersValues.rightValue} ${marksAndNumbersValues.containerType}`
        }
      }))
    })));
  }, [marksAndNumbersValues, sections]);

  const addNewRow = (sectionId: string) => {
    console.log("addNewRow", sectionId);
    
    // Find the section to get its title
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    // Determine HSN code based on section title and custom mappings
    let hsnCode;
    
    if (productType === "Sanitary") {
      hsnCode = "69101000";
    } else {
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
      
      // Default fallback
      if (!hsnCode) {
        hsnCode = "69072100";
      }
    }
    
    // Use the default size and its corresponding SQM value
    const defaultSize = sizes[0] || "600 X 1200";
    const defaultSqmPerBox = sizeToSqmMap[defaultSize] || 1.44;
    
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product: {
        id: "",
        description: "",
        hsnCode: hsnCode,
        size: defaultSize,
        price: 10,
        sqmPerBox: defaultSqmPerBox,
        marksAndNos: `${marksAndNumbersValues.leftValue}${marksAndNumbersValues.rightValue} ${marksAndNumbersValues.containerType}`
      },
      quantity: 1000,
      unitType: "Box",
      totalSQM: 1000 * defaultSqmPerBox,
      totalFOB: 10000,
      sectionId
    };

    setSections(currentSections =>
      currentSections.map(section =>
        section.id === sectionId
          ? { ...section, items: [...section.items, newItem] }
          : section
      )
    );
  };

  const addNewSection = () => {
    // Use the first option from sectionOptions as the default title
    const defaultTitle = sectionOptions[0] || 'Glazed porcelain Floor Tiles';
    
    const newSection: ProductSection = {
      id: Date.now().toString(),
      title: defaultTitle,
      items: []
    };
    setSections([...sections, newSection]);
    
    // Add an empty row to the new section
    addNewRow(newSection.id);
  };

  const removeRow = (sectionId: string, itemId: string) => {
    setSections(currentSections => {
      const updatedSections = currentSections.map(section => {
        if (section.id === sectionId) {
          const updatedItems = section.items.filter(item => item.id !== itemId);
          return { ...section, items: updatedItems };
        }
        return section;
      });

      // Remove section if it's empty and not the last section
      return updatedSections.filter(section =>
        section.items.length > 0 || updatedSections.length === 1
      );
    });
  };

  const handleProductSelect = (productId: string, itemId: string) => {
    const product = products.find(p => p.id === productId);

    if (!product) return;

    setSections(sections.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (item.id === itemId) {
          const quantity = item.quantity || 0;
          const totalSQM = quantity * product.sqmPerBox;
          const totalFOB = quantity * product.price;

          return {
            ...item,
            product,
            totalSQM,
            totalFOB
          };
        }
        return item;
      })
    })));
  };

  const handleQuantityChange = (quantity: number, itemId: string) => {
    setSections(sections.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (item.id === itemId) {
          const parsedQuantity = quantity || 0;
          const totalSQM = parsedQuantity * item.product.sqmPerBox;
          const totalFOB = parsedQuantity * item.product.price;

          return {
            ...item,
            quantity: parsedQuantity,
            totalSQM,
            totalFOB
          };
        }
        return item;
      })
    })));
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);

    if (client) {
      setConsignee(client.consignee);
      setNotifyParty(client.notifyParty);
    }
  };

  const handleShippingTermSelect = (termId: string) => {
    const term = shippingTerms.find(t => t.id === termId);

    if (term) {
      setSelectedShippingTerm(termId);
      setPortOfLoading(term.port);
      setCurrencyRate(term.euroRate.toString());
      
      // Update Terms of Delivery based on current payment terms
      if (paymentTerms === "CIF" || paymentTerms === "CNF") {
        // For CIF/CNF, keep using the port of discharge
        if (paymentTerms === "CIF") {
          setTermsOfDelivery(`CIF AT ${portOfDischarge}`);
        } else {
          setTermsOfDelivery(`CNF AT ${portOfDischarge}`);
        }
      } else {
        // For FOB, use the newly selected port of loading
        setTermsOfDelivery(`FOB AT ${term.port}`);
      }
    }
  };

  const handleExporterSelect = (exporter: string) => {
    setSelectedExporter(exporter);
    
    // Auto-fill invoice number based on exporter
    let prefix = "";
    switch(exporter) {
      case "Zeric Ceramic":
        prefix = "ZC";
        break;
      case "Nexa International":
        prefix = "NI";
        break;
      case "Friend Company":
        prefix = "FC";
        break;
      default:
        prefix = "INV";
    }
    
    // Create invoice number: prefix/001/YYYY
    const currentYear = new Date().getFullYear();
    const invoiceNum = `${prefix}/001/${currentYear}`;
    setInvoiceNo(invoiceNum);

    if (exporter === "Zeric Ceramic") {
      setCompanyAddress("SECOND FLOOR, OFFICE NO 7,\nISHAN CERAMIC ZONE WING D,\nLALPAR, MORBI,\nGujarat, 363642\nINDIA");
      setIeCode("AACFZ6****");
      setPanNo("AACFZ6****");
      setGstinNo("24AACF*********");
      setStateCode("24");
      setEmail("info@zericceramic.com");
      setTaxid("24AACF*********");
    }
    if (exporter === "Nexa International") {
      setCompanyAddress("");
      setIeCode("");
      setPanNo("");
      setGstinNo("");
      setStateCode("");
      setEmail("");
      setTaxid("");
    }
    if (exporter === "Friend Company") {
      setCompanyAddress("");
      setIeCode("");
      setPanNo("");
      setGstinNo("");
      setStateCode("");
      setEmail("");
      setTaxid("");
    }
  };

  const saveInvoiceData = () => {
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
        buyerOrderNoFormat: buyersOrderNo
      },
      items: sections.flatMap(section => section.items),
      shippingTerm: shippingTerms.find(s => s.id === selectedShippingTerm) as ShippingTerm,
      totalSQM,
      totalFOBEuro,
      amountInWords
    };

    // Save invoice
    const savedInvoice = saveInvoice(invoice);

    toast.success("Invoice saved successfully");
    return savedInvoice;
  };

  
 
  const handleSaveInvoice = ()=>{
    
  }
 

  // Update the handleNext function to pass data to PackagingList
  const handleNext = () => {
    // Save the current state before navigating
    const formData = {
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
        companyAddress
      },
      // Add buyer information
      buyerInfo: {
        consignee,
        notifyParty,
        buyersOrderNo,
        buyersOrderDate,
        poNo
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
        currencyRate
      }
    };
    
    // Store the data in localStorage or state management
    localStorage.setItem('invoiceFormData', JSON.stringify(formData));
    
    // Navigate to the packaging list page
    navigate('/packaging-list');
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
    const markNumber = marksAndNumbersValues.containerType === 'LCL' 
      ? `LCL` 
      : `${marksAndNumbersValues.leftValue}X${marksAndNumbersValues.rightValue} ${marksAndNumbersValues.containerType}`;

    // console.log("Updating markNumber:", markNumber, "from values:", marksAndNumbersValues);
    setMarkNumber(markNumber);
  }, [ sections]);

  // Add handler for product type change
  const handleProductTypeChange = (newType: string) => {
    setProductType(newType);
    
    // If Sanitary is selected, update the section title to CERAMIC SANITARYWARE
    if (newType === "Sanitary") {
      setSections(currentSections => 
        currentSections.map(section => {
          // Update section title to CERAMIC SANITARYWARE
          return {
            ...section,
            title: "CERAMIC SANITARYWARE",
            items: section.items.map(item => ({
              ...item,
              product: {
                ...item.product,
                hsnCode: "69101000"
              }
            }))
          };
        })
      );
    } 
    // If Faucets is selected, update the section title to BRASS FAUCETS
    else if (newType === "Faucets") {
      setSections(currentSections => 
        currentSections.map(section => {
          // Update section title to BRASS FAUCETS
          return {
            ...section,
            title: "BRASS FAUCETS",
            items: section.items.map(item => ({
              ...item,
              product: {
                ...item.product,
                hsnCode: "84818090"
              }
            }))
          };
        })
      );
    }
  };

  const COMMON_SUPPLIERS = [
    
  ];

  return (
    <div>
      <PageHeader
        title="Generate Invoice"
        description="Create detailed customs invoice for exports"
        // action={
        //   <div className="flex gap-2">
        //     <Button variant="outline" onClick={exportCSV}>
        //       <FileText className="mr-2 h-4 w-4" />
        //       Export CSV
        //     </Button>
        //     <Button onClick={generatePDF}>
        //       <FileText className="mr-2 h-4 w-4" />
        //       Generate PDF
        //     </Button>
        //   </div>
        // }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">CUSTOMS INVOICE</CardTitle>
            <p className="text-center text-sm">
              SUPPLY MEANT FOR EXPORT UNDER BOND & LUT- LETTER OF UNDERTAKING {integratedTaxOption} PAYMENT OF INTEGRATED TAX
            </p>
          </CardHeader>
        </Card>

        {/* Exporter Information */}
        
        <ExporterInfo
          selectedExporter={selectedExporter}
          exporters={exporters}
          handleExporterSelect={handleExporterSelect}
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
        />

        {/* Product Information */}
        <ProductInformation

          addNewSection={addNewSection}
            
          sections={sections}
          setSections={setSections}
          hsnCodes={hsnCodes}
          sectionOptions={sectionOptions}
          sizes={sizes}
          units={units}
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

          
        />
          
          
          
          

        {/* Package Information */}
        <PackageInfoSection
          noOfPackages={noOfPackages}
          grossWeight={grossWeight}
          netWeight={netWeight}
          paymentTerms={paymentTerms}
          selectedCurrency={selectedCurrency}
          sections={sections}
          totalSQM={totalSQM}
          exportUnderGstCircular={exportUnderGstCircular}
          integratedTaxOption={integratedTaxOption}
          lutNo={lutNo}
          lutDate={lutDate}
          totalFOBEuro={totalFOBEuro}
          amountInWords={amountInWords}
          setExportUnderGstCircular={setExportUnderGstCircular}
          setLutNo={setLutNo}
          setLutDate={setLutDate}
        />
        <SupplierDetails
          suppliers={suppliers}
          setSuppliers={setSuppliers}
          integratedTaxOption={integratedTaxOption}
          setAuthorizedName={setAuthorizedName}
          setAuthorizedGstin={setAuthorizedGstin}
          setGstInvoiceNoDate={setGstInvoiceNoDate}
          selectedSupplier={selectedSupplier}
          setSelectedSupplier={setSelectedSupplier}
        />
       

        <Card className="mt-24">
          <CardFooter className="flex justify-end gap-4">
           
            <Button onClick={() => {
              setFormSubmitted(true);
              handleSaveInvoice();
              localStorage.setItem("taxDialogBox","false")
            }}>
              <Save className="mr-2 h-4 w-4" />
              Save Invoice
            </Button>
            <Button onClick={handleNext}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Next
            </Button>
          </CardFooter>
        </Card>
      </div>

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
              exporterRef={"Exp/0001/2024-25"}
              ieCode={ieCode}
              companyName={companyProfile?.name || "COMPANY NAME"}
              companyAddress={companyAddress}
              companyEmail={"EMAIL: " + (companyProfile?.email || "info@company.com")}
              taxId={" TX12345"}
              stateCode={"STATE CODE: " + stateCode}
              panNo={"PAN NO. #: " + panNo}
              gstinNo={"GSTIN NO.#: " + gstinNo}
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
              euroRate={currencyRate}
              selectedCurrency={selectedCurrency}

              // Product Information
              items={sections.flatMap(section => section.items.map((item, index) => ({
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
                totalAmount: item.totalFOB
              })))}

              // Package and Declaration
              noOfPackages={noOfPackages}
              grossWeight={grossWeight}
              netWeight={netWeight}
              exportUnderDutyDrawback={exportUnderDutyDrawback}
              ftpIncentiveDeclaration={ftpIncentiveDeclaration}
              exportUnderGstCircular={exportUnderGstCircular}
              lutNo={lutNo}
              lutDate={lutDate}
              fobEuro={totalFOBEuro.toFixed(2)}
              totalFobEuro={totalFOBEuro.toFixed(2)}
              amountInWords={amountInWords}
              integratedTaxOption={integratedTaxOption}

              // Supplier Details
              supplierDetails1={`SUPPLIER DETAILS :- 1\nNAME: ${suppliers[0]?.name || ''}\nGSTIN: ${suppliers[0]?.gstin || ''}`}
              supplierDetails2={suppliers[1] ? `SUPPLIER DETAILS :- 2\nNAME: ${suppliers[1].name}\nGSTIN: ${suppliers[1].gstin}` : ''}
              supplierDetails3={suppliers[2] ? `SUPPLIER DETAILS :- 3\nNAME: ${suppliers[2].name}\nGSTIN: ${suppliers[2].gstin}` : ''}
              gstInvoiceNoDate={gstInvoiceNoDate}
              companyNameFooter={companyProfile?.name}
              declarationText={declarationText}
              authorizedName={authorizedName}
              authorizedGstin={authorizedGstin}
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => {
              const printWindow = window.open('', '_blank');
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
                        ${document.querySelector('.dialog-content')?.innerHTML || ''}
                      </div>
                      <script>
                        window.onload = function() { window.print(); }
                      </script>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }
            }}>Print PDF</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tax Option Dialog */}
      <Dialog open={taxOptionDialogOpen} onOpenChange={setTaxOptionDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tax Option 1</DialogTitle>
          </DialogHeader>
          <div className="border p-4 mt-2">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-3">Tax Option</h3>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="integratedTaxOption">Integrated Tax Option</Label>
                    <Select
                      value={integratedTaxOption}
                      onValueChange={(value: "WITH" | "WITHOUT") => setIntegratedTaxOption(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select integrated tax option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WITHOUT">WITHOUT PAYMENT OF INTEGRATED TAX</SelectItem>
                        <SelectItem value="WITH">WITH PAYMENT OF INTEGRATED TAX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select
                      value={paymentTerms}
                      onValueChange={handlePaymentTermsChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTermsOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="productType">Product Type</Label>
                    <Select
                      value={productType}
                      onValueChange={(value: string) => handleProductTypeChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sanitary">Sanitary</SelectItem>
                        <SelectItem value="Faucets">Faucets</SelectItem>
                        <SelectItem value="Tiles">Tiles</SelectItem>
                        <SelectItem value="Mix">Mix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={()=>{
              localStorage.setItem("taxDialogBox","false")
              setTaxOptionDialogOpen(false)
            }}>
              Submit
              </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceGenerator;
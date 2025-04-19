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
  const [buyersOrderDate, setBuyersOrderDate] = useState<Date>(new Date());
  const [poNo, setPoNo] = useState("");

  // Supplier Info
  const [authorizedName, setAuthorizedName] = useState("ABC");
  const [authorizedGstin, setAuthorizedGstin] = useState("XXXXXXXXXXXX");
  const [gstInvoiceNoDate, setGstInvoiceNoDate] = useState("GST/XXX XX.XX.XXXX");
  const [suppliers, setSuppliers] = useState([
    {
      id: '1',
      name: "ABC",
      gstin: "XXXXXXXXXXXX",
      invoiceNo: "GST/XXX",
      date: "XX.XX.XXXX"
    }
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
  const [currencyRate, setCurrencyRate] = useState("88.95");

  // Dropdown options
  const [exporters, setExporters] = useState<string[]>([
    "Zeric Ceramic", "Nexa International", "Friend Company"
  ]);
  const [placesOfReceipt, setPlacesOfReceipt] = useState<string[]>([
    "MORBI", "THANGADH", "RAJKOT", "DHORAJI", "BHAVNAGAR"
  ]);
  const [portsOfLoading, setPortsOfLoading] = useState<string[]>([
    "Mundra", "Kandla", "PIPAVAV", "Jawaharlal Nehru Port", "SINGAPORE", "SHANGHAI"
  ]);
  const [portsOfDischarge, setPortsOfDischarge] = useState<string[]>([
    "NEW YORK", "NHAVA SHEVA", "CHENNAI", "KOLKATA", "VIZAG"
  ]);
  const [finalDestinations, setFinalDestinations] = useState<string[]>([
    "USA", "GERMANY", "NETHERLANDS", "UAE", "SINGAPORE", "CHINA"
  ]);
  const [countriesOfFinalDestination, setCountriesOfFinalDestination] = useState<string[]>([
    "USA", "GERMANY", "NETHERLANDS", "UAE", "SINGAPORE", "CHINA"
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
    // "Sanitary": "69072100",
    // "Tiles": "69072200",
    // "Mix": "69073000",
    // "Ceramic": "69074000",
    // "Porcelain": "69072100",
    "Glazed porcelain Floor Tiles": "69072100",
    "Polished Vitrified Tiles": "69072200",
    "Ceramic Wall Tiles": "69072300",
    "Digital Floor Tiles": "69072100"
  });
  const [sectionOptions, setSectionOptions] = useState<string[]>([
    "Glazed porcelain Floor Tiles",
    "Polished Vitrified Tiles",
    "Ceramic Wall Tiles",
    "Digital Floor Tiles"
  ]);
  const [paymentTermsOptions, setPaymentTermsOptions] = useState<string[]>([
    "FOB",
    "CIF",
    "CNF",
  ]);

  const [productType, setProductType] = useState<string>("Sanitary");
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
  const [grossWeight, setGrossWeight] = useState("1623");
  const [netWeight, setNetWeight] = useState("1621");
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
  const [lutDate, setLutDate] = useState("DT /XX/20XX");
  const [integratedTaxOption, setIntegratedTaxOption] = useState<"WITH" | "WITHOUT">("WITHOUT");

  // Totals
  const [totalSQM, setTotalSQM] = useState<number>(0);
  const [totalFOBEuro, setTotalFOBEuro] = useState<number>(0);
  const [amountInWords, setAmountInWords] = useState<string>("");

  const [marksAndNosConfig, setMarksAndNosConfig] = useState({
    first: "10",
    second: "X",
    third: "20"
  });
  const [containerType, setContainerType] = useState("FCL");

  // Add these options
  const containerTypes = ["FCL", "LCL"];
  const numberOptions1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "100"];
  const numberOptions2 = ["20", "40"];

  // Add additional state variables for insurance and freight
  const [insuranceAmount, setInsuranceAmount] = useState<number>(0);
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [showInsuranceFreight, setShowInsuranceFreight] = useState<boolean>(false);

  useEffect(() => {
    // Show the tax option dialog
    console.log(localStorage.getItem("taxDialogBox"));
    if(localStorage.getItem("taxDialogBox")=="false"){
      
      setTaxOptionDialogOpen(false);
    }else{

      setTaxOptionDialogOpen(true);
      
    }

    // Set initial data from companyProfile
    if (companyProfile) {
      setPanNo(companyProfile.pan);
      setGstinNo(companyProfile.gstin);
      setDeclarationText(companyProfile.declarationText);
    }

    // Add an empty row to the first section
    addNewRow(sections[0].id);
  }, []);

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
          marksAndNos: `${marksAndNosConfig.first}${marksAndNosConfig.second}${marksAndNosConfig.third} ${containerType}`
        }
      }))
    })));
  }, [marksAndNosConfig, containerType, sections]);

  const addNewRow = (sectionId: string) => {
    // Find the section to get its title
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    // Get the HSN code based on the section title
    const hsnCode = hsnCodes[section.title] || "69072100";
    
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product: {
        id: "",
        description: "",
        hsnCode: hsnCode,
        size: sizes[0] || "600 X 1200",
        price: 10,
        sqmPerBox: 1.44,
        marksAndNos: `${marksAndNosConfig.first}${marksAndNosConfig.second}${marksAndNosConfig.third} ${containerType}`
      },
      quantity: 1000,
      unitType: "Box",
      totalSQM: 1440,
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

  const generatePDF = () => {
    // Validate required fields first
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

    if (!selectedShippingTerm) {
      if (formSubmitted) {
        toast.error("Please select shipping terms");
      }
      return;
    }

    if (sections.length === 0) {
      if (formSubmitted) {
        toast.error("Please add at least one section");
      }
      return;
    }

    const hasEmptyItems = sections.some(section => section.items.some(item => !item.product.marksAndNos || item.quantity <= 0));
    if (hasEmptyItems) {
      if (formSubmitted) {
        toast.error("Please complete all items in all sections");
      }
      return;
    }

    // Show the tax option dialog
    // setTaxOptionDialogOpen(true);
  };

  const handleGeneratePDF = () => {
    // Close the dialog
    
    // Generate the PDF
    const savedInvoice = saveInvoiceData();
    if (!savedInvoice) return;

    setPreviewOpen(true);
    toast.success("PDF preview generated");
  };

  const handleSaveInvoice = ()=>{
    
  }
  const exportCSV = () => {
    if (sections.length === 0) {
      toast.error("Please add at least one section");
      return;
    }

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add header row
    csvContent += "Invoice No,Date,Client,Item,Description,HSN Code,Size,Quantity,SQM/Box,Total SQM,Price,Total FOB\n";

    // Add data rows
    sections.forEach(section => {
      section.items.forEach(item => {
        const row = [
          invoiceNo,
          format(invoiceDate, "dd/MM/yyyy"),
          consignee,
          item.product.marksAndNos,
          item.product.description,
          item.product.hsnCode,
          item.product.size,
          item.quantity,
          item.product.sqmPerBox,
          item.totalSQM,
          item.product.price,
          item.totalFOB
        ];

        csvContent += row.join(",") + "\n";
      });
    });

    // Add total row
    csvContent += ",,,,,,,,," + totalSQM + ",," + totalFOBEuro + "\n";

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Invoice_${invoiceNo.replace(/\//g, "-")}.csv`);
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    document.body.removeChild(link);

    toast.success("CSV exported successfully");
  };

  // Update the handleNext function to pass data to PackagingList
  const handleNext = () => {
    // Save the current state before navigating
    const formData = {
      sections: sections,
      markNumber: `${ieCode}`,
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
        <Card>
          <CardHeader>
            <CardTitle>Exporter Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">EXPORTER</Label>
                  <Select
                    value={selectedExporter}
                    onValueChange={handleExporterSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exporter" />
                    </SelectTrigger>
                    <SelectContent>
                      {exporters.map((exporter) => (
                        <SelectItem key={exporter} value={exporter}>
                          {exporter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">COMPANY ADDRESS</Label>
                  <Textarea
                    id="companyAddress"
                    value={companyAddress}
                    readOnly
                    className="bg-gray-50"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNo">EMAIL</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., yourmail@gmail.com"
                    required
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNo">Tax ID:</Label>
                  <Input
                    id="taxid"
                    value={taxid}
                    onChange={(e) => setTaxid(e.target.value)}
                    placeholder="e.g., 24AACF*********"
                    required
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNo">INVOICE NUMBER</Label>
                    <Input
                      id="invoiceNo"
                      className="w-full"
                      placeholder="e.g., EXP/001/2024"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      readOnly
                    />
                  </div>

                      <div className="space-y-2">
                        <Label>INVOICE DATE</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !invoiceDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={invoiceDate}
                              onSelect={(date) => date && setInvoiceDate(date)}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                <div className="space-y-4">
                  <h3 className="font-medium">EXPORTER'S REF.</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ieCode">I.E. CODE #</Label>
                      <Input
                        id="ieCode"
                        value={ieCode}
                        onChange={(e) => setIeCode(e.target.value)}
                        placeholder="Enter IE code"
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="panNo">PAN NO. #</Label>
                      <Input
                        id="panNo"
                        value={panNo}
                        onChange={(e) => setPanNo(e.target.value)}
                        placeholder="Enter PAN number"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gstinNo">GSTIN NO.#</Label>
                      <Input
                        id="gstinNo"
                        value={gstinNo}
                        onChange={(e) => setGstinNo(e.target.value)}
                        placeholder="Enter GSTIN number"
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stateCode">STATE CODE</Label>
                      <Input
                        id="stateCode"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        placeholder="Enter state code"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Buyer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Buyer's Order No. & Date</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyersOrderNo">ORDER NO.</Label>
                    <Input
                      id="buyersOrderNo"
                      value={buyersOrderNo}
                      onChange={(e) => setBuyersOrderNo(e.target.value)}
                      placeholder="Enter buyer's order number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ORDER DATE</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="buyersOrderDate"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !buyersOrderDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {buyersOrderDate ? format(buyersOrderDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={buyersOrderDate}
                          onSelect={(date) => date && setBuyersOrderDate(date)}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poNo">PO NO.</Label>
                  <Input
                    id="poNo"
                    value={poNo}
                    onChange={(e) => setPoNo(e.target.value)}
                    placeholder="Enter PO number"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="consignee">CONSIGNEE</Label>
                    <Input
                      id="consignee"
                      value={consignee}
                      onChange={(e) => setConsignee(e.target.value)}
                      placeholder="Enter consignee details"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notifyParty">NOTIFY PARTY</Label>
                    <Input
                      id="notifyParty"
                      value={notifyParty}
                      onChange={(e) => setNotifyParty(e.target.value)}
                      placeholder="Enter notify party details"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* First row of fields - yellow highlighted in the image */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preCarriageBy">Pre-Carriage By</Label>
                <Input
                  id="preCarriageBy"
                  value={preCarriageBy}
                  onChange={(e) => setPreCarriageBy(e.target.value)}
                  placeholder="Enter pre-carriage method"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeOfReceipt">Place of Receipt by Pre-Carrier</Label>
                <Select
                  value={placeOfReceipt}
                  onValueChange={(value) => setPlaceOfReceipt(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select place of receipt" />
                  </SelectTrigger>
                  <SelectContent>
                    {placesOfReceipt.map((place) => (
                      <SelectItem key={place} value={place}>
                        {place}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                  <div className="space-y-2">
                    <Label htmlFor="vesselFlightNo">Vessel/Flight No.</Label>
                    <Input
                      id="vesselFlightNo"
                      value={vesselFlightNo}
                      onChange={(e) => setVesselFlightNo(e.target.value)}
                      placeholder="Enter vessel/flight number"
                    />
                  </div>

              <div className="space-y-2">
                <Label htmlFor="portOfLoading">Port of Loading</Label>
                <Select
                  value={portOfLoading}
                  onValueChange={(value) => {
                    setPortOfLoading(value);
                    
                    // Update Terms of Delivery if payment terms are FOB
                    if (paymentTerms === "FOB") {
                      setTermsOfDelivery(`FOB AT ${value}`);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select port of loading" />
                  </SelectTrigger>
                  <SelectContent>
                    {portsOfLoading.map((port) => (
                      <SelectItem key={port} value={port}>
                        {port}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portOfDischarge">Port of Discharge</Label>
                <Select
                  value={portOfDischarge}
                  onValueChange={(value) => {
                    setPortOfDischarge(value);
                    
                    // Update Terms of Delivery if payment terms are CIF or CNF
                    if (paymentTerms === "CIF") {
                      setTermsOfDelivery(`CIF AT ${value}`);
                    } else if (paymentTerms === "CNF") {
                      setTermsOfDelivery(`CNF AT ${value}`);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select port of discharge" />
                  </SelectTrigger>
                  <SelectContent>
                    {portsOfDischarge.map((port) => (
                      <SelectItem key={port} value={port}>
                        {port}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalDestination">Final Destination</Label>
                <Select
                  value={finalDestination}
                  onValueChange={(value) => setFinalDestination(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select final destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {finalDestinations.map((destination) => (
                      <SelectItem key={destination} value={destination}>
                        {destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second row of fields - green highlighted in the image */}
            
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="countryOfOrigin">Country of Origin of Goods</Label>
                <Input
                  id="countryOfOrigin"
                  value={countryOfOrigin}
                  onChange={(e) => setCountryOfOrigin(e.target.value)}
                  placeholder="Enter country of origin"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originDetails">Origin Details</Label>
                <Input
                  id="originDetails"
                  value={originDetails}
                  onChange={(e) => setOriginDetails(e.target.value)}
                  placeholder="Enter origin details"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryOfFinalDestination">Country of Final Destination</Label>
                <Select
                  value={countryOfFinalDestination}
                  onValueChange={(value) => setCountryOfFinalDestination(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country of final destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {countriesOfFinalDestination.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>

             
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="termsOfDelivery">Terms of Delivery</Label>
                <Input
                  id="termsOfDelivery"
                  value={termsOfDelivery}
                  readOnly
                  className="bg-gray-50"
                  placeholder="Terms of Delivery"
                />
              </div>

              <div>
              <Label htmlFor="payment" className="uppercase text-xs">Payment :</Label>
              <div className="flex items-start gap-2">
                <Textarea
                  id="payment"
                  className="mt-1 h-24"
                  placeholder="Enter Payment Details"
                  
                  
                />
              </div>
            </div>

             
              
              <div className="grid flex-row grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingMethod">Shipping Method</Label>
                <Select
                  value={shippingMethod}
                  onValueChange={(value) => setShippingMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shipping method" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="selectedCurrency">Currency</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) => setSelectedCurrency(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currencyRate">Current {selectedCurrency} Rate</Label>
                <Input
                  id="currencyRate"
                  value={currencyRate}
                  onChange={(e) => setCurrencyRate(e.target.value)}
                  placeholder="Enter currency rate"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Product Information</CardTitle>
            <Button onClick={addNewSection}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg">
              <div className="space-y-4">
                <h4 className="font-medium">Marks & Nos.</h4>
                <div className="flex flex-row w-96 gap-1">
                  {/* Group 1: First Dropdown and X */}
                  <div className="flex flex-row gap-3 w-36">
                    <Select
                      value={marksAndNosConfig.first}
                      onValueChange={(value) => setMarksAndNosConfig(prev => ({ ...prev, first: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number" />
                      </SelectTrigger>
                      <SelectContent>
                        {numberOptions1.map((num) => (
                          <SelectItem key={num} value={num}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center w-8 justify-center">
                      <span className="text-md font-medium">X</span>
                    </div>
                  </div>

                  {/* Small gap between "X" and 2nd dropdown */}
                  <div className="w-1" />

                  {/* Group 2: Third Dropdown and Container Type */}
                  <div className="flex flex-row gap-10 w-64">
                    <Select
                      value={marksAndNosConfig.third}
                      onValueChange={(value) => setMarksAndNosConfig(prev => ({ ...prev, third: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number" />
                      </SelectTrigger>
                      <SelectContent>
                        {numberOptions2.map((num) => (
                          <SelectItem key={num} value={num}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={containerType}
                      onValueChange={setContainerType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {containerTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {sections.map((section, sectionIndex) => (
                <div key={section.id} className="mb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <select
                      title="Section Title"
                      value={section.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        // Get HSN code for the selected title
                        const hsnCode = hsnCodes[newTitle] || "69072100";
                        
                        setSections(currentSections =>
                          currentSections.map(s => {
                            if (s.id === section.id) {
                              // Update section title and all items' HSN codes
                              return {
                                ...s,
                                title: newTitle,
                                items: s.items.map(item => ({
                                  ...item,
                                  product: {
                                    ...item.product,
                                    hsnCode: hsnCode
                                  }
                                }))
                              };
                            }
                            return s;
                          })
                        );
                      }}
                      className="w-96 font-medium border rounded px-2 py-2"
                    >
                      {sectionOptions.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    {sections.length > 1 && section.items.length === 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSections(currentSections =>
                            currentSections.filter(s => s.id !== section.id)
                          );
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Table className="invoice-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">SR NO</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>HSN Code</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="w-[100px]">Quantity</TableHead>
                        <TableHead>Unit Type</TableHead>
                        <TableHead>SQM/BOX</TableHead>
                        <TableHead>Total SQM</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total FOB</TableHead>
                        <TableHead className="w-[70px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.items.map((item, itemIndex) => {
                        // Calculate the absolute index for SR NO
                        let absoluteIndex = 1;
                        for (let i = 0; i < sectionIndex; i++) {
                          absoluteIndex += sections[i].items.length;
                        }
                        absoluteIndex += itemIndex;

                        return (
                          <TableRow key={item.id}>
                            <TableCell>{absoluteIndex}</TableCell>
                            <TableCell>
                              <Input
                                value={item.product.description}
                                onChange={(e) => {
                                  setSections(currentSections =>
                                    currentSections.map(s =>
                                      s.id === section.id
                                        ? {
                                          ...s,
                                          items: s.items.map(i =>
                                            i.id === item.id
                                              ? {
                                                ...i,
                                                product: {
                                                  ...i.product,
                                                  description: e.target.value,
                                                  hsnCode: hsnCodes[e.target.value] || hsnCodes["Sanitary"]
                                                }
                                              }
                                              : i
                                          )
                                        }
                                        : s
                                    )
                                  );
                                }}
                                className="h-8"
                                placeholder="Enter description"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.product.hsnCode}
                                readOnly
                                className="h-8 bg-gray-50 w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.product.size}
                                onValueChange={(value) => {
                                  setSections(currentSections =>
                                    currentSections.map(s =>
                                      s.id === section.id
                                        ? {
                                          ...s,
                                          items: s.items.map(i =>
                                            i.id === item.id
                                              ? {
                                                ...i,
                                                product: {
                                                  ...i.product,
                                                  size: value
                                                }
                                              }
                                              : i
                                          )
                                        }
                                        : s
                                    )
                                  );
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sizes.map((size) => (
                                    <SelectItem key={size} value={size}>
                                      {size}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => {
                                  const quantity = parseInt(e.target.value) || 0;
                                  setSections(currentSections =>
                                    currentSections.map(s =>
                                      s.id === section.id
                                        ? {
                                          ...s,
                                          items: s.items.map(i =>
                                            i.id === item.id
                                              ? {
                                                ...i,
                                                quantity,
                                                totalSQM: quantity * i.product.sqmPerBox,
                                                totalFOB: quantity * i.product.price
                                              }
                                              : i
                                          )
                                        }
                                        : s
                                    )
                                  );
                                }}
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.unitType}
                                onValueChange={(value) => {
                                  setSections(currentSections =>
                                    currentSections.map(s =>
                                      s.id === section.id
                                        ? {
                                          ...s,
                                          items: s.items.map(i =>
                                            i.id === item.id
                                              ? { ...i, unitType: value }
                                              : i
                                          )
                                        }
                                        : s
                                    )
                                  );
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {units.map((unit) => (
                                    <SelectItem key={unit} value={unit}>
                                      {unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>{item.product.sqmPerBox.toFixed(2)}</TableCell>
                            <TableCell>{item.totalSQM.toFixed(2)}</TableCell>
                            <TableCell>{item.product.price.toFixed(2)}</TableCell>
                            <TableCell>{item.totalFOB.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeRow(section.id, item.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={11}>
                          <Button
                            variant="ghost"
                            onClick={() => addNewRow(section.id)}
                            className="h-8"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Row
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ))}

              {/* Total row at the bottom */}
              <div className="w-full border-t border-gray-300">
                {showInsuranceFreight && (
                  <>
                    <div className="flex justify-end border-b border-gray-200">
                      <div className="w-1/3 text-right p-3 font-medium">
                        {paymentTerms === "CIF" && "Insurance"}
                      </div>
                      <div className="w-1/6 text-right p-3 font-medium border-l border-gray-200">
                        {paymentTerms === "CIF" && (
                          <Input
                            type="number"
                            value={insuranceAmount}
                            onChange={(e) => setInsuranceAmount(Number(e.target.value) || 0)}
                            className="text-right border-0 p-0 h-6"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end border-b border-gray-200">
                      <div className="w-1/3 text-right p-3 font-medium">
                        Frieght
                      </div>
                      <div className="w-1/6 text-right p-3 font-medium border-l border-gray-200">
                        <Input
                          type="number"
                          value={freightAmount}
                          onChange={(e) => setFreightAmount(Number(e.target.value) || 0)}
                          className="text-right border-0 p-0 h-6"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="flex justify-end">
                  <div className="w-1/3 text-right p-4 font-medium">
                    <div className="text-sm font-medium text-gray-500">Total</div>
                  </div>
                  <div className="w-1/6 text-right p-4 font-semibold text-lg border-l border-gray-200">
                    {totalFOBEuro.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Information */}
        <Card>
          <CardHeader>
            <CardTitle>Package Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="noOfPackages">No. of Packages</Label>
                <Input
                  id="noOfPackages"
                  value={noOfPackages}
                  readOnly
                  className="cursor-default"
                  // onChange={(e) => setNoOfPackages(e.target.value)}
                  placeholder="e.g., 14000 BOX"
                />
              </div>

                  <div className="space-y-2">
                    <Label htmlFor="grossWeight">Gross Weight (KGS)</Label>
                    <Input
                      id="grossWeight"
                      value={grossWeight}
                      readOnly
                      className="cursor-default"
                      placeholder="Enter gross weight"
                    />
                  </div>

              <div className="space-y-2">
                <Label htmlFor="netWeight">Net Weight (KGS)</Label>
                <Input
                  id="netWeight"
                  readOnly
                  className="cursor-default"
                  value={netWeight}
                  // onChange={(e) => setNetWeight(e.target.value)}
                  placeholder="Enter net weight"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exportUnderGstCircular">Export Under GST Circular</Label>
                <Input
                  id="exportUnderGstCircular"
                  value={exportUnderGstCircular}
                  onChange={(e) => setExportUnderGstCircular(e.target.value)}
                  placeholder="Enter GST circular details"
                />
              </div>

                  {integratedTaxOption === "WITHOUT" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lutNo">Application Reference Number</Label>
                        <Input
                          id="lutNo"
                          value={lutNo}
                          onChange={(e) => setLutNo(e.target.value)}
                          placeholder="Enter LUT number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lutDate">LUT Date</Label>
                        <Input
                          id="lutDate"
                          value={lutDate}
                          onChange={(e) => setLutDate(e.target.value)}
                          placeholder="Enter LUT date"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalFOBEuro">TOTAL FOB EURO</Label>
                    <Input
                      id="totalFOBEuro"
                      value={totalFOBEuro.toFixed(2)}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

              <div className="space-y-2">
                <Label htmlFor="amountInWords">Amount In Words</Label>
                <Input
                  id="amountInWords"
                  value={amountInWords}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {integratedTaxOption === "WITHOUT" && (
          <Card>
            <CardHeader>
              <CardTitle>Supplier Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex-grow"></div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuppliers([...suppliers, {
                      id: (suppliers.length + 1).toString(),
                      name: '',
                      gstin: '',
                      invoiceNo: '',
                      date: ''
                    }]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </div>
              {suppliers.map((supplier, index) => (
                <div key={supplier.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">SUPPLIER DETAILS :- {index + 1}</h4>
                    {suppliers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSuppliers(suppliers.filter(s => s.id !== supplier.id));
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${supplier.id}`}>NAME :</Label>
                      <Input
                        id={`name-${supplier.id}`}
                        value={supplier.name}
                        onChange={(e) => {
                          setSuppliers(suppliers.map(s =>
                            s.id === supplier.id
                              ? { ...s, name: e.target.value }
                              : s
                          ));
                          if (index === 0) {
                            setAuthorizedName(e.target.value);
                          }
                        }}
                        placeholder="Enter supplier name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`gstin-${supplier.id}`}>GSTIN NO. :</Label>
                      <Input
                        id={`gstin-${supplier.id}`}
                        value={supplier.gstin}
                        onChange={(e) => {
                          setSuppliers(suppliers.map(s =>
                            s.id === supplier.id
                              ? { ...s, gstin: e.target.value }
                              : s
                          ));
                          if (index === 0) {
                            setAuthorizedGstin(e.target.value);
                          }
                        }}
                        placeholder="Enter GSTIN number"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`invoiceNo-${supplier.id}`}>TAX INVOICE NO :</Label>
                        <Input
                          id={`invoiceNo-${supplier.id}`}
                          value={supplier.invoiceNo}
                          onChange={(e) => {
                            setSuppliers(suppliers.map(s =>
                              s.id === supplier.id
                                ? { ...s, invoiceNo: e.target.value }
                                : s
                            ));
                            if (index === 0) {
                              setGstInvoiceNoDate(`${e.target.value} ${supplier.date}`);
                            }
                          }}
                          placeholder="Enter tax invoice number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`date-${supplier.id}`}>DATE :</Label>
                        <Input
                          id={`date-${supplier.id}`}
                          type="date"
                          value={supplier.date}
                          onChange={(e) => {
                            setSuppliers(suppliers.map(s =>
                              s.id === supplier.id
                                ? { ...s, date: e.target.value }
                                : s
                            ));
                            if (index === 0) {
                              setGstInvoiceNoDate(`${supplier.invoiceNo} ${e.target.value}`);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
          <div className="border p-1 mt-2">
            <div className="space-y-4">
              <h3 className="font-medium">Tax Option</h3>
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
                  onValueChange={(value: string) => setProductType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
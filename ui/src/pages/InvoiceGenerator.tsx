import React, { useState, useEffect } from "react";
import { useInvoiceData } from "@/hooks/useInvoiceData";
import { useInvoicePreview } from "@/hooks/useInvoicePreview";
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
import { Trash, Plus, FileText, Save, ChevronDown, ChevronUp } from "lucide-react";
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
  const { clients, products, shippingTerms, companyProfile, isLoading, error } = useInvoiceData();
  const { generatePreview, previewUrl, isLoading: isPreviewLoading } = useInvoicePreview({
    onPreviewSuccess: () => setPreviewOpen(true),
    onPreviewError: (error) => toast.error(error)
  });

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
  const [portOfLoading, setPortOfLoading] = useState("MUNDRA");
  const [portOfDischarge, setPortOfDischarge] = useState("Mundra");
  const [finalDestination, setFinalDestination] = useState("USA");
  const [countryOfOrigin, setCountryOfOrigin] = useState("INDIA");
  const [originDetails, setOriginDetails] = useState("DISTRICT MORBI, STATE GUJARAT");
  const [countryOfFinalDestination, setCountryOfFinalDestination] = useState("USA");
  const [termsOfDelivery, setTermsOfDelivery] = useState("FOB AT MUNDRA PORT");
  const [paymentTerms, setPaymentTerms] = useState("FOB");
  const [shippingMethod, setShippingMethod] = useState("SHIPPING - THROUGH SEA");
  const [selectedCurrency, setSelectedCurrency] = useState("EUR");
  const [currencyRate, setCurrencyRate] = useState("88.95");

  // Dropdown options
  const [exporters, setExporters] = useState<string[]>([
    "Zeric Ceramic", "Nexa International", "Friend Company"
  ]);
  const [placesOfReceipt, setPlacesOfReceipt] = useState<string[]>([
    "MORBI", "AHMEDABAD", "MUMBAI", "DELHI", "CHENNAI"
  ]);
  const [portsOfLoading, setPortsOfLoading] = useState<string[]>([
    "MUNDRA", "NHAVA SHEVA", "CHENNAI", "KOLKATA", "VIZAG"
  ]);
  const [portsOfDischarge, setPortsOfDischarge] = useState<string[]>([
    "Mundra", "Kandla", "Jawaharlal Nehru Port", "DUBAI", "SINGAPORE", "SHANGHAI"
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
    "EUR", "USD", "GBP", "INR", "AED"
  ]);
  const [sizes, setSizes] = useState<string[]>([
    "600 X 1200", "600 X 600", "800 X 800", "300 X 600", "300 X 300"
  ]);
  const [units, setUnits] = useState<string[]>([
    "Box", "Pallet", "Carton", "Piece"
  ]);
  const [hsnCodes] = useState<{ [key: string]: string }>({
    "Sanitary": "69072100",
    "Tiles": "69072200",
    "Mix": "69073000",
    "Ceramic": "69074000",
    "Porcelain": "69072100"
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
  const numberOptions1 = ["10", "20", "30", "40", "50", "60", "70", "80", "90", "100"];
  const numberOptions2 = ["20", "40"];

  useEffect(() => {
    // Show the tax option dialog
    setTaxOptionDialogOpen(true);

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
    setTotalFOBEuro(fobTotal);
    setAmountInWords(numberToWords(Math.round(fobTotal)));
  }, [sections]);

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
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product: {
        id: "",
        description: "",
        hsnCode: "69072100",
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
    const newSection: ProductSection = {
      id: Date.now().toString(),
      title: 'New Section',
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
      setTermsOfDelivery(`FOB AT ${term.port}`);
      setPortOfLoading(term.port);
      setCurrencyRate(term.euroRate.toString());
    }
  };

  const handleExporterSelect = (exporter: string) => {
    setSelectedExporter(exporter);
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

 
  const handleGeneratePDF = () => {
    // Close the dialog
    setTaxOptionDialogOpen(false);

    // Generate the PDF
    const savedInvoice = saveInvoiceData();
    if (!savedInvoice) return;

    setPreviewOpen(true);
    toast.success("PDF preview generated");
  };

  // Function to generate PDF directly with the exact layout from the images
  const generateDirectPDF = () => {
    // Calculate totals for the invoice
    let totalQuantity = 0;
    let calculatedTotalSQM = 0;
    let calculatedTotalAmount = 0;
    
    // Calculate totals from sections
    sections.forEach((section) => {
      section.items.forEach((item) => {
        const sqmPerBox = item.product.sqmPerBox || 0;
        const totalSqm = item.quantity * sqmPerBox;
        const totalItemAmount = item.product.price * totalSqm;
        
        totalQuantity += item.quantity;
        calculatedTotalSQM += totalSqm;
        calculatedTotalAmount += totalItemAmount;
      });
    });
    
    // Create a hidden iframe to render the PDF content
    const iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden';
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    document.body.appendChild(iframe);
    
    // Define the HTML content for the PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceNo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 10pt;
              line-height: 1.3;
              margin: 0;
              padding: 0;
            }
            .invoice-container {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              page-break-after: always;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #000;
              padding: 5px;
              text-align: left;
              font-size: 9pt;
              vertical-align: top;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
              text-align: center;
            }
            .header {
              text-align: center;
              font-weight: bold;
              margin: 0 0 10px 0;
              font-size: 14pt;
            }
            .subheader {
              text-align: center;
              margin: 0 0 10px 0;
              font-size: 10pt;
            }
            .section {
              margin-bottom: 0;
              border-collapse: collapse;
            }
            .bold {
              font-weight: bold;
            }
            .company-details {
              text-align: center;
              font-size: 10pt;
              margin-bottom: 15px;
            }
            .company-name {
              font-size: 16pt;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .invoice-header {
              text-align: center;
              font-weight: bold;
              font-size: 14pt;
              border: 1px solid black;
              padding: 5px;
              margin-bottom: 5px;
            }
            .invoice-subheader {
              text-align: center;
              font-size: 9pt;
              font-style: italic;
              border: 1px solid black;
              border-top: none;
              padding: 5px;
              margin-bottom: 10px;
            }
            .item-row:nth-child(odd) {
              background-color: #f9f9f9;
            }
            .item-header {
              background-color: #f2f2f2;
              text-align: center;
              font-weight: bold;
            }
            .orange-bg {
              background-color: #FFDAB9;
            }
            .exporter-section {
              width: 33%;
            }
            .right-align {
              text-align: right;
            }
            .center-align {
              text-align: center;
            }
            .no-border-bottom {
              border-bottom: none;
            }
            .no-border-top {
              border-top: none;
            }
            .details-container {
              display: flex;
              justify-content: space-between;
            }
            .details-table {
              width: 100%;
            }
            .item-table th, .item-table td {
              text-align: center;
              padding: 3px;
              font-size: 8pt;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Company Name and Details at Top -->
            <div class="company-name">COMPANY NAME</div>
            <div class="company-details">${companyAddress.replace(/\n/g, '<br>')}</div>
            <div class="company-details">EMAIL: ${email}</div>
            <table class="section">
              <tr>
                <td width="33%">TAX ID: ${taxid}</td>
                <td width="33%">STATE CODE: ${stateCode}</td>
                <td width="33%">PAN NO. #: ${panNo}</td>
              </tr>
              <tr>
                <td colspan="3">GSTIN NO.#: ${gstinNo}</td>
              </tr>
            </table>
            
            <!-- Invoice Header -->
            <div class="invoice-header">CUSTOMS INVOICE</div>
            <div class="invoice-subheader">
              SUPPLY MEANT FOR EXPORT UNDER BOND & LUT- LETTER OF UNDERTAKING ${integratedTaxOption} PAYMENT OF INTEGRATED TAX
            </div>
            
            <!-- Invoice and Exporter Details -->
            <table class="section">
              <tr>
                <td width="33%">
                  <div><strong>Invoice No.:</strong> ${invoiceNo}</div>
                  <div><strong>Date:</strong> ${format(invoiceDate, 'yyyy-MM-dd')}</div>
                  <div><strong>Exporter's Ref.:</strong> Exp/0001/2024-25</div>
                  <div><strong>I.E. Code #:</strong> ${ieCode}</div>
                </td>
                <td width="33%">
                  <div><strong>Buyer's Order No.:</strong> ${buyersOrderNo}</div>
                  <div><strong>Buyer's Order Date:</strong> ${format(buyersOrderDate, 'yyyy-MM-dd')}</div>
                  <div><strong>PO No.:</strong> ${poNo}</div>
                  <div><strong>Consignee:</strong> ${consignee}</div>
                  <div><strong>Notify Party:</strong> ${notifyParty}</div>
                </td>
                <td width="33%">
                </td>
              </tr>
            </table>
            
            <!-- Shipping Details -->
            <table class="section">
              <tr>
                <td width="25%"><strong>Pre-Carriage By:</strong> ${preCarriageBy}</td>
                <td width="25%"><strong>Place of Receipt:</strong> ${placeOfReceipt}</td>
                <td width="25%"><strong>Country of Origin:</strong> ${countryOfOrigin}</td>
                <td width="25%"><strong>Country of Final Destination:</strong> ${countryOfFinalDestination}</td>
              </tr>
              <tr>
                <td><strong>Vessel/Flight No.:</strong> ${vesselFlightNo}</td>
                <td><strong>Port of Loading:</strong> ${portOfLoading}</td>
                <td>
                  <strong>Port of Discharge:</strong> ${portOfDischarge}<br>
                  <strong>Final Destination:</strong> ${finalDestination}
                </td>
                <td>
                  <strong>Terms of Delivery:</strong> ${termsOfDelivery}
                </td>
              </tr>
              <tr>
                <td><strong>Payment Terms:</strong> ${paymentTerms}</td>
                <td><strong>Shipping Method:</strong> ${shippingMethod}</td>
                <td colspan="2"><strong>EURO RATE:</strong> ${currencyRate}</td>
              </tr>
            </table>
            
            <!-- Marks & Nos and Description -->
            <table class="section">
              <tr>
                <td width="15%">
                  <strong>Marks & Nos.:</strong><br>
                  ${marksAndNosConfig.first}X${marksAndNosConfig.third} ${containerType}
                </td>
                <td width="85%" colspan="9">
                  <strong>Description of Goods:</strong><br>
                  SHIPPING - THROUGH SEA/AIR
                </td>
              </tr>
            </table>
            
            <!-- Product Table -->
            <table class="section item-table">
              <thead>
                <tr class="item-header">
                  <th>SR NO.</th>
                  <th>PKG</th>
                  <th>Description of Goods</th>
                  <th>HSN CODE</th>
                  <th>QUANTITY</th>
                  <th>UNIT TYPE</th>
                  <th>SQM/ BOX</th>
                  <th>TOTAL SQM</th>
                  <th>PRICE / SQM</th>
                  <th>AMOUNT IN EURO</th>
                </tr>
              </thead>
              <tbody>
                ${generateProductTableRows()}
                <!-- Total Row -->
                <tr>
                  <td colspan="4"></td>
                  <td>${totalQuantity}</td>
                  <td></td>
                  <td></td>
                  <td>${calculatedTotalSQM.toFixed(0)}</td>
                  <td></td>
                  <td>${calculatedTotalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <!-- Export Under Section -->
            <table class="section">
              <tr>
                <td colspan="10">
                  <strong>Export Under Duty Drawback - Volume</strong><br>
                  Serial No.:
                </td>
              </tr>
            </table>
            
            <!-- Bank Details and Payments -->
            <table class="section">
              <tr>
                <td width="20%"><strong>BANK DETAILS:</strong></td>
                <td width="20%"><strong>${selectedCurrency} (€):</strong> ${calculatedTotalAmount.toFixed(2)}</td>
                <td width="40%"></td>
                <td width="20%" class="right-align"><strong>FOB EURO:</strong> ${calculatedTotalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>NAME:</strong></td>
                <td colspan="2"></td>
                <td rowspan="2" class="right-align">
                  <div>INR</div>
                  <div>200.00</div>
                </td>
              </tr>
              <tr>
                <td><strong>BRANCH, ACCOUNT NO., SWIFT CODE:</strong></td>
                <td colspan="2"></td>
              </tr>
              <tr>
                <td><strong>IFSC, IBAN CODE:</strong></td>
                <td colspan="3"></td>
              </tr>
              <tr>
                <td colspan="3">${amountInWords || 'EIGHTY-SEVEN THOUSAND TWO HUNDRED AND NINETY-EIGHT EURO AND SIXTY CENTS ONLY'}</td>
                <td class="right-align"><strong>TOTAL FOB EURO:</strong> ${calculatedTotalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <!-- Second page - Supplier Details -->
          <div class="invoice-container">
            <div class="invoice-header">
              LETTER OF CREDIT HAVING THE ACKNOWLEDGEMENT FOR LUT APPLICATION REFERENCE NUMBER (ARN): xxxxxxxxxxxxxxxxx
            </div>
            
            <!-- Supplier Details Layout -->
            <table class="section">
              <tr>
                <td width="50%" class="bold center-align">SUPPLIER DETAILS - 1</td>
                <td width="50%" class="bold center-align">SUPPLIER DETAILS - 2</td>
              </tr>
              <tr>
                <td>
                  <div class="bold">NAME:</div>
                  <div>${authorizedName}</div>
                </td>
                <td></td>
              </tr>
              <tr>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>
                  <div class="bold">GSTIN NO.:</div>
                  <div>${authorizedGstin}</div>
                </td>
                <td></td>
              </tr>
              <tr>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>
                  <div class="bold">TAX INVOICE NO & DATE:</div>
                  <div>${gstInvoiceNoDate}</div>
                </td>
                <td></td>
              </tr>
              <tr>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td class="bold center-align">SUPPLIER DETAILS - 3</td>
                <td>
                  <div class="bold right-align">Signature & Date</div>
                  <div class="right-align">For Company Name</div>
                </td>
              </tr>
              <tr>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <div class="bold right-align">AUTHORISED SIGN</div>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <div class="bold">Declaration:</div>
                  <div>${declarationText}</div>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;
    
    // Helper function to generate product table rows
    function generateProductTableRows() {
      let rows = '';
      let rowCounter = 1;
      
      sections.forEach((section, sectionIndex) => {
        // Add category header for sections after the first one
        if (sectionIndex > 0) {
          rows += `
            <tr class="orange-bg">
              <td colspan="10"><div class="bold">${section.title} Category</div></td>
            </tr>
          `;
        }
        
        // Add rows for each item
        section.items.forEach((item) => {
          const sqmPerBox = item.product.sqmPerBox || 0;
          const totalSqm = item.quantity * sqmPerBox;
          const totalItemAmount = item.product.price * totalSqm;
          
          rows += `
            <tr class="item-row">
              <td>${rowCounter}</td>
              <td></td>
              <td>${item.product.description}</td>
              <td>${item.product.hsnCode || ''}</td>
              <td>${item.quantity}</td>
              <td>${item.unitType || 'Box'}</td>
              <td>${sqmPerBox.toFixed(2)}</td>
              <td>${totalSqm.toFixed(0)}</td>
              <td>${item.product.price.toFixed(2)}</td>
              <td>${totalItemAmount.toFixed(2)}</td>
            </tr>
          `;
          
          rowCounter++;
        });
      });
      
      return rows;
    }
    
    // Write HTML content to the iframe
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      iframe.contentWindow.print();
      
      // Remove the iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
      toast.success("Invoice PDF generated successfully");
    }, 500);
  };

  // Replace exportCSV with direct PDF generation in handleSaveInvoice
  const handleSaveInvoice = () => {
    // Save the invoice data
    const savedInvoice = saveInvoiceData();
    if (!savedInvoice) return;
    
    // Generate PDF directly
    generateDirectPDF();
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
          <CardContent className="space-y-6">
            {/* Section 1: Exporter and Invoice Information */}
            <Collapsible
              open={expandedSection === 'exporter'}
              onOpenChange={() => toggleSection('exporter')}
              className="border rounded-md overflow-hidden transition-all duration-300 ease-in-out mb-4 shadow-sm hover:shadow"
            >
              <CollapsibleTrigger className="flex justify-between items-center w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 cursor-pointer border-b focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500">
                <h3 className="text-lg font-medium">Exporter and Invoice Information</h3>
                <div className="flex items-center">
                  {expandedSection === 'exporter' ? 
                    <ChevronUp className="h-5 w-5 transition-transform duration-300" /> : 
                    <ChevronDown className="h-5 w-5 transition-transform duration-300" />
                  }
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-6 transition-all duration-300 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                {/* Exporter and Invoice Information */}
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
                      />
                    </div>

                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNo">INVOICE NUMBER</Label>
                        <Input
                          id="invoiceNo"
                          value={invoiceNo}
                          onChange={(e) => setInvoiceNo(e.target.value)}
                          placeholder="e.g., EXP/001/2024"
                          required
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
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="panNo">PAN NO. #</Label>
                          <Input
                            id="panNo"
                            value={panNo}
                            onChange={(e) => setPanNo(e.target.value)}
                            placeholder="Enter PAN number"
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
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stateCode">STATE CODE</Label>
                          <Input
                            id="stateCode"
                            value={stateCode}
                            onChange={(e) => setStateCode(e.target.value)}
                            placeholder="Enter state code"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buyer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="consignee">CONSIGNEE</Label>
                      <Input
                        id="consignee"
                        value={consignee}
                        onChange={(e) => setConsignee(e.target.value)}
                        placeholder="Enter consignee details"
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">BUYER'S ORDER NO. & DATE</h3>
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
                  </div>

                  <div className="space-y-4">
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
              </CollapsibleContent>
            </Collapsible>
            
            {/* Section 2: Shipping Information */}
            <Collapsible
              open={expandedSection === 'shipping'}
              onOpenChange={() => toggleSection('shipping')}
              className="border rounded-md overflow-hidden transition-all duration-300 ease-in-out mb-4 shadow-sm hover:shadow"
            >
              <CollapsibleTrigger className="flex justify-between items-center w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 cursor-pointer border-b focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500">
                <h3 className="text-lg font-medium">Shipping Information</h3>
                <div className="flex items-center">
                  {expandedSection === 'shipping' ? 
                    <ChevronUp className="h-5 w-5 transition-transform duration-300" /> : 
                    <ChevronDown className="h-5 w-5 transition-transform duration-300" />
                  }
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-6 transition-all duration-300 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                {/* Shipping Information */}
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
                    <Label htmlFor="placeOfReceipt">Place of Receipt</Label>
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
                    <Label htmlFor="countryOfOrigin">Country of Origin</Label>
                    <Input
                      id="countryOfOrigin"
                      value={countryOfOrigin}
                      onChange={(e) => setCountryOfOrigin(e.target.value)}
                      placeholder="Enter country of origin"
                    />
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
                      onValueChange={(value) => setPortOfLoading(value)}
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
                      onValueChange={(value) => setPortOfDischarge(value)}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="termsOfDelivery">Terms of Delivery</Label>
                    <Input
                      id="termsOfDelivery"
                      value={termsOfDelivery}
                      onChange={(e) => setTermsOfDelivery(e.target.value)}
                      placeholder="Enter terms of delivery"
                    />
                  </div>

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
                    <Label htmlFor="originDetails">Origin Details</Label>
                    <Input
                      id="originDetails"
                      value={originDetails}
                      onChange={(e) => setOriginDetails(e.target.value)}
                      placeholder="Enter origin details"
                    />
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
              </CollapsibleContent>
            </Collapsible>
            
            {/* Section 3: Product Information */}
            <Collapsible
              open={expandedSection === 'product'}
              onOpenChange={() => toggleSection('product')}
              className="border rounded-md overflow-hidden transition-all duration-300 ease-in-out shadow-sm hover:shadow"
            >
              <CollapsibleTrigger className="flex justify-between items-center w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 cursor-pointer border-b focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500">
                <h3 className="text-lg font-medium">Product Information & Package Details</h3>
                <div className="flex items-center">
                  {expandedSection === 'product' ? 
                    <ChevronUp className="h-5 w-5 transition-transform duration-300" /> : 
                    <ChevronDown className="h-5 w-5 transition-transform duration-300" />
                  }
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-6 transition-all duration-300 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                {/* Product Information */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Product Information</h3>
                    <Button onClick={addNewSection}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </div>

                  <div className="rounded-lg">
                    <div className="space-y-4">
                      <h4 className="font-medium">Marsks & Nos.</h4>
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
                              setSections(currentSections =>
                                currentSections.map(s =>
                                  s.id === section.id
                                    ? { ...s, title: e.target.value }
                                    : s
                                )
                              );
                            }}
                            className="w-96 font-medium  border rounded px-2 py-2"
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
                              <TableHead>Price (EUR)</TableHead>
                              <TableHead>Total FOB (EUR)</TableHead>
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
                      <div className="flex justify-end p-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-500">Total</div>
                          <div className="text-lg font-semibold text-black">{totalFOBEuro.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Package Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="noOfPackages">No. of Packages</Label>
                    <Input
                      id="noOfPackages"
                      value={noOfPackages}
                      readOnly
                      className="cursor-default"
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
                      placeholder="Enter net weight"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Section 4: GST Information */}
            <Collapsible
              open={expandedSection === 'gst'}
              onOpenChange={() => toggleSection('gst')}
              className="border rounded-md overflow-hidden transition-all duration-300 ease-in-out mb-4 shadow-sm hover:shadow"
            >
              <CollapsibleTrigger className="flex justify-between items-center w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 cursor-pointer border-b focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500">
                <h3 className="text-lg font-medium">GST Information</h3>
                <div className="flex items-center">
                  {expandedSection === 'gst' ? 
                    <ChevronUp className="h-5 w-5 transition-transform duration-300" /> : 
                    <ChevronDown className="h-5 w-5 transition-transform duration-300" />
                  }
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-6 transition-all duration-300 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
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

                {integratedTaxOption === "WITHOUT" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Supplier Details</h3>
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
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>

          <CardFooter className="flex justify-end gap-4">
            {/* <Button variant="outline" onClick={exportCSV}>
              <FileText className="mr-2 h-4 w-4" />
              Export CSV
            </Button> */}
            <Button onClick={() => {
              setFormSubmitted(true);
              handleSaveInvoice();
            }}>
              <Save className="mr-2 h-4 w-4" />
              Save Invoice
            </Button>
            {/* <Button onClick={() => {
              setFormSubmitted(true);
              generatePDF();
            }}>
              <FileText className="mr-2 h-4 w-4" />
              Generate PDF
            </Button> */}
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
              taxId={"TAX ID: TX12345"}
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
                  onValueChange={(value: string) => setPaymentTerms(value)}
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
            <Button onClick={handleGeneratePDF}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceGenerator;

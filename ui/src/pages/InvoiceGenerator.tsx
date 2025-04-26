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

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Trash, Plus, FileText, Save, ArrowRight } from "lucide-react";
import {
  getClients,
  getProducts,
  getShippingTerms,
  getCompanyProfile,
  saveInvoice,
} from "@/lib/dataService";
import {
  Client,
  Product,
  ShippingTerm,
  CompanyProfile,
  InvoiceItem,
  Invoice,
  ProductSection,
} from "@/lib/types";

import { toast } from "sonner";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import PackageInfoSection from "@/components/forms/PackageInfoSection";


import ProductInformationCard from "@/components/forms/ProductInformationCard";

import { SupplierDetails } from "@/components/forms/SupplierDetails";
import ShippingInformationPage from "@/components/forms/ShippingInformationPage";
import BuyerInformationCard from "@/components/forms/BuyerInformationCard";
import ExporterInfo from "@/components/forms/ExporterInfo";

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
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingTerms, setShippingTerms] = useState<ShippingTerm[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null
  );

  const [previewOpen, setPreviewOpen] = useState(false);
  const [taxOptionDialogOpen, setTaxOptionDialogOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

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
  const [gstInvoiceNoDate, setGstInvoiceNoDate] =
    useState("GST/XXX XX.XX.XXXX");
  const [suppliers, setSuppliers] = useState([
    {
      id: "1",
      name: "ABC",
      gstin: "XXXXXXXXXXXX",
      invoiceNo: "GST/XXX",
      date: "XX.XX.XXXX",
    },
  ]);
  const [declarationText, setDeclarationText] = useState(
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct."
  );

  // Client Info
  const [consignee, setConsignee] = useState("");
  const [notifyParty, setNotifyParty] = useState("");
  const [selectedExporter, setSelectedExporter] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
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
  const [currencyRate, setCurrencyRate] = useState("88.95");

  // Dropdown options
  const [exporters, setExporters] = useState([
    
  ]);
  const [placesOfReceipt, setPlacesOfReceipt] = useState<string[]>([
    "MORBI",
    "THANGADH",
    "RAJKOT",
    "DHORAJI",
    "BHAVNAGAR",
  ]);
  const [portsOfLoading, setPortsOfLoading] = useState<string[]>([
    "Mundra",
    "Kandla",
    "PIPAVAV",
    "Jawaharlal Nehru Port",
    "SINGAPORE",
    "SHANGHAI",
  ]);
  const [portsOfDischarge, setPortsOfDischarge] = useState<string[]>([
    "NEW YORK",
    "NHAVA SHEVA",
    "CHENNAI",
    "KOLKATA",
    "VIZAG",
  ]);
  const [finalDestinations, setFinalDestinations] = useState<string[]>([
    "USA",
    "GERMANY",
    "NETHERLANDS",
    "UAE",
    "SINGAPORE",
    "CHINA",
  ]);
  const [countriesOfFinalDestination, setCountriesOfFinalDestination] =
    useState<string[]>([
      "USA",
      "GERMANY",
      "NETHERLANDS",
      "UAE",
      "SINGAPORE",
      "CHINA",
    ]);
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
  const [sizes, setSizes] = useState<string[]>([
    "600 X 1200",
    "600 X 600",
    "800 X 800",
    "300 X 600",
    "300 X 300",
  ]);
  const [units, setUnits] = useState<string[]>([
    "Box",
    "Pallet",
    "Carton",
    "Piece",
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
    "Digital Floor Tiles": "69072100",
  });
  const [sectionOptions, setSectionOptions] = useState<string[]>([
    "Glazed porcelain Floor Tiles",
    "Polished Vitrified Tiles",
    "Ceramic Wall Tiles",
    "Digital Floor Tiles",
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
    "Mix",
  ]);

  // Product Info
  const [sections, setSections] = useState<ProductSection[]>([
    {
      id: "1",
      title: "Glazed porcelain Floor Tiles",
      items: [],
    },
    {
      id: "2",
      title: "Ceramic Wall Tiles",
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
    "EXPORT UNDER GST CIRCULAR NO. XX/20XX Customs DT.XX/XX/20XX"
  );
  const [lutNo, setLutNo] = useState("ACXXXXXXXXXXXXXXX");
  const [lutDate, setLutDate] = useState("DT /XX/20XX");
  const [integratedTaxOption, setIntegratedTaxOption] = useState<
    "WITH" | "WITHOUT"
  >("WITHOUT");

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
  const [containerType, setContainerType] = useState("FCL");

  // Add these options
  const containerTypes = ["FCL", "LCL"];
  const numberOptions1 = Array.from({ length: 100 }, (_, i) => (i + 1).toString());
  const numberOptions2 = ["20", "40"];

  // Add additional state variables for insurance and freight
  const [insuranceAmount, setInsuranceAmount] = useState<number>(0);
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [showInsuranceFreight, setShowInsuranceFreight] =
    useState<boolean>(false);

  
  useEffect(() => {
    // Show the tax option dialog
    console.log(localStorage.getItem("taxDialogBox"));
    if (localStorage.getItem("taxDialogBox") == "false") {
      setTaxOptionDialogOpen(false);
    } else {
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
            marksAndNos: `${marksAndNosConfig.first}${marksAndNosConfig.second}${marksAndNosConfig.third} ${containerType}`,
          },
        })),
      }))
    );
  }, [marksAndNosConfig, containerType, sections]);

  const addNewRow = (sectionId: string) => {
    // Find the section to get its title
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    // Get the HSN code based on the section title
    const hsnCode = hsnCodes[section.title] || "69072100";

    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product: {
        id: "",
        description: "",
        hsnCode: hsnCode,
        size: defaultSize,
        price: 10,
        sqmPerBox: 1.44,
        marksAndNos: `${marksAndNosConfig.first}${marksAndNosConfig.second}${marksAndNosConfig.third} ${containerType}`,
      },
      quantity: 1000,
      unitType: "Box",
      totalSQM: 1000 * defaultSqmPerBox,
      totalFOB: 10000,
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
            const totalFOB = quantity * product.price;

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
    switch (exporter) {
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
      setCompanyAddress(
        "SECOND FLOOR, OFFICE NO 7,\nISHAN CERAMIC ZONE WING D,\nLALPAR, MORBI,\nGujarat, 363642\nINDIA"
      );
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

    // Save invoice
    const savedInvoice = saveInvoice(invoice);

    toast.success("Invoice saved successfully");
    return savedInvoice;
  };

  

 

  const handleSaveInvoice = () => {};
  

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
        companyAddress,
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

    // Store the data in localStorage or state management
    localStorage.setItem("invoiceFormData", JSON.stringify(formData));

    // Navigate to the packaging list page
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
              SUPPLY MEANT FOR EXPORT UNDER BOND & LUT- LETTER OF UNDERTAKING{" "}
              {integratedTaxOption} PAYMENT OF INTEGRATED TAX
            </p>
          </CardHeader>
        </Card>

       


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
        setEmail={setEmail}
        setTaxid={setTaxid}
        setExporters={setExporters}
        
      />

        

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
        


        <ShippingInformationPage
      preCarriageBy={preCarriageBy}
      setPreCarriageBy={setPreCarriageBy}
      placeOfReceipt={placeOfReceipt}
      setPlaceOfReceipt={setPlaceOfReceipt}
      placesOfReceipt={placesOfReceipt}
      vesselFlightNo={vesselFlightNo}
      setVesselFlightNo={setVesselFlightNo}
      portOfLoading={portOfLoading}
      setPortOfLoading={setPortOfLoading}
      portsOfLoading={portsOfLoading}
      portOfDischarge={portOfDischarge}
      setPortOfDischarge={setPortOfDischarge}
      portsOfDischarge={portsOfDischarge}
      finalDestination={finalDestination}
      setFinalDestination={setFinalDestination}
      finalDestinations={finalDestinations}
      countryOfOrigin={countryOfOrigin}
      setCountryOfOrigin={setCountryOfOrigin}
      originDetails={originDetails}
      setOriginDetails={setOriginDetails}
      countryOfFinalDestination={countryOfFinalDestination}
      setCountryOfFinalDestination={setCountryOfFinalDestination}
      countriesOfFinalDestination={countriesOfFinalDestination}
      termsOfDelivery={termsOfDelivery}
      setTermsOfDelivery={setTermsOfDelivery}
      shippingMethod={shippingMethod}
      setShippingMethod={setShippingMethod}
      shippingMethods={shippingMethods}
      selectedCurrency={selectedCurrency}
      setSelectedCurrency={setSelectedCurrency}
      currencies={currencies}
      currencyRate={currencyRate}
      setCurrencyRate={setCurrencyRate}
      paymentTerms={paymentTerms}
    />
       
        
       
        <ProductInformationCard
              addNewRow={addNewRow}
              addNewSection={addNewSection}
              containerType={containerType}
              containerTypes={containerTypes}
              freightAmount={freightAmount}
              hsnCodes={hsnCodes}
              insuranceAmount={insuranceAmount}
              marksAndNosConfig={marksAndNosConfig}
              numberOptions1={numberOptions1}
              numberOptions2={numberOptions2}
              paymentTerms={paymentTerms}
              removeRow={removeRow}
              sectionOptions={sectionOptions}
              sections={sections}
              setContainerType={setContainerType}
              setFreightAmount={setFreightAmount}
              setInsuranceAmount={setInsuranceAmount}
              setMarksAndNosConfig={setMarksAndNosConfig}
              setSections={setSections}
              showInsuranceFreight={showInsuranceFreight}
              sizes={sizes}
              totalFOBEuro={totalFOBEuro}
              units={units} />
       

        {/* Package Information */}

        <PackageInfoSection
          noOfPackages={noOfPackages}
          grossWeight={grossWeight}
          netWeight={netWeight}
          exportUnderGstCircular={exportUnderGstCircular}
          setExportUnderGstCircular={setExportUnderGstCircular}
          integratedTaxOption={integratedTaxOption}
          lutNo={lutNo}
          setLutNo={setLutNo}
          lutDate={lutDate}
          setLutDate={setLutDate}
          totalFOBEuro={totalFOBEuro}
          amountInWords={amountInWords}
          
        />
        <SupplierDetails
        integratedTaxOption={integratedTaxOption}
        suppliers={suppliers}
        setSuppliers={setSuppliers}
        selectedSupplier={selectedSupplier}
        setSelectedSupplier={setSelectedSupplier}
        setAuthorizedName={setAuthorizedName}
        setAuthorizedGstin={setAuthorizedGstin}
        setGstInvoiceNoDate={setGstInvoiceNoDate}/>

       

        <Card className="mt-24">
          <CardFooter className="flex justify-end gap-4">
            <Button
              onClick={() => {
                setFormSubmitted(true);
                handleSaveInvoice();
                localStorage.setItem("taxDialogBox", "false");
              }}
            >
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
                <Label htmlFor="integratedTaxOption">
                  Integrated Tax Option
                </Label>
                <Select
                  value={integratedTaxOption}
                  onValueChange={(value: "WITH" | "WITHOUT") =>
                    setIntegratedTaxOption(value)
                  }
                >
                  <SelectTrigger>
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
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
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
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => {
                localStorage.setItem("taxDialogBox", "false");
                setTaxOptionDialogOpen(false);
              }}
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceGenerator;

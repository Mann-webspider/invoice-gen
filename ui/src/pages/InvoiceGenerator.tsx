import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Use react-router-dom for navigation

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

import {  ArrowRight } from "lucide-react";

import {
 
  CompanyProfile,
  
  ProductSection,
} from "@/lib/types";

import { toast } from "sonner";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import ExporterInfo from "@/components/forms/ExporterInfo";
import { SupplierDetails } from "@/components/forms/SupplierDetails";
import ShippingInformationPage from "@/components/forms/ShippingInformationPage";
import BuyerInformationCard from "@/components/forms/BuyerInformationCard";
import PackageInfoSection from "@/components/forms/PackageInfoSection";
import ProductInformation from "@/components/forms/ProductInfomation";
import { useForm } from "@/context/FormContext";

import { Controller, useForm as rhf,FormProvider,useFormContext  } from "react-hook-form";
import { useDraftForm } from "@/hooks/useDraftForm";
import { nanoid } from "nanoid"; 
import { ChevronDown, ChevronUp } from 'lucide-react';

// Check if invoice data exists in local storage
const invoiceData = localStorage.getItem("invoiceData");
// check wheter the url is /invoice or /invoice/draft:id
const isDraft = window.location.pathname.includes("/invoice/draft/");

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

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null
  );

  const [taxOptionDialogOpen, setTaxOptionDialogOpen] = useState(false);

  // Add state to force isDirty detection after draft load
  const [forceIsDirty, setForceIsDirty] = useState(false);
  const methods = useFormContext();
  const { methods:draftMethods,hydrated,saveDraft,isDraftMode,draftId} = useDraftForm({
  formType: 'invoice',
  methods,
  isDraftMode: location.pathname.includes("/drafts/"), // Pass the isDraft flag to useDraftForm
});
const form = draftMethods || methods;

const { 
    watch, 
    handleSubmit,
    control, 
    getValues,
    setValue,
    formState: { isDirty } 
  } = form;
// Watch for changes to detect modifications after draft load

 useEffect(() => {
  if (!isDraftMode) {
    methods.reset({}); // Clear the form if not in draft mode
  }
}, [isDraftMode]);

// On mount, check if integrated_tax is present — if so, don’t show the dialog:
const integratedTaxDialog = watch("invoice.integrated_tax");
const paymentTermsDialog = watch("invoice.payment_term");
const productTypeDialog = watch("invoice.product_type");

useEffect(() => {
  if (!hydrated) return;

  const shouldShowTaxDialog = !integratedTaxDialog;
  const shouldShowPaymentTermsDialog = !paymentTermsDialog;
  const shouldShowProductTypeDialog = !productTypeDialog;

  const anyMissing = shouldShowTaxDialog || shouldShowPaymentTermsDialog || shouldShowProductTypeDialog;

  // console.log("Any field missing:", anyMissing);
  if(anyMissing== false) {
    setIntegratedTaxOption(integratedTaxDialog);
    setPaymentTerms(paymentTermsDialog);
    handlePaymentTermsChange(paymentTermsDialog)
    setProductType(productTypeDialog);
  }
  setTaxOptionDialogOpen(anyMissing); // ⬅ open only if something is missing
}, [hydrated, integratedTaxDialog, paymentTermsDialog, productTypeDialog]);


  // Create a reusable CollapsibleSection component
// Create a reusable CollapsibleSection component


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
    "CIF -> FOB",
  ]);

  const [productType, setProductType] = useState<string>("Tiles");

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

  const [exportUnderGstCircular, setExportUnderGstCircular] = useState("");
  const [lutNo, setLutNo] = useState("");
  const [lutDate, setLutDate] = useState<Date>(new Date("2025-07-23"));
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
  
  // Replace the single showSectionOptions state with a map to track each section's dropdown state
  const [openSectionDropdowns, setOpenSectionDropdowns] = useState<{
    [key: string]: boolean;
  }>({});


  // Format date to string
  const formattedLutDate = lutDate ? format(lutDate, "yyyy-MM-dd") : "";


  useEffect(() => {
    // Always show the tax option dialog when component mounts
    // Force it to be open by default
    setTaxOptionDialogOpen(true);

    // Reset localStorage value to ensure dialog shows
    // localStorage.removeItem("taxDialogBox");

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
                sum + parseFloat(row.grossWeight || ""),
              0
            )
            .toFixed(2);

          const totalNetWeight = annexureData.containerRows
            .reduce(
              (sum: number, row: any) => sum + parseFloat(row.netWeight || ""),
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
                sum + parseFloat(container.grossWeight || ""),
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
    }else if (paymentTerms === "CIF -> FOB"){
      finalTotal += insuranceAmount + freightAmount;
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

    const newItem = {
      id: nanoid(),
      product: {
        id: "",
        description: "",
        hsnCode: hsnCode,
        size: defaultSize,
        price: "",
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
      id: nanoid(),
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

 

  

  
  // Update the handleNext function to pass data to PackagingList
  const handleNext = async (data) => {
    // Track if any validation errors occurred
    // console.log("i clieked in handleNext");
    
    // console.log(data);
    localStorage.setItem(`invoiceData2`, JSON.stringify(data));

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
      markNumbeformData2r: markNumber,
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
    // console.log(getValues());
    
    // // Navigate to the packaging list page
    const result = await saveDraft({ last_page: 'packaging-list' }); // Update to next page
    
      navigate(`/packaging-list/drafts/${result.id}`);
  };

  // Update the paymentTerms handler to show/hide insurance and freight fields
  const handlePaymentTermsChange = (value: string) => {
    setPaymentTerms(value);

   
    
    if (value === "CIF" || value === "CNF" || value === "CIF -> FOB") {
      setShowInsuranceFreight(true);

      // Update Terms of Delivery based on payment terms
      if (value === "CIF") {
        setTermsOfDelivery(`CIF AT ${portOfDischarge}`);
      } 
      if (value === "CIF -> FOB"){
        setTermsOfDelivery(`CIF -> FOB AT ${portOfDischarge}`);
      }else {
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
          <FormProvider {...form}>

          
          {/* Exporter Information */}
         <Accordion
  type="multiple" // Allows multiple to be open at once
  defaultValue={[
    "exporter",
    "buyer",
    "shipping",
    "product",
    "package",
    "supplier",
  ]}
  className="w-full space-y-2"
>
  <AccordionItem value="exporter">
    <AccordionTrigger>Exporter Information</AccordionTrigger>
    <AccordionContent>
      <ExporterInfo
        exporters={exporters}
        invoiceNo={invoiceNo}
        setExporters={setExporters}
        form={form}
      />
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="buyer">
    <AccordionTrigger>Buyer Information</AccordionTrigger>
    <AccordionContent>
      <BuyerInformationCard form={form} />
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="shipping">
    <AccordionTrigger>Shipping Information</AccordionTrigger>
    <AccordionContent>
      <ShippingInformationPage
        preCarriageBy={preCarriageBy}
        setPreCarriageBy={setPreCarriageBy}
        placesOfReceipt={placesOfReceipt}
        setPlacesOfReceipt={setPlacesOfReceipt}
        vesselFlightNo={vesselFlightNo}
        setVesselFlightNo={setVesselFlightNo}
        setPortOfLoading={setPortOfLoading}
        portsOfLoading={portsOfLoading}
        setPortsOfLoading={setPortsOfLoading}
        setPortOfDischarge={setPortOfDischarge}
        setPortsOfDischarge={setPortsOfDischarge}
        portsOfDischarge={portsOfDischarge}
        setFinalDestinations={setFinalDestinations}
        finalDestinations={finalDestinations}
        countryOfOrigin={countryOfOrigin}
        setCountryOfOrigin={setCountryOfOrigin}
        originDetails={originDetails}
        setOriginDetails={setOriginDetails}
        countriesOfFinalDestination={countriesOfFinalDestination}
        setCountriesOfFinalDestination={setCountriesOfFinalDestination}
        paymentTerms={paymentTerms}
        shippingMethods={shippingMethods}
        currencies={currencies}
        form={form}
      />
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="product">
    <AccordionTrigger>Product Information</AccordionTrigger>
    <AccordionContent>
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
        setTotalFOBEuro={setTotalFOBEuro}
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
        hydrated={hydrated}
      />
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="package">
    <AccordionTrigger>Package Information</AccordionTrigger>
    <AccordionContent>
      <PackageInfoSection
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
        totalFOBEuro={totalFOBEuro}
        amountInWords={amountInWords}
        currencyRate={currencyRate}
        form={form}
      />
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="supplier">
    <AccordionTrigger>Supplier Details</AccordionTrigger>
    <AccordionContent>
      <SupplierDetails
        suppliers={suppliers}
        setSuppliers={setSuppliers}
        integratedTaxOption={integratedTaxOption}
        form={form}
      />
    </AccordionContent>
  </AccordionItem>
</Accordion>

          {/* Footer Buttons */}
          <Card className="mt-6">
            <CardFooter className="flex justify-end gap-4">
              {/* debug  */}
              <Button onClick={() => console.log(getValues())}>
                Debug Form
              </Button>
              <Button onClick={saveDraft}>
                <ArrowRight className="mr-2 h-4 w-4" />
                save
              </Button>
              <Button onClick={handleSubmit(handleNext)}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Next
              </Button>
            </CardFooter>
          </Card>
          </FormProvider>
          {/* <FormExitPrompt
        show={showPrompt}
        isProcessing={isProcessing}
        onSaveDraft={handleSaveAndContinue}
        onContinue={handleContinueWithoutSaving}
        onDiscard={handleDiscard}
        onCancel={handleCancel}
      /> */}
        </div>

        {/* Dialogs */}
        {/* PDF Preview Dialog */}

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
                        control={control}
                        name="invoice.integrated_tax" // change this path based on your form structure
                        
                        defaultValue={integratedTaxOption}
                        render={({ field }) => (
                          <Select
                            value={field.value || "WITHOUT"}
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
                        control={control}
                        name="invoice.payment_term" // Update the name based on your form structure
                        
                        defaultValue={paymentTerms}
                        render={({ field }) => (
                          <Select
                            value={field.value || "FOB"}
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
                        control={control}
                        name="invoice.product_type" // Change to match your schema
                       
                        defaultValue={productType}
                        render={({ field }) => (
                          <Select
                            value={field.value || "Tiles"}
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
                              {/* <SelectItem value="Faucets">Faucets</SelectItem> */}
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

                  // localStorage.setItem("taxDialogBox", "false");
                  setTaxOptionDialogOpen(false);
                  setValue("invoice.integrated_tax", integratedTaxOption);
                  setValue("invoice.payment_term", paymentTerms);
                  setValue("invoice.product_type", productType);
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

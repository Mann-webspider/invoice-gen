import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import MarksAndNumbers from "../MarksAndNumbers";
import { useForm } from "@/context/FormContext";
import { useEffect } from "react";
import api from "@/lib/axios";

import { Controller, useForm as rhf, UseFormReturn,useFormContext } from "react-hook-form";
import { useRef } from "react";
import { nanoid } from "nanoid"; 
import { useLayoutEffect } from "react";
import { useState } from "react";
import { useCallback } from "react";
const ProductInformation = ({
  addNewSection,

  sections,
  setSections,
  hsnCodes,
  sectionOptions,
  setSectionOptions,
  setHsnCodes,
  sizes,
  setSizes,
  setSizeToSqmMap,
  units,
  setUnits,
  removeRow,
  addNewRow,
  showInsuranceFreight,
  insuranceAmount,
  setInsuranceAmount,
  freightAmount,
  setFreightAmount,
  totalFOBEuro,
  setTotalFOBEuro,
  paymentTerms,
  marksAndNumbersValues,
  setMarksAndNumbersValues,
  customSectionHsnCodes,
  setCustomSectionHsnCodes,
  openSectionDropdowns,
  setOpenSectionDropdowns,
  productType,
  sizeToSqmMap,
  form,
  hydrated, // Default to true for hydration
}) => {
 
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useFormContext();
  const [overallPrice,setOverallPrice] = useState("");
  function getLastWordsCommaString(sections: Section[]): string {
    const lastWords = sections.map((section) => {
      const parts = section.title.trim().split(" ");
      return parts[parts.length - 1];
    });

    const uniqueWords = Array.from(new Set(lastWords));

    return uniqueWords.join(", ");
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
        netWeight: item.net_weight,
        grossWeight: item.gross_weight,
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


  const lastProductListRef = useRef([]);
const currencyRate = watch("invoice.currency_rate");
const calculateFreightInsurance = useCallback((totalFobFreight, exchangeRate) => {
  // Input validation
  if (!totalFobFreight || !exchangeRate || exchangeRate <= 0) {
    return 0;
  }

  try {
    const fob = parseFloat(totalFobFreight) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    
    // Convert to INR
    const inrConvert = fob * rate;
    
    // Add 10% to total FOB in INR (for CIF calculation)
    const cifAddition = inrConvert * 0.1; // 10% of total FOB in INR
    const totalInr = inrConvert + cifAddition; // Total with 10% added
    
    // Calculate premium (0.04% of total in INR)
    const premium = totalInr * 0.0004; // 0.04% premium rate
    
    // Convert back to original currency
    const premiumInExchangeCurrency = premium / rate;
    
    return parseFloat(premiumInExchangeCurrency.toFixed(2));
  } catch (error) {
    console.error('Error calculating insurance:', error);
    return 0;
  }
}, []); // No dependencies to avoid recreation
useEffect(() => {
 
  // ✅ Ensure all values are converted to numbers BEFORE calculation
  const calculatedTotal = sections.reduce((sectionTotal, section) => {
    return sectionTotal + section.items.reduce((itemTotal, item) => {
      return itemTotal + (parseFloat(item.totalFOB) || 0);
    }, 0);
  }, 0);

  // ✅ Convert to numbers explicitly
  // let insurance = parseFloat(insuranceAmount) || 0;
  const freight = parseFloat(freightAmount) || 0;
  // console.log("Freight Amount:", freight);
  
  
  let totalFobWithFreight = calculatedTotal + freight;
  
  // ✅ This will now be proper addition, not concatenation
  let insurance = calculateFreightInsurance(totalFobWithFreight, currencyRate);
  const calculatedTotalWithExtras = calculatedTotal + insurance + freight;
  
  // console.log(insurance);
  
  // console.log("Insurance Amount:", insurance);
  // ✅ Ensure we set a number, not a string
  setInsuranceAmount(()=>insurance);
  setValue("invoice.products.insurance", insurance);
  setValue("invoice.products.freight", freight);
  setValue("invoice.products.total_price", calculatedTotalWithExtras);
  setTotalFOBEuro(()=>Number(calculatedTotalWithExtras));
  



  const newProductList = sections.flatMap((section) =>
    section.items.map((item) => ({
      category_id: section.id || "",
      category_name: section.title || "",
      hsn_code: item.product.hsnCode,
      product_name: item.product.description || "",
      size: item.product.size || "",
      quantity: item.quantity || 0,
      sqm: item.product.sqmPerBox || 0,
      total_sqm: item.totalSQM || 0,
      price: item.product.price || "",
      unit: item.unitType,
      total: item.totalFOB,
      net_weight: item.product.netWeight || 0,
      gross_weight: item.product.grossWeight || 0,
    }))
  );

  const prev = lastProductListRef.current;
  const isSame = JSON.stringify(prev) === JSON.stringify(newProductList);

  if (!isSame) {
    lastProductListRef.current = newProductList;
    
    // ✅ Use calculated value instead of state
    setValue("invoice.products.product_list", newProductList);
    // setValue("invoice.products.total_price", calculatedTotalWithExtras);
    // setValue("invoice.products.insurance", insurance);
    // setValue("invoice.products.freight", freight);
    setValue("invoice.products.goods", getLastWordsCommaString(sections));
  }
}, [sections, insuranceAmount, freightAmount, setValue]);

useEffect(() => {
  register("invoice.products.product_list");
  register("invoice.products.total_price");
  register("invoice.products.insurance");
  register("invoice.products.freight");
  register("invoice.products.goods");
}, []);





const prevList = useRef<string | null>(null);
const hasRunOnce = useRef(false);

useLayoutEffect(() => {
  const list = watch("invoice.products.product_list");
  if (hydrated && Array.isArray(list) && list.length > 0) {
    setSections(convertToSection(list));
  }
}, [hydrated]);




  useEffect(() => {
    async function fetchCategory() {
      try {
        const response = await api.get("/product-category");

        return response.data.data;
      } catch (error) {
        // Error fetching data - handled silently
        return [];
      }
    }
    async function fetchSize() {
      try {
        const response = await api.get("/product-size");

        return response.data;
      } catch (error) {
        // Error fetching data - handled silently
        return [];
      }
    }
    async function fetchUnit() {
      try {
        const response = await api.get("/dropdown-options/unit_type");
        // console.log("Unit options fetched:", response.data.data);

        return response.data.data;
      } catch (error) {
        // Error fetching data - handled silently
        return [];
      }
    }
    const fetchData = async () => {
      const category = await fetchCategory();
      const size = await fetchSize();
      const unit = await fetchUnit();

      // Fetched data

      // category
      setSectionOptions(category.map((item) => item.description));
      setHsnCodes(
        category.reduce((acc, item) => {
          acc[item.description] = item.hsn_code;
          return acc;
        }, {})
      );

      // size
      // Fetched size
      setSizeToSqmMap(
        size.reduce((acc, item) => {
          acc[item.size] = item.sqm;
          return acc;
        }, {})
      );
      setSizes(size.map((item) => item.size));
      setUnits(unit.unit_type.map((item) => item.value));
    };
    fetchData();
    
  }, []);


 

  return (
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
            <MarksAndNumbers
              initialContainerType={marksAndNumbersValues.containerType}
              initialLeftValue={marksAndNumbersValues.leftValue}
              initialRightValue={marksAndNumbersValues.rightValue}
              form={form}
              onChange={(value: string | any) => {
                // Handle both string and object formats
                if (typeof value === "string") {
                  if (value === "LCL") {
                    setMarksAndNumbersValues({
                      containerType: "LCL",
                      leftValue: "",
                      rightValue: "",
                    });
                  } else {
                    // Parse the value in the format "10X20 ft FCL"
                    const parts = value.match(/^(\d+)X([\d\s\w]+)\s+(\w+)$/);
                    if (parts) {
                      setMarksAndNumbersValues({
                        containerType: parts[3],
                        leftValue: parts[1],
                        rightValue: parts[2],
                      });
                    }
                  }
                } else if (typeof value === "object" && value !== null) {
                  // Handle object format directly
                  setMarksAndNumbersValues({
                    containerType: value.containerType || "FCL",
                    leftValue: value.leftValue || "",
                    rightValue: value.rightValue || "",
                  });
                }

                // MarksAndNumbers updated:
                //   typeof value === 'string' ? value : JSON.stringify(value));
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* {JSON.stringify(sections)} */}
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="relative w-96">
                  <Input
                    type="text"
                    value={section.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;

                      const mappedHsnCode =
                        hsnCodes[newTitle] || customSectionHsnCodes[newTitle];

                      const newSections = [...sections];
                      const sectionIndex = newSections.findIndex(
                        (s) => s.id === section.id
                      );

                      if (sectionIndex !== -1) {
                        const currentSection = newSections[sectionIndex];
                        const firstItemHsnCode =
                          currentSection.items[0]?.product?.hsnCode || "";

                        const effectiveHsnCode =
                          mappedHsnCode || firstItemHsnCode;

                        // Store custom mapping
                        if (!hsnCodes[newTitle] && effectiveHsnCode) {
                          setCustomSectionHsnCodes((prev) => ({
                            ...prev,
                            [newTitle]: effectiveHsnCode,
                          }));
                        }

                        // ✅ Preserve all fields — including description and size
                        newSections[sectionIndex] = {
                          ...currentSection,
                          title: newTitle,
                          items: currentSection.items.map((item) => ({
                            ...item,
                            product: {
                              ...item.product,
                              hsnCode:
                                effectiveHsnCode !== item.product.hsnCode
                                  ? effectiveHsnCode
                                  : item.product.hsnCode,
                            },
                          })),
                        };

                        setSections(newSections);
                      }
                    }}
                    onFocus={() => {
                      const updatedDropdowns = {};
                      Object.keys(openSectionDropdowns).forEach((key) => {
                        updatedDropdowns[key] = false;
                      });
                      updatedDropdowns[section.id] = true;
                      setOpenSectionDropdowns(updatedDropdowns);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setOpenSectionDropdowns((prev) => ({
                          ...prev,
                          [section.id]: false,
                        }));
                      }, 200);
                    }}
                    placeholder="Enter section title or select from options"
                    className={`w-full font-medium border rounded px-2 py-2 ${
                      productType === "Sanitary" ? "bg-gray-50" : ""
                    }`}
                  />

                  {openSectionDropdowns[section.id] && (
                    <div className="absolute top-full left-0 w-full bg-white border rounded-md shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
                      {sectionOptions.map((option, index) => (
                        <div
                          key={option}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => {
                            // Create a new copy of the sections array
                            const newSections = [...sections];

                            // Find the specific section to update by ID
                            const sectionIndex = newSections.findIndex(
                              (s) => s.id === section.id
                            );

                            if (sectionIndex !== -1) {
                              // Get the current section
                              const currentSection = newSections[sectionIndex];

                              // Get the HSN code for the selected option
                              const hsnCode = hsnCodes[option];

                              // Update only this specific section
                              newSections[sectionIndex] = {
                                ...currentSection,
                                title: option,
                                items: currentSection.items.map((item) => ({
                                  ...item,
                                  product: {
                                    ...item.product,
                                    hsnCode: hsnCode,
                                  },
                                })),
                              };

                              // Update the state with the new sections array
                              setSections(newSections);
                            }
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {sections.length > 1 && section.items.length === 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSections((currentSections) =>
                        currentSections.filter((s) => s.id !== section.id)
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
                    <TableHead className="w-[50px] border font-bold">
                      SR NO
                    </TableHead>
                    <TableHead className="border font-bold">
                      Description
                    </TableHead>
                    <TableHead className="border font-bold">HSN Code</TableHead>
                    {productType==="Sanitary"?<></>:<><TableHead className="border font-bold">Size</TableHead></>}
                    
                    <TableHead className="w-[100px] border font-bold">
                      Quantity
                    </TableHead>
                    <TableHead className="border font-bold">
                      Unit Type
                    </TableHead>
                    {productType==="Sanitary"?<></>:<><TableHead className="border font-bold">
                      SQM/
                      {(() => {
                        // Find first item with unit type or use BOX as default
                        const firstItem = section.items.find((i) => i.unitType);
                        return firstItem ? firstItem.unitType : "BOX";
                      })()}
                    </TableHead>
                    <TableHead className="border font-bold">
                      Total SQM
                    </TableHead></>}
                    
                    <TableHead className="border font-bold">Price</TableHead>
                    <TableHead className="border font-bold">
                      Total {paymentTerms}
                    </TableHead>
                    <TableHead className="w-[70px] border font-bold">
                      Actions
                    </TableHead>
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
                              const newDescription = e.target.value;
                              const foundHsnCode = hsnCodes[newDescription];

                              setSections((currentSections) =>
                                currentSections.map((s) =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        items: s.items.map((i) =>
                                          i.id === item.id
                                            ? {
                                                ...i,
                                                product: {
                                                  ...i.product,
                                                  description: newDescription,
                                                  ...(foundHsnCode !==
                                                    undefined && {
                                                    hsnCode: foundHsnCode,
                                                  }),
                                                },
                                              }
                                            : i
                                        ),
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
                            value={item.product.hsnCode || ""}
                            onChange={(e) => {
                              const newHsnCode = e.target.value;

                              setSections((currentSections) =>
                                currentSections.map((s) =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        items: s.items.map((i) =>
                                          i.id === item.id
                                            ? {
                                                ...i,
                                                product: {
                                                  ...i.product,
                                                  hsnCode: newHsnCode,
                                                },
                                              }
                                            : i
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="h-8 w-24"
                          />
                        </TableCell>
                        {productType==="Sanitary"?<></>:<><TableCell>
                          <Select
                            value={item.product.size?? ""}
                            onValueChange={(value) => {
                              const newSqmPerBox = sizeToSqmMap[value] || 0;
                              const isMixAndDash = productType === "Mix" && value === "-";

                              const updatedSections = sections.map((s) =>
                                s.id === section.id
                                  ? {
                                      ...s,
                                      items: s.items.map((i) =>
                                        i.id === item.id
                                          ? {
                                              ...i,
                                              product: {
                                                ...i.product,
                                                size: value,
                                                sqmPerBox: isMixAndDash ? "-" : newSqmPerBox,
                                              },
                                              totalSQM: isMixAndDash ? "-" : i.quantity * newSqmPerBox,
                                              totalFOB: isMixAndDash ? i.quantity * i.product.price : i.quantity * i.product.price * (newSqmPerBox || 1),

                                            }
                                          : i
                                      ),
                                    }
                                  : s
                              );
                              setSections(updatedSections);
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
                        </TableCell></>}
                        
                        <TableCell>
                          <Input
                            type="text"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => {
                              const quantity = parseInt(e.target.value) || 0;
                              setSections((currentSections) =>
                                currentSections.map((s) =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        items: s.items.map((i) =>
                                          i.id === item.id
                                            ? {
                                                ...i,
                                                quantity,
                                                totalSQM:
                                                  i.product.size === "-"
                                                    ? "-"
                                                    : quantity * i.product.sqmPerBox,
                                                totalFOB:
                                                  i.product.size === "-"
                                                    ? quantity * i.product.price
                                                    : quantity * i.product.price * (i.product.sqmPerBox || 1),
                                              }
                                            : i
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="border">
                          <Select
                            value={item.unitType || "BOX"}
                            onValueChange={(value) => {
                              // Update the sections state with the new unit type
                              // Create a new copy of the sections array to avoid reference issues
                              const newSections = [...sections];

                              // Find the specific section and item to update
                              const sectionIndex = newSections.findIndex(
                                (s) => s.id === section.id
                              );
                              if (sectionIndex !== -1) {
                                const itemIndex = newSections[
                                  sectionIndex
                                ].items.findIndex((i) => i.id === item.id);
                                if (itemIndex !== -1) {
                                  // Only update this specific item's unitType
                                  newSections[sectionIndex].items[itemIndex] = {
                                    ...newSections[sectionIndex].items[
                                      itemIndex
                                    ],
                                    unitType: value,
                                  };
                                  // Set the updated sections array
                                  setSections(newSections);
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select" />
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
                       {productType==="Sanitary"?<></>:<><TableCell>
                          <Input
                            type="text"
                            value={item.product.sqmPerBox || ""}
                            onChange={(e) => {
                              const sqmPerBox = e.target.value;
                               if (!/^-?\d+(\.\d+)?$|^-?\.\d+$/.test(sqmPerBox)) return;
                              if(sqmPerBox == "-"){
                                return;
                              }
                              setSections(
                                sections.map((s) =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        items: s.items.map((i) =>
                                          i.id === item.id
                                            ? {
                                                ...i,
                                                product: {
                                                  ...i.product,
                                                  sqmPerBox,
                                                },
                                                totalSQM:
                                                  i.quantity *
                                                  (parseFloat(
                                                    sqmPerBox || "0"
                                                  ) || 0)
                                                
                                              }
                                            : i
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className={`h-8 w-14  m-0 no-spinner appearance-none p-2  text-right ${
                              productType === "Sanitary" ? "bg-gray-100" : ""
                            }`}
                            readOnly={productType === "Sanitary"}
                            disabled={productType === "Sanitary"}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={typeof item.totalSQM === 'number' ? item.totalSQM.toFixed(2) : item.totalSQM || ""}
                            readOnly
                            className="h-8 text-right w-24 bg-gray-50"
                          />
                        </TableCell></>}
                        
                        <TableCell>
                          <Input
                            type="text"
                            value={item.product.price ?? ""}
                            onChange={(e) => {
                              const priceInput = e.target.value;

                              // Allow only valid decimal numbers or empty input
                              if (!/^\d*\.?\d*$/.test(priceInput)) return;

                              setSections(
                                sections.map((s) =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        items: s.items.map((i) => {
                                          if (i.id !== item.id) return i;

                                          const quantity = i.quantity || 0;
                                          const price = parseFloat(priceInput || "0");

                                          if (i.product.size === "-") {
                                            return {
                                              ...i,
                                              product: {
                                                ...i.product,
                                                price: priceInput,
                                              },
                                              totalSQM: "-",
                                              totalFOB: quantity * price,
                                            };
                                          }

                                          const sqmPerBox = parseFloat(i?.product?.sqmPerBox || "1");
                                          const totalSQM = quantity * sqmPerBox;

                                          return {
                                            ...i,
                                            product: {
                                              ...i.product,
                                              price: priceInput, // store raw string in state
                                            },
                                            totalSQM,
                                            totalFOB: productType === "Sanitary" ? quantity * price : totalSQM * price,
                                          };
                                        }),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="h-8 w-24 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={typeof item.totalFOB === 'number' ? item.totalFOB.toFixed(2) : item.totalFOB || ""}
                            readOnly
                            onChange={(e) => {
                              const totalFOB = parseFloat(e.target.value) || 0;
                              setSections(
                                sections.map((s) =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        items: s.items.map((i) =>
                                          i.id === item.id
                                            ? {
                                                ...i,
                                                totalFOB: totalFOB,
                                              }
                                            : i
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="h-8 w-32 text-right"
                          />
                        </TableCell>
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
                    {["CIF", "CIF -> FOB"].includes(paymentTerms)  && "Insurance"}
                  </div>
                  <div className="w-1/6 text-right p-3 font-medium border-l border-gray-200">
                  
                   {["CIF", "CIF -> FOB"].includes(paymentTerms) && (
  <Input
    type="text"
    value={insuranceAmount}
    {...register("invoice.products.insurance", { required: true })}
    placeholder="Enter insurance amount"
    onChange={(e) =>
      setInsuranceAmount(parseInt(e.target.value))
    }
    className="text-right border-0 p-0 h-6"
  />
)}

                  </div>
                </div>
                <div className="flex justify-end border-b border-gray-200">
                  <div className="w-1/3 text-right p-3 font-medium">
                    Freight
                  </div>
                  <div className="w-1/6 text-right p-3 font-medium border-l border-gray-200">
                    <Input
                      type="text"
                      value={freightAmount}
                      {...register("invoice.products.freight", { required: true })}
                      placeholder="Enter freight amount"
                      onChange={(e) =>{

                        setFreightAmount(parseInt(e.target.value));
                      
                      }
                      }
                      className="text-right border-0 p-0 h-6"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-end">
              <div className="w-1/3 text-right p-4 font-medium">
                <div className="text-sm font-medium text-gray-500">
                  Total {paymentTerms === "FOB" ? "FOB" : paymentTerms}
                </div>
              </div>
              <div className="w-1/6 text-right p-4 font-semibold text-lg border-l border-red-800">
              

                {totalFOBEuro.toFixed(2) }
  
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductInformation;

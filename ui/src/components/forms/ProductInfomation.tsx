import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {ContainerDetails} from "@/components/forms/ContainerDetails";
import {InsuranceFreightSection} from "@/components/forms/InsuranceFreightSection";
import ProductInformationCard from "./ProductInformationCard";
import MarksAndNumbers from "../MarksAndNumbers";
import { useForm } from "@/context/FormContext";
import { useEffect } from "react";
import api from "@/lib/axios";
import { set } from "date-fns";
import { Controller, useForm as rhf, UseFormReturn } from "react-hook-form";
const ProductInformation = ({
  addNewSection,
  
  sections ,
  setSections,
  hsnCodes,
  sectionOptions,
  setSectionOptions,
  setHsnCodes,
  sizes,
  setSizes,
  setSizeToSqmMap,
  units,
  removeRow,
  addNewRow,
  showInsuranceFreight,
  insuranceAmount,
  setInsuranceAmount,
  freightAmount,
  setFreightAmount,
  totalFOBEuro,
  paymentTerms,
  marksAndNumbersValues,
  setMarksAndNumbersValues,
  customSectionHsnCodes,
  setCustomSectionHsnCodes,
  openSectionDropdowns,
  setOpenSectionDropdowns,
  productType,
  sizeToSqmMap,
  form
}) => {
 const { formData, setInvoiceData } = useForm();
const {
  register,
  handleSubmit,
  control,
  setValue,
  watch,
  formState: { errors },
} = form;

useEffect(() => {
  const subscription = watch((allValues) => {
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
        price: item.product.price || 0,
        unit: item.unitType,
        total: item.totalFOB,
        net_weight: item.product.netWeight || 0,
        gross_weight: item.product.grossWeight || 0,
      }))
    );
    
    

    // Only update if the product list has changed
    const current = allValues?.products?.product_list || [];
    const isSame = JSON.stringify(current) === JSON.stringify(newProductList);
    if (!isSame) {
      setValue("products.product_list", newProductList);
      setValue("products.total_price",totalFOBEuro);
      setValue("products.insurance", insuranceAmount);
      setValue("products.frieght", freightAmount);
    }
  });

  return () => subscription.unsubscribe();
}, [sections,  setValue]);



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
        const response = await api.get("/dropdown-options/unit");
        return response.data.data;
      } catch (error) {
        // Error fetching data - handled silently
        return [];
      }
    }
    const fetchData = async () => {
      const category = await fetchCategory();
      const size = await fetchSize();
      // Fetched data
      
      // category
      setSectionOptions(category.map(item => item.description));
      setHsnCodes(category.reduce((acc, item) => {
        acc[item.description] = item.hsnCode;
        return acc;
      }, {}));

      // size
      // Fetched size
      setSizeToSqmMap(size.reduce((acc, item) => {
        acc[item.size] = item.sqm;
        return acc;
      }, {}));
      setSizes(size.map(item => item.size));
      
    };
    fetchData();
  }, []);
    
  // useEffect(() => {
  //   const formattedProducts = sections.map(section => (
  //     section.items.map(item => ({
  //       category_id: section.id || "",
  //       category_name: section.title || "",
  //       hsnCode: item.product.hsnCode ,
  //       product_name: item.product.description || "",
  //       size: item.product.size || "",
  //       quantity: item.quantity || 0,
  //       sqm: item.product.sqmPerBox || 0,
  //       total_sqm: item.totalSQM || 0,
  //       price: item.product.price || 0,
  //       unit: item.unitType,
  //       total: item.totalFOB ,
  //       net_weight: item.product.netWeight || 0,
  //       gross_weight: item.product.grossWeight || 0
  //     }))
  //   )).flat();
    
    
      
      

  //   setInvoiceData({
  //     ...formData.invoice,
  //     products: {
  //       marks: marksAndNumbersValues.leftValue +" X "+ marksAndNumbersValues.rightValue,
  //       nos: marksAndNumbersValues.containerType,
  //       frieght: freightAmount,
  //       insurance: insuranceAmount,
  //       total_price: totalFOBEuro,
  //       product_list: formattedProducts,
  //       containers: []
  //     }
  //   });
  // }, [formData, sections, marksAndNumbersValues, freightAmount, insuranceAmount, totalFOBEuro]);
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
                    if (typeof value === 'string') {
                      if (value === 'LCL') {
                        setMarksAndNumbersValues({
                          containerType: 'LCL',
                          leftValue: '',
                          rightValue: ''
                        });
                      } else {
                        // Parse the value in the format "10X20 ft FCL"
                        const parts = value.match(/^(\d+)X([\d\s\w]+)\s+(\w+)$/);
                        if (parts) {
                          setMarksAndNumbersValues({
                            containerType: parts[3],
                            leftValue: parts[1],
                            rightValue: parts[2]
                          });
                        }
                      }
                    } else if (typeof value === 'object' && value !== null) {
                      // Handle object format directly
                      setMarksAndNumbersValues({
                        containerType: value.containerType || 'FCL',
                        leftValue: value.leftValue || '',
                        rightValue: value.rightValue || ''
                      });
                    }
                    
                    // MarksAndNumbers updated: 
                    //   typeof value === 'string' ? value : JSON.stringify(value));
                  }}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {sections.map((section, sectionIndex) => (
                <div key={section.id} className="mb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="relative w-96">
                      <Input
                        type="text"
                        value={section.title}
                        
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          // Check if the title exists in predefined options or in custom mappings
                          const hsnCode = hsnCodes[newTitle] || customSectionHsnCodes[newTitle] || "";
                          
                          // Create a new copy of the sections array
                          const newSections = [...sections];
                          
                          // Find the specific section to update by ID (not by title)
                          const sectionIndex = newSections.findIndex(s => s.id === section.id);
                          
                          if (sectionIndex !== -1) {
                            // Get the current section
                            const currentSection = newSections[sectionIndex];
                            
                            // If HSN code is empty and there are items, use the first item's HSN code
                            const firstItemHsnCode = currentSection.items[0]?.product.hsnCode;
                            const effectiveHsnCode = hsnCode || firstItemHsnCode || "";
                            
                            // If using a custom title not in our predefined map, store its HSN code
                            if (!hsnCodes[newTitle] && effectiveHsnCode) {
                              setCustomSectionHsnCodes(prev => ({
                                ...prev,
                                [newTitle]: effectiveHsnCode
                              }));
                            }
                            
                            // Update only this specific section
                            newSections[sectionIndex] = {
                              ...currentSection,
                              title: newTitle,
                              items: currentSection.items.map(item => ({
                                ...item,
                                product: {
                                  ...item.product,
                                  hsnCode: effectiveHsnCode || item.product.hsnCode
                                }
                              }))
                            };
                            
                            // Update the state with the new sections array
                            setSections(newSections);
                          }
                        }}
                        onFocus={() => {
                          // Close all other dropdowns first
                          const updatedDropdowns = {};
                          Object.keys(openSectionDropdowns).forEach(key => {
                            updatedDropdowns[key] = false;
                          });
                          // Open only this dropdown
                          updatedDropdowns[section.id] = true;
                          setOpenSectionDropdowns(updatedDropdowns);
                        }}
                        onBlur={() => {
                          // Close this dropdown after a small delay to allow click on options
                          setTimeout(() => {
                            setOpenSectionDropdowns(prev => ({
                              ...prev,
                              [section.id]: false
                            }));
                          }, 200);
                        }}
                        placeholder="Enter section title or select from options"
                        className={`w-full font-medium border rounded px-2 py-2 ${productType === "Sanitary" ? "bg-gray-50" : ""}`}
                      />
                      {openSectionDropdowns[section.id] && (
                        <div className="absolute top-full left-0 w-full bg-white border rounded-md shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
                          {sectionOptions.map((option, index) => (
                            <div 
                              key={index} 
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                              onMouseDown={() => {
                                // Create a new copy of the sections array
                                const newSections = [...sections];
                                
                                // Find the specific section to update by ID
                                const sectionIndex = newSections.findIndex(s => s.id === section.id);
                                
                                if (sectionIndex !== -1) {
                                  // Get the current section
                                  const currentSection = newSections[sectionIndex];
                                  
                                  // Get the HSN code for the selected option
                                  const hsnCode = hsnCodes[option];
                                  
                                  // Update only this specific section
                                  newSections[sectionIndex] = {
                                    ...currentSection,
                                    title: option,
                                    items: currentSection.items.map(item => ({
                                      ...item,
                                      product: {
                                        ...item.product,
                                        hsnCode: hsnCode
                                      }
                                    }))
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
                        <TableHead className="w-[50px] border font-bold">SR NO</TableHead>
                        <TableHead className="border font-bold">Description</TableHead>
                        <TableHead className="border font-bold">HSN Code</TableHead>
                        <TableHead className="border font-bold">Size</TableHead>
                        <TableHead className="w-[100px] border font-bold">Quantity</TableHead>
                        <TableHead className="border font-bold">Unit Type</TableHead>
                        <TableHead className="border font-bold">
                          SQM/{(() => {
                            // Find first item with unit type or use BOX as default
                            const firstItem = section.items.find(i => i.unitType);
                            return firstItem ? firstItem.unitType : "BOX";
                          })()}
                        </TableHead>
                        <TableHead className="border font-bold">Total SQM</TableHead>
                        <TableHead className="border font-bold">Price</TableHead>
                        <TableHead className="border font-bold">Total {paymentTerms}</TableHead>
                        <TableHead className="w-[70px] border font-bold">Actions</TableHead>
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
                                                  hsnCode: e.target.value
                                                }
                                              }
                                              : i
                                          )
                                        }
                                        : s
                                    )
                                  );
                                }}
                                className="h-8 w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.product.size}
                                onValueChange={(value) => {
                                  // Get the corresponding SQM/BOX value for this size
                                  const sqmPerBox = sizeToSqmMap[value] || item.product.sqmPerBox;
                                  
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
                                                  size: value,
                                                  sqmPerBox: sqmPerBox
                                                },
                                                totalSQM: i.quantity * sqmPerBox,
                                                totalFOB: i.quantity * i.product.price
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
                            <TableCell className="border">
                              <Select
                                value={item.unitType || "BOX"}
                                onValueChange={(value) => {
                                  // Update the sections state with the new unit type
                                  // Create a new copy of the sections array to avoid reference issues
                                  const newSections = [...sections];
                                  
                                  // Find the specific section and item to update
                                  const sectionIndex = newSections.findIndex(s => s.id === section.id);
                                  if (sectionIndex !== -1) {
                                    const itemIndex = newSections[sectionIndex].items.findIndex(i => i.id === item.id);
                                    if (itemIndex !== -1) {
                                      // Only update this specific item's unitType
                                      newSections[sectionIndex].items[itemIndex] = {
                                        ...newSections[sectionIndex].items[itemIndex],
                                        unitType: value
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
                                  <SelectItem value="Box">Box</SelectItem>
                                  <SelectItem value="Pallet">Pallet</SelectItem>
                                  <SelectItem value="Carton">Carton</SelectItem>
                                  <SelectItem value="Piece">Piece</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.product.sqmPerBox || ""}
                                onChange={(e) => {
                                  const sqmPerBox = parseFloat(e.target.value) || 0;
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
                                                      sqmPerBox
                                                    },
                                                    totalSQM: i.quantity * sqmPerBox,
                                                    totalFOB: i.quantity * i.product.price
                                                  }
                                                : i
                                            )
                                          }
                                        : s
                                    )
                                  );
                                }}
                                className={`h-8 text-right ${productType === "Sanitary" ? "bg-gray-100" : ""}`}
                                readOnly={productType === "Sanitary"}
                                disabled={productType === "Sanitary"}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                
                                value={item.totalSQM?.toFixed(2) || ""}
                                readOnly
                                className="h-8 text-right bg-gray-50"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.product.price || ""}
                                onChange={(e) => {
                                  const price = parseFloat(e.target.value) || 0;
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
                                                      price
                                                    },
                                                    totalFOB: i.quantity * price
                                                  }
                                                : i
                                            )
                                          }
                                        : s
                                    )
                                  );
                                }}
                                className="h-8 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.totalFOB || ""}
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
                                                    totalFOB: totalFOB
                                                  }
                                                : i
                                            )
                                          }
                                        : s
                                    )
                                  );
                                }}
                                className="h-8 text-right"
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
                        {paymentTerms === "CIF" && "Insurance"}
                      </div>
                      <div className="w-1/6 text-right p-3 font-medium border-l border-gray-200">
                        {paymentTerms === "CIF" && (
                          <Input
                            type="number"
                            value={insuranceAmount}
                            {...register("products.insurance", { required: true })}
                            placeholder="Enter insurance amount"
                            onChange={(e) => setInsuranceAmount(parseInt(e.target.value))}
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
                          {...register("products.freight", { required: true })}
                          placeholder="Enter freight amount"
                          onChange={(e) => setFreightAmount(parseInt(e.target.value) )}
                          className="text-right border-0 p-0 h-6"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="flex justify-end">
                  <div className="w-1/3 text-right p-4 font-medium">
                    <div className="text-sm font-medium text-gray-500">Total {paymentTerms === "FOB" ? "FOB" : paymentTerms}</div>
                  </div>
                  <div className="w-1/6 text-right p-4 font-semibold text-lg border-l border-gray-200">
                    {totalFOBEuro.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
  );
};

export default ProductInformation;

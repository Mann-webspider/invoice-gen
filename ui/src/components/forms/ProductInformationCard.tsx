import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ContainerDetails } from "./ContainerDetails";

const ProductInformationCard = ({
  addNewSection,
  sections,
  sectionOptions,
  hsnCodes,
  units,
  sizes,
  containerTypes,
  marksAndNosConfig,
  setMarksAndNosConfig,
  containerType,
  setContainerType,
  setSections,
  numberOptions1,
  numberOptions2,
  removeRow,
  addNewRow,
  paymentTerms,
  showInsuranceFreight,
  insuranceAmount,
  freightAmount,
  setInsuranceAmount,
  setFreightAmount,
  totalFOBEuro
}) => {
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
        {/* Marks & Nos. Section */}
        {/* Consider extracting this as a separate <MarksAndNosSelector /> */}
         <ContainerDetails
                          marksAndNosConfig={marksAndNosConfig}
                          setMarksAndNosConfig={setMarksAndNosConfig}
                          numberOptions1={numberOptions1}
                          numberOptions2={numberOptions2}
                          containerType={containerType}
                          setContainerType={setContainerType}
                          containerTypes={containerTypes}
                        />

        {/* Sections Rendering */}
        <div className="overflow-x-auto">
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <select
                  title="Section Title"
                  value={section.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const hsnCode = hsnCodes[newTitle] || "69072100";
                    setSections((currentSections) =>
                      currentSections.map((s) => {
                        if (s.id === section.id) {
                          return {
                            ...s,
                            title: newTitle,
                            items: s.items.map((item) => ({
                              ...item,
                              product: {
                                ...item.product,
                                hsnCode,
                              },
                            })),
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
                                                  description:
                                                    e.target.value,
                                                  hsnCode:
                                                    hsnCodes[e.target.value] ||
                                                    hsnCodes["Sanitary"],
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
                            value={item.product.hsnCode}
                            readOnly
                            className="h-8 bg-gray-50 w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.product.size}
                            onValueChange={(value) => {
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
                                                  size: value,
                                                },
                                              }
                                            : i
                                        ),
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
                                                  quantity * i.product.sqmPerBox,
                                                totalFOB:
                                                  quantity * i.product.price,
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
                        <TableCell>
                          <Select
                            value={item.unitType}
                            onValueChange={(value) => {
                              setSections((currentSections) =>
                                currentSections.map((s) =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        items: s.items.map((i) =>
                                          i.id === item.id
                                            ? { ...i, unitType: value }
                                            : i
                                        ),
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
                        <TableCell>
                          {item.product.sqmPerBox.toFixed(2)}
                        </TableCell>
                        <TableCell>{item.totalSQM.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input type="text" value={item.product.price.toFixed(2)} className="w-16" onChange={(e)=>item.product.price += e.target.value}/>
                          {/* {item.product.price.toFixed(2)} */}
                        </TableCell>
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

          {/* Totals & Additional Charges */}
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
                        onChange={(e) =>
                          setInsuranceAmount(Number(e.target.value) || 0)
                        }
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
                      onChange={(e) =>
                        setFreightAmount(Number(e.target.value) || 0)
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
                  Total
                </div>
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

export default ProductInformationCard;

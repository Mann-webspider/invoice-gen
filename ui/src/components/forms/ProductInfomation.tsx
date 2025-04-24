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

const ProductInformation = ({
  addNewSection,
  marksAndNosConfig,
  setMarksAndNosConfig,
  numberOptions1,
  numberOptions2,
  containerType,
  setContainerType,
  containerTypes,
  sections,
  setSections,
  hsnCodes,
  sectionOptions,
  sizes,
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
        <ContainerDetails
          marksAndNosConfig={marksAndNosConfig}
          setMarksAndNosConfig={setMarksAndNosConfig}
          numberOptions1={numberOptions1}
          numberOptions2={numberOptions2}
          containerType={containerType}
          setContainerType={setContainerType}
          containerTypes={containerTypes}
        />

        <div className="overflow-x-auto">
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="mb-6">
              {/* Render Section Rows Here */}
              {/* You can extract this to its own component if needed */}
              {/* Reuse from your original JSX structure */}
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
            </div>
          ))}

          <div className="w-full border-t border-gray-300">
            {showInsuranceFreight && (
              <>
                <InsuranceFreightSection
                  paymentTerms={paymentTerms}
                  insuranceAmount={insuranceAmount}
                  setInsuranceAmount={setInsuranceAmount}
                  freightAmount={freightAmount}
                  setFreightAmount={setFreightAmount}
                />
                <Separator className="my-2" />
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
  );
};

export default ProductInformation;

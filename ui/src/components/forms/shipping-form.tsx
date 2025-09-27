import { useState } from 'react';
import { useDropdowns } from '@/hooks/use-dropdowns';
import { QueryStateHandler } from '@/components/query-state-handler';
import { Dropdown } from '@/components/ui/dropdown';

export function ShippingForm() {
  const { dropdowns, isLoading, isError, error } = useDropdowns();
  const [formData, setFormData] = useState({
    placeOfReceipt: '',
    portOfLoading: '',
    portOfDischarge: '',
    finalDestination: '',
    size: '',
    companyName: '',
    stateCode: '',
    supplier: '',
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <QueryStateHandler
      isLoading={isLoading}
      isError={isError}
      error={error}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Place of Receipt</label>
            <Dropdown
              options={dropdowns?.shipping.place_of_receipt || []}
              value={formData.placeOfReceipt}
              onChange={(value) => handleChange('placeOfReceipt', value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Port of Loading</label>
            <Dropdown
              options={dropdowns?.shipping.port_of_loading || []}
              value={formData.portOfLoading}
              onChange={(value) => handleChange('portOfLoading', value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Port of Discharge</label>
            <Dropdown
              options={dropdowns?.shipping.port_of_discharge || []}
              value={formData.portOfDischarge}
              onChange={(value) => handleChange('portOfDischarge', value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Final Destination</label>
            <Dropdown
              options={dropdowns?.shipping.final_destination || []}
              value={formData.finalDestination}
              onChange={(value) => handleChange('finalDestination', value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <Dropdown
              options={dropdowns?.size || []}
              value={formData.size}
              onChange={(value) => handleChange('size', value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <Dropdown
              options={dropdowns?.exporter.company_names || []}
              value={formData.companyName}
              onChange={(value) => handleChange('companyName', value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">State Code</label>
            <Dropdown
              options={dropdowns?.exporter.state_codes || []}
              value={formData.stateCode}
              onChange={(value) => handleChange('stateCode', value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Supplier</label>
            <Dropdown
              options={dropdowns?.supplier.suppliers || []}
              value={formData.supplier}
              onChange={(value) => handleChange('supplier', value)}
            />
          </div>
        </div>
      </div>
    </QueryStateHandler>
  );
} 
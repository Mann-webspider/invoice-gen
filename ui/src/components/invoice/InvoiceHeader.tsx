import React from 'react';
import { CompanyProfile, Invoice } from '../../lib/types';

interface InvoiceHeaderProps {
  companyProfile: CompanyProfile;
  invoice: Invoice;
  onCompanyProfileChange: (profile: CompanyProfile) => void;
  onInvoiceHeaderChange: (invoice: Partial<Invoice>) => void;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
  companyProfile,
  invoice,
  onCompanyProfileChange,
  onInvoiceHeaderChange
}) => {
  return (
    <div className="invoice-header">
      <div className="company-details">
        <h2>{companyProfile.name}</h2>
        <p>{companyProfile.address}</p>
        <p>GSTIN: {companyProfile.gstin}</p>
        <p>PAN: {companyProfile.pan}</p>
      </div>
      <div className="invoice-details">
        <h3>INVOICE</h3>
        <div className="invoice-number">
          <label>Invoice No:</label>
          <input
            type="text"
            value={invoice.invoiceNo}
            onChange={(e) => onInvoiceHeaderChange({ invoiceNo: e.target.value })}
          />
        </div>
        <div className="invoice-date">
          <label>Date:</label>
          <input
            type="date"
            value={invoice.date.toISOString().split('T')[0]}
            onChange={(e) => onInvoiceHeaderChange({ date: new Date(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
};
export default InvoiceHeader;


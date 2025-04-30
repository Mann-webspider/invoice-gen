import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface InvoiceFormData {
  invoice_number: string;
  invoice_date: Date;
  currency_type: string;
  currency_rate: number;
  integrated_tax:string;
  payment_term:string;
  product_type:string;
  exporter: object;
  buyer:object;
  shipping:object;
  products:object;
  package:object;
  supplier:object;
  sections: any[];
  markNumber: string;
}

interface PackagingListData {
  containerRows: any[];
  totalPalletCount: string;
  sections: any[];
  markNumber: string;
}

interface AnnexureData {
  range: string;
  division: string;
  commissionerate: string;
  examDate: string;
  invoiceDate: string;
  netWeight: string;
  grossWeight: string;
  totalPackages: string;
  officeDesignation1: string;
  officeDesignation2: string;
  selectedManufacturer: string;
  containerSizes: string[];
  lutDate: string;
  locationCode: string;
  sampleSealNo: string;
  question9a: string;
  question9b: string;
  sealType1: string;
  sealType2: string;
  manufacturerData: {
    name: string;
    address: string;
    gstin: string;
    permitNumber: string;
    permitDate: string;
    issuedBy: string;
  };
}

interface VGMData {
  containerInfo: any;
  invoiceHeader: any;
  netWeight: string;
  grossWeight: string;
}

interface FormState {
  invoice: InvoiceFormData | null;
  packagingList: PackagingListData | null;
  annexure: AnnexureData | null;
  vgm: VGMData | null;
  status: 'pending' | 'completed' | 'draft';
  lastSaved: string;
}

interface FormContextType {
  formData: FormState;
  setInvoiceData: (data: InvoiceFormData) => void;
  setPackagingListData: (data: PackagingListData) => void;
  setAnnexureData: (data: AnnexureData) => void;
  setVGMData: (data: VGMData) => void;
  saveForm: () => void;
  loadForm: (invoiceNo: string) => void;
  clearForm: () => void;
  submitForm: () => Promise<void>;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<FormState>({
    invoice: null,
    packagingList: null,
    annexure: null,
    vgm: null,
    status: 'draft',
    lastSaved: new Date().toISOString()
  });

  // Auto-save to localStorage whenever formData changes
  useEffect(() => {
    if (formData.invoice?.invoiceNo) {
      localStorage.setItem(`form_${formData.invoice.invoiceNo}`, JSON.stringify(formData));
    }
  }, [formData]);

  const setInvoiceData = (data: InvoiceFormData) => {
    setFormData(prev => ({
      ...prev,
      invoice: data,
      lastSaved: new Date().toISOString()
    }));
  };

  const setPackagingListData = (data: PackagingListData) => {
    setFormData(prev => ({
      ...prev,
      packagingList: data,
      lastSaved: new Date().toISOString()
    }));
  };

  const setAnnexureData = (data: AnnexureData) => {
    setFormData(prev => ({
      ...prev,
      annexure: data,
      lastSaved: new Date().toISOString()
    }));
  };

  const setVGMData = (data: VGMData) => {
    setFormData(prev => ({
      ...prev,
      vgm: data,
      lastSaved: new Date().toISOString()
    }));
  };

  const saveForm = () => {
    if (formData.invoice?.invoiceNo) {
      localStorage.setItem(`form_${formData.invoice.invoiceNo}`, JSON.stringify(formData));
    }
  };

  const loadForm = (invoiceNo: string) => {
    const savedData = localStorage.getItem(`form_${invoiceNo}`);
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  };

  const clearForm = () => {
    setFormData({
      invoice: null,
      packagingList: null,
      annexure: null,
      vgm: null,
      status: 'draft',
      lastSaved: new Date().toISOString()
    });
  };

  const submitForm = async () => {
    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const result = await response.json();
      setFormData(prev => ({
        ...prev,
        status: 'completed'
      }));
      return result;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  };

  return (
    <FormContext.Provider value={{
      formData,
      setInvoiceData,
      setPackagingListData,
      setAnnexureData,
      setVGMData,
      saveForm,
      loadForm,
      clearForm,
      submitForm
    }}>
      {children}
    </FormContext.Provider>
  );
};

export const useForm = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
}; 
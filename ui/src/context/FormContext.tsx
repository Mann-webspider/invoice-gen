import React, { createContext, useContext, useState, useEffect } from 'react';

interface InvoiceFormData {
  invoice_number: string;
  invoice_date: string;
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
  exam_date: string;
  invoice_date: string;
  net_weight: string;
  gross_weight: string;
  total_packages: string;
  officer_designation1: string;
  officer_designation2: string;
  selected_manufacturer: {
    name: string;
    address: string;
    gstin_number: string;
    permission: string;
  };
  
  lut_date: string;
  location_code: string;
  question9c: string;
  question9a: string;
  question9b: string;
  non_containerized: string;
  containerized: string;
   
}

interface VGMData {
  shipper_name: string;
  ie_code: string;
  authorized_name: string;
  authorized_contact: string;
  container_number: string;
  container_size: string;
  permissible_weight: string;
  weighbridge_registration: string;
  verified_gross_mass: string;
  unit_of_measurement: string;
  dt_weighing: string;
  weighing_slip_no: string;
  type: string;
  IMDG_class: string;
  containers:object[];
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
  ensureFormDataFromLocalStorage: () => void;
}

// Create form context with proper typing
const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({ children }: { children: any }) => {
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
    if (formData.invoice?.invoice_number) {
      // Silent error handling instead of console logging
      try {
        // Save the complete form data
        localStorage.setItem(`form_${formData.invoice.invoice_number}`, JSON.stringify(formData));
        
        // Also save each section individually for easier access
        if (formData.invoice) {
          localStorage.setItem(`form_${formData.invoice.invoice_number}_invoice`, JSON.stringify(formData.invoice));
        }
        if (formData.packagingList) {
          localStorage.setItem(`form_${formData.invoice.invoice_number}_packagingList`, JSON.stringify(formData.packagingList));
        }
        if (formData.annexure) {
          localStorage.setItem(`form_${formData.invoice.invoice_number}_annexure`, JSON.stringify(formData.annexure));
        }
        if (formData.vgm) {
          localStorage.setItem(`form_${formData.invoice.invoice_number}_vgm`, JSON.stringify(formData.vgm));
        }
        
        // Save the current form state to a 'current_form' key for easy access
        localStorage.setItem('current_form_id', formData.invoice.invoice_number);
      } catch (error) {
        // Silent error handling for localStorage failures
      }
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
    if (formData.invoice?.invoice_number) {
      try {
        // Save the complete form data
        localStorage.setItem(`form_${formData.invoice.invoice_number}`, JSON.stringify(formData));
        
        // Also save each section individually
        if (formData.invoice) {
          localStorage.setItem(`form_${formData.invoice.invoice_number}_invoice`, JSON.stringify(formData.invoice));
        }
        if (formData.packagingList) {
          localStorage.setItem(`form_${formData.invoice.invoice_number}_packagingList`, JSON.stringify(formData.packagingList));
        }
        if (formData.annexure) {
          localStorage.setItem(`form_${formData.invoice.invoice_number}_annexure`, JSON.stringify(formData.annexure));
        }
        if (formData.vgm) {
          localStorage.setItem(`form_${formData.invoice.invoice_number}_vgm`, JSON.stringify(formData.vgm));
        }
        
        // Save the current form ID for easy retrieval
        localStorage.setItem('current_form_id', formData.invoice.invoice_number);
      } catch (error) {
        // Silent error handling for localStorage failures
      }
    }
  };

  const loadForm = (invoiceNo: string) => {
    try {
      // Try to load the complete form data first
      const savedData = localStorage.getItem(`form_${invoiceNo}`);
      if (savedData) {
        setFormData(JSON.parse(savedData));
        return;
      }
      
      // If complete form not found, try to load individual sections
      const invoice = localStorage.getItem(`form_${invoiceNo}_invoice`);
      const packagingList = localStorage.getItem(`form_${invoiceNo}_packagingList`);
      const annexure = localStorage.getItem(`form_${invoiceNo}_annexure`);
      const vgm = localStorage.getItem(`form_${invoiceNo}_vgm`);
      
      const newFormData: FormState = {
        invoice: invoice ? JSON.parse(invoice) as InvoiceFormData : null,
        packagingList: packagingList ? JSON.parse(packagingList) as PackagingListData : null,
        annexure: annexure ? JSON.parse(annexure) as AnnexureData : null,
        vgm: vgm ? JSON.parse(vgm) as VGMData : null,
        status: 'draft',
        lastSaved: new Date().toISOString()
      };
      
      // Only update if we found at least one section
      if (invoice || packagingList || annexure || vgm) {
        setFormData(newFormData);
      }
      
      // Save the current form ID
      if (invoiceNo) {
        localStorage.setItem('current_form_id', invoiceNo);
      }
    } catch (error) {
      // Silent error handling for localStorage or JSON parsing failures
    }
  };

  const clearForm = () => {
    // Get the current form ID before clearing
    const currentFormId = formData.invoice?.invoice_number || localStorage.getItem('current_form_id');
    
    // Clear the form state
    setFormData({
      invoice: null,
      packagingList: null,
      annexure: null,
      vgm: null,
      status: 'draft',
      lastSaved: new Date().toISOString()
    });
    
    // Also clear from localStorage if we have an ID
    if (currentFormId) {
      try {
        localStorage.removeItem(`form_${currentFormId}`);
        localStorage.removeItem(`form_${currentFormId}_invoice`);
        localStorage.removeItem(`form_${currentFormId}_packagingList`);
        localStorage.removeItem(`form_${currentFormId}_annexure`);
        localStorage.removeItem(`form_${currentFormId}_vgm`);
        localStorage.removeItem('current_form_id');
      } catch (error) {
        // Silent error handling
      }
    }
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
      // Error submitting form - handled silently
      throw error;
    }
  };

  // Function to ensure all form data is loaded from localStorage
  const ensureFormDataFromLocalStorage = () => {
    try {
      // Get current form ID
      const currentFormId = localStorage.getItem('current_form_id') || '';
      if (!currentFormId) return;
      
      // Load each section from localStorage
      const invoiceData = localStorage.getItem(`form_${currentFormId}_invoice`);
      const packagingListData = localStorage.getItem(`form_${currentFormId}_packagingList`);
      const annexureData = localStorage.getItem(`form_${currentFormId}_annexure`);
      const vgmData = localStorage.getItem(`form_${currentFormId}_vgm`);
      
      // Update form state with data from localStorage
      let newFormData = { ...formData };
      
      if (invoiceData) {
        newFormData.invoice = JSON.parse(invoiceData);
      }
      
      if (packagingListData) {
        newFormData.packagingList = JSON.parse(packagingListData);
      }
      
      if (annexureData) {
        newFormData.annexure = JSON.parse(annexureData);
      }
      
      if (vgmData) {
        newFormData.vgm = JSON.parse(vgmData);
      }
      
      // Update form state
      setFormData(newFormData);
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
    }
  };

  return (
    <FormContext.Provider
      value={{
        formData,
        setInvoiceData,
        setPackagingListData,
        setAnnexureData,
        setVGMData,
        saveForm,
        loadForm,
        clearForm,
        submitForm,
        ensureFormDataFromLocalStorage
      }}
    >  
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
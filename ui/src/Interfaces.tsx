interface ExporterInterface {
    id: string;
    company_name: string;
    company_address: string;
    contact_number: string;
    email: string;
    tax_id: string;
    ie_code: string;
    pan_number: string;
    gstin_number: string;
    state_code: string;
    
    authorized_name: string;
    authorized_designation: string;
  }

  
export type { ExporterInterface };
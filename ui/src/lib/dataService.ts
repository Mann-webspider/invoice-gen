import { 
  CompanyProfile, 
  Client, 
  Product, 
  ShippingTerm, 
  Invoice,
  DropdownOptionsState,
  DropdownCategory,
  DropdownOption
} from "./types";
import { 
  generateId, 
  getStorageItem, 
  setStorageItem, 
  LOCAL_STORAGE_KEYS 
} from "./utils";

// Company Profile
export const getCompanyProfile = (): CompanyProfile => {
  return getStorageItem<CompanyProfile>(LOCAL_STORAGE_KEYS.COMPANY, {
    name: "",
    address: "",
    gstin: "",
    pan: "",
    declarationText: "",
  });
};

export const saveCompanyProfile = (company: CompanyProfile): CompanyProfile => {
  setStorageItem(LOCAL_STORAGE_KEYS.COMPANY, company);
  return company;
};

// Clients
export const getClients = (): Client[] => {
  return getStorageItem<Client[]>(LOCAL_STORAGE_KEYS.CLIENTS, []);
};

export const saveClient = (client: Client): Client => {
  const clients = getClients();
  const newClient = { ...client, id: client.id || generateId() };
  
  const updatedClients = client.id
    ? clients.map((c) => (c.id === client.id ? newClient : c))
    : [...clients, newClient];
  
  setStorageItem(LOCAL_STORAGE_KEYS.CLIENTS, updatedClients);
  return newClient;
};

export const deleteClient = (id: string): void => {
  const clients = getClients();
  const updatedClients = clients.filter((client) => client.id !== id);
  setStorageItem(LOCAL_STORAGE_KEYS.CLIENTS, updatedClients);
};

// Products
export const getProducts = (): Product[] => {
  return getStorageItem<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []);
};

export const saveProduct = (product: Product): Product => {
  const products = getProducts();
  const newProduct = { ...product, id: product.id || generateId() };
  
  const updatedProducts = product.id
    ? products.map((p) => (p.id === product.id ? newProduct : p))
    : [...products, newProduct];
  
  setStorageItem(LOCAL_STORAGE_KEYS.PRODUCTS, updatedProducts);
  return newProduct;
};

export const deleteProduct = (id: string): void => {
  const products = getProducts();
  const updatedProducts = products.filter((product) => product.id !== id);
  setStorageItem(LOCAL_STORAGE_KEYS.PRODUCTS, updatedProducts);
};

// Shipping Terms
export const getShippingTerms = (): ShippingTerm[] => {
  return getStorageItem<ShippingTerm[]>(LOCAL_STORAGE_KEYS.SHIPPING, []);
};

export const saveShippingTerm = (term: ShippingTerm): ShippingTerm => {
  const terms = getShippingTerms();
  const newTerm = { ...term, id: term.id || generateId() };
  
  const updatedTerms = term.id
    ? terms.map((t) => (t.id === term.id ? newTerm : t))
    : [...terms, newTerm];
  
  setStorageItem(LOCAL_STORAGE_KEYS.SHIPPING, updatedTerms);
  return newTerm;
};

export const deleteShippingTerm = (id: string): void => {
  const terms = getShippingTerms();
  const updatedTerms = terms.filter((term) => term.id !== id);
  setStorageItem(LOCAL_STORAGE_KEYS.SHIPPING, updatedTerms);
};

// Invoices
export const getInvoices = (): Invoice[] => {
  return getStorageItem<Invoice[]>(LOCAL_STORAGE_KEYS.INVOICES, []);
};

export const saveInvoice = (invoice: Invoice): Invoice => {
  const invoices = getInvoices();
  const newInvoice = { ...invoice, id: invoice.id || generateId() };
  
  const updatedInvoices = invoice.id
    ? invoices.map((i) => (i.id === invoice.id ? newInvoice : i))
    : [...invoices, newInvoice];
  
  setStorageItem(LOCAL_STORAGE_KEYS.INVOICES, updatedInvoices);
  return newInvoice;
};

export const deleteInvoice = (id: string): void => {
  const invoices = getInvoices();
  const updatedInvoices = invoices.filter((invoice) => invoice.id !== id);
  setStorageItem(LOCAL_STORAGE_KEYS.INVOICES, updatedInvoices);
};

// Dropdown Options
export const getDropdownOptions = (): DropdownOptionsState => {
  return getStorageItem<DropdownOptionsState>(LOCAL_STORAGE_KEYS.DROPDOWN_OPTIONS, {
    categories: [
      // Exporter Section
      {
        id: "exporter",
        name: "EXPORTER",
        options: []
      },
      {
        id: "ieCode",
        name: "I.E. Code #",
        options: []
      },
      {
        id: "panNo",
        name: "PAN NO.",
        options: []
      },
      {
        id: "gstinNo",
        name: "GSTIN NO.",
        options: []
      },
      {
        id: "stateCode",
        name: "STATE CODE",
        options: []
      },
      {
        id: "buyersOrderNoFormat",
        name: "Buyer's Order No. Format",
        options: []
      },
      {
        id: "poNo",
        name: "PO No.",
        options: []
      },
      
      // Shipping Details
      {
        id: "preCarriageBy",
        name: "Pre-Carriage By",
        options: []
      },
      {
        id: "placeOfReceipt",
        name: "Place of Receipt by Pre-Carrier",
        options: []
      },
      {
        id: "countryOfOrigin",
        name: "Country of Origin",
        options: []
      },
      {
        id: "countryOfFinalDestination",
        name: "Country of Final Destination",
        options: []
      },
      {
        id: "vesselFlightNo",
        name: "Vessel Flight No.",
        options: []
      },
      {
        id: "portOfLoading",
        name: "Port of Loading",
        options: []
      },
      {
        id: "portOfDischarge",
        name: "Port of Discharge",
        options: []
      },
      {
        id: "finalDestination",
        name: "Final Destination",
        options: []
      },
      {
        id: "termsOfDelivery",
        name: "Terms of Delivery & Payment",
        options: []
      },
      {
        id: "shippingMethod",
        name: "SHIPPING - THROUGH SEA/AIR",
        options: []
      },
      {
        id: "euroRate",
        name: "EURO RATE",
        options: []
      },
      
      // Table Information
      {
        id: "marksAndNos",
        name: "Marks & Nos.(10X20 FCL/LCL)",
        options: []
      },
      {
        id: "size",
        name: "Size(600 X 1200)",
        options: []
      },
      {
        id: "sanitaryTilesMix",
        name: "Sanitary/Tiles/Mix",
        options: []
      },
      {
        id: "unit",
        name: "Unit (Box)",
        options: []
      },
      {
        id: "hsnCode",
        name: "HSN Code",
        options: []
      },
      
      // Supplier Details
      {
        id: "supplierName",
        name: "Supplier Name",
        options: []
      },
      {
        id: "supplierGstin",
        name: "Supplier GSTIN",
        options: []
      },
      {
        id: "taxInvoiceFormat",
        name: "Tax Invoice No. & Date Format",
        options: []
      },
      
      // ARN & Declaration
      {
        id: "exportUnderGstCircular",
        name: "Export Under GST Circular No.",
        options: []
      },
      {
        id: "lutFormat",
        name: "LUT Application Reference Format",
        options: []
      }
    ]
  });
};

export const saveDropdownOptions = (options: DropdownOptionsState): DropdownOptionsState => {
  setStorageItem(LOCAL_STORAGE_KEYS.DROPDOWN_OPTIONS, options);
  return options;
};

export const addDropdownCategory = (category: DropdownCategory): DropdownOptionsState => {
  const options = getDropdownOptions();
  const updatedOptions = {
    ...options,
    categories: [...options.categories, { ...category, id: category.id || generateId() }]
  };
  return saveDropdownOptions(updatedOptions);
};

export const updateDropdownCategory = (categoryId: string, updatedCategory: Partial<DropdownCategory>): DropdownOptionsState => {
  const options = getDropdownOptions();
  const updatedOptions = {
    ...options,
    categories: options.categories.map(category => 
      category.id === categoryId ? { ...category, ...updatedCategory } : category
    )
  };
  return saveDropdownOptions(updatedOptions);
};

export const deleteDropdownCategory = (categoryId: string): DropdownOptionsState => {
  const options = getDropdownOptions();
  const updatedOptions = {
    ...options,
    categories: options.categories.filter(category => category.id !== categoryId)
  };
  return saveDropdownOptions(updatedOptions);
};

export const addDropdownOption = (categoryId: string, option: DropdownOption): DropdownOptionsState => {
  const options = getDropdownOptions();
  const updatedOptions = {
    ...options,
    categories: options.categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          options: [...category.options, { ...option, id: option.id || generateId() }]
        };
      }
      return category;
    })
  };
  return saveDropdownOptions(updatedOptions);
};

export const updateDropdownOption = (categoryId: string, optionId: string, updatedOption: Partial<DropdownOption>): DropdownOptionsState => {
  const options = getDropdownOptions();
  const updatedOptions = {
    ...options,
    categories: options.categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          options: category.options.map(option => 
            option.id === optionId ? { ...option, ...updatedOption } : option
          )
        };
      }
      return category;
    })
  };
  return saveDropdownOptions(updatedOptions);
};

export const deleteDropdownOption = (categoryId: string, optionId: string): DropdownOptionsState => {
  const options = getDropdownOptions();
  const updatedOptions = {
    ...options,
    categories: options.categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          options: category.options.filter(option => option.id !== optionId)
        };
      }
      return category;
    })
  };
  return saveDropdownOptions(updatedOptions);
};

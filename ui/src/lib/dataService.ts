
import { 
  CompanyProfile, 
  Client, 
  Product, 
  ShippingTerm, 
  Invoice 
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

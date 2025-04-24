import React, { createContext, useContext, useState } from 'react';
import { Client, Product, ShippingTerm, CompanyProfile } from '../types/types';

// Define the shape of the context
export interface InvoiceContextType {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  shippingTerms: ShippingTerm[];
  setShippingTerms: React.Dispatch<React.SetStateAction<ShippingTerm[]>>;
  companyProfile: CompanyProfile | null;
  setCompanyProfile: React.Dispatch<React.SetStateAction<CompanyProfile | null>>;
  // ... Add all other state and setters here as in InvoiceGenerator
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Move all useState logic here
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingTerms, setShippingTerms] = useState<ShippingTerm[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  // ... Add all other useState from InvoiceGenerator

  const value: InvoiceContextType = {
    clients, setClients,
    products, setProducts,
    shippingTerms, setShippingTerms,
    companyProfile, setCompanyProfile,
    // ... Add all other state and setters
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoiceContext = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoiceContext must be used within an InvoiceProvider');
  }
  return context;
};

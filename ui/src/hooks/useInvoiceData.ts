import { useState, useEffect } from 'react';
import { 
  getClients, 
  getProducts, 
  getShippingTerms, 
  getCompanyProfile 
} from '@/lib/dataService';
import type { 
  Client, 
  Product, 
  ShippingTerm, 
  CompanyProfile 
} from '@/lib/types';

export const useInvoiceData = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingTerms, setShippingTerms] = useState<ShippingTerm[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [clientsData, productsData, shippingData, companyData] = await Promise.all([
          getClients(),
          getProducts(),
          getShippingTerms(),
          getCompanyProfile()
        ]);

        setClients(clientsData);
        setProducts(productsData);
        setShippingTerms(shippingData);
        setCompanyProfile(companyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    clients,
    products,
    shippingTerms,
    companyProfile,
    isLoading,
    error
  };
};

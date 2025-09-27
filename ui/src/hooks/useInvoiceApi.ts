import { useInvoiceContext } from '../providers/InvoiceContext';
import axios from 'axios';

export const useInvoiceApi = () => {
  const { setClients, setProducts, setShippingTerms, setCompanyProfile } = useInvoiceContext();

  const fetchClients = async () => {
    const res = await axios.get('/api/clients');
    setClients(res.data);
  };

  const fetchProducts = async () => {
    const res = await axios.get('/api/products');
    setProducts(res.data);
  };

  const fetchShippingTerms = async () => {
    const res = await axios.get('/api/shipping-terms');
    setShippingTerms(res.data);
  };

  const fetchCompanyProfile = async () => {
    const res = await axios.get('/api/company-profile');
    setCompanyProfile(res.data);
  };

  // ... Add more API logic as needed

  return {
    fetchClients,
    fetchProducts,
    fetchShippingTerms,
    fetchCompanyProfile,
    // ...
  };
};

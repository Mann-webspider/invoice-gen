// Import types but handle the case where axios might not be installed yet
import { Invoice, Client, Product, ShippingTerm } from './types';

// Create a simple fetch wrapper for API calls
// This avoids dependency on axios which might not be installed
const api = {
  async get(url: string) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      // GET request failed - handled silently
      return null;
    }
  },
  
  async post(url: string, data: any) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      // POST request failed - handled silently
      return null;
    }
  },
  
  async put(url: string, data: any) {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      // PUT request failed - handled silently
      return null;
    }
  },
  
  async delete(url: string) {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      // DELETE request failed - handled silently
      return null;
    }
  }
};

// Base API URL
const BASE_URL = 'http://localhost:8000/api';

// Helper function to build full URL
const buildUrl = (endpoint: string) => `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

// API endpoints for invoices
export const  invoiceApi = {
  getAll: async (): Promise<Invoice[]> => {
    try {
      const data = await api.get(buildUrl('/invoice'));
      // Data received - handled silently
      
      return data.invoices || [];
    } catch (error) {
      // Error fetching invoices - handled silently
      return [];
    }
  },
  
  getById: async (id: string): Promise<Invoice | null> => {
    try {
      const data = await api.get(buildUrl(`/invoices/${id}`));
      return data;
    } catch (error) {
      // Error fetching invoice - handled silently
      return null;
    }
  },
  
  create: async (invoice: Omit<Invoice, 'id'>): Promise<Invoice | null> => {
    try {
      const data = await api.post(buildUrl('/invoices'), invoice);
      return data;
    } catch (error) {
      // Error creating invoice - handled silently
      return null;
    }
  },
  
  update: async (id: string, invoice: Partial<Invoice>): Promise<Invoice | null> => {
    try {
      const data = await api.put(buildUrl(`/invoices/${id}`), invoice);
      return data;
    } catch (error) {
      // Error updating invoice - handled silently
      return null;
    }
  },
  
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(buildUrl(`/invoices/${id}`));
      return true;
    } catch (error) {
      // Error deleting invoice - handled silently
      return false;
    }
  }
};

// API endpoints for exporters/clients
export const exporterApi = {
  getAll: async (): Promise<Client[]> => {
    try {
      const data = await api.get(buildUrl('/exporters'));
      return data || [];
    } catch (error) {
      // Error fetching exporters - handled silently
      return [];
    }
  },
  
  getById: async (id: string): Promise<Client | null> => {
    try {
      const data = await api.get(buildUrl(`/exporters/${id}`));
      return data;
    } catch (error) {
      // Error fetching exporter - handled silently
      return null;
    }
  },
  
  create: async (exporter: Omit<Client, 'id'>): Promise<Client | null> => {
    try {
      const data = await api.post(buildUrl('/exporters'), exporter);
      return data;
    } catch (error) {
      // Error creating exporter - handled silently
      return null;
    }
  },
  
  update: async (id: string, exporter: Partial<Client>): Promise<Client | null> => {
    try {
      const data = await api.put(buildUrl(`/exporters/${id}`), exporter);
      return data;
    } catch (error) {
      // Error updating exporter - handled silently
      return null;
    }
  },
  
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(buildUrl(`/exporters/${id}`));
      return true;
    } catch (error) {
      // Error deleting exporter - handled silently
      return false;
    }
  }
};

// API endpoints for products
export const productApi = {
  getAll: async (): Promise<Product[]> => {
    try {
      const data = await api.get(buildUrl('/products'));
      return data || [];
    } catch (error) {
      // Error fetching products - handled silently
      return [];
    }
  },
  
  getById: async (id: string): Promise<Product | null> => {
    try {
      const data = await api.get(buildUrl(`/products/${id}`));
      return data;
    } catch (error) {
      // Error fetching product - handled silently
      return null;
    }
  },
  
  create: async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    try {
      const data = await api.post(buildUrl('/products'), product);
      return data;
    } catch (error) {
      // Error creating product - handled silently
      return null;
    }
  },
  
  update: async (id: string, product: Partial<Product>): Promise<Product | null> => {
    try {
      const data = await api.put(buildUrl(`/products/${id}`), product);
      return data;
    } catch (error) {
      // Error updating product - handled silently
      return null;
    }
  },
  
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(buildUrl(`/products/${id}`));
      return true;
    } catch (error) {
      // Error deleting product - handled silently
      return false;
    }
  }
};

// API endpoints for shipping terms
export const shippingTermApi = {
  getAll: async (): Promise<ShippingTerm[]> => {
    try {
      const data = await api.get(buildUrl('/shipping-terms'));
      return data || [];
    } catch (error) {
      // Error fetching shipping terms - handled silently
      return [];
    }
  },
  
  getById: async (id: string): Promise<ShippingTerm | null> => {
    try {
      const data = await api.get(buildUrl(`/shipping-terms/${id}`));
      return data;
    } catch (error) {
      // Error fetching shipping term - handled silently
      return null;
    }
  },
  
  create: async (term: Omit<ShippingTerm, 'id'>): Promise<ShippingTerm | null> => {
    try {
      const data = await api.post(buildUrl('/shipping-terms'), term);
      return data;
    } catch (error) {
      // Error creating shipping term - handled silently
      return null;
    }
  },
  
  update: async (id: string, term: Partial<ShippingTerm>): Promise<ShippingTerm | null> => {
    try {
      const data = await api.put(buildUrl(`/shipping-terms/${id}`), term);
      return data;
    } catch (error) {
      // Error updating shipping term - handled silently
      return null;
    }
  },
  
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(buildUrl(`/shipping-terms/${id}`));
      return true;
    } catch (error) {
      // Error deleting shipping term - handled silently
      return false;
    }
  }
};

// Dashboard statistics API
export const dashboardApi = {
  getStats: async () => {
    try {
      const data = await api.get(buildUrl('/invoice'));
      if (data) return data.counts;
      
      // If API fails, return default structure
      return {
        invoiceCount: 0,
        exporterCount: 0,
        productCount: 0,
        shippingTermCount: 0
      };
    } catch (error) {
      // Error fetching dashboard stats - handled silently
      return {
        invoiceCount: 0,
        exporterCount: 0,
        productCount: 0,
        shippingTermCount: 0
      };
    }
  },
  
  getRecentInvoices: async (limit = 8) => {
    try {
      const data = await api.get(buildUrl(`/invoice?limit=${limit}`));
      return data.invoices || [];
    } catch (error) {
      // Error fetching recent invoices - handled silently
      return [];
    }
  }
};

export default api;

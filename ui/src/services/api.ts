import api from '@/lib/axios';
import { AllDropdownsResponse } from '@/types/dropdowns';

// Dropdowns API
export const dropdownsApi = {
  getAll: () => api.get<AllDropdownsResponse>('/all-dropdowns'),
  updateDropdown: (category: string, data: any) => api.post(`/dropdowns/${category}`, data),
  deleteDropdown: (category: string, id: string) => api.delete(`/dropdowns/${category}/${id}`),
};

// Company Profile API
export const companyApi = {
  getProfile: () => api.get('/company/profile'),
  updateProfile: (data: any) => api.put('/company/profile', data),
};

// Products API
export const productsApi = {
  getAll: () => api.get('/products'),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Shipping Terms API
export const shippingApi = {
  getTerms: () => api.get('/shipping/terms'),
  updateTerms: (data: any) => api.put('/shipping/terms', data),
  getLocations: () => api.get('/shipping/locations'),
  updateLocations: (data: any) => api.put('/shipping/locations', data),
};

// Invoice API
export const invoiceApi = {
  generate: (data: any) => api.post('/invoice/generate', data),
  getTemplates: () => api.get('/invoice/templates'),
  saveTemplate: (data: any) => api.post('/invoice/templates', data),
  getHistory: () => api.get('/invoice/history'),
};

// Admin API
export const adminApi = {
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.put('/admin/settings', data),
  getUsers: () => api.get('/admin/users'),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
}; 
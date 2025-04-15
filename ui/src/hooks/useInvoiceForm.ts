import { useState, useEffect } from 'react';
import { Invoice, Client, ShippingTerm, ProductSection, InvoiceItem } from '../lib/types';

const useInvoiceForm = (initialInvoice: Invoice) => {
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [sections, setSections] = useState<ProductSection[]>([]);

  // Update invoice properties
  const updateInvoice = (updates: Partial<Invoice>) => {
    setInvoice(prev => ({ ...prev, ...updates }));
  };

  // Update client information
  const updateClient = (updates: Partial<Client>) => {
    setInvoice(prev => ({
      ...prev,
      client: { ...prev.client, ...updates }
    }));
  };

  // Update shipping terms
  const updateShippingTerm = (updates: Partial<ShippingTerm>) => {
    setInvoice(prev => ({
      ...prev,
      shippingTerm: { ...prev.shippingTerm, ...updates }
    }));
  };

  // Add new product section
  const addSection = (title: string) => {
    const newSection: ProductSection = {
      id: Date.now().toString(),
      title,
      items: []
    };
    setSections(prev => [...prev, newSection]);
  };

  // Add item to section
  const addItem = (sectionId: string, item: InvoiceItem) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, items: [...section.items, item] }
          : section
      )
    );
  };

  // Update item in section
  const updateItem = (sectionId: string, itemId: string, updates: Partial<InvoiceItem>) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              )
            }
          : section
      )
    );
  };

  // Remove item from section
  const removeItem = (sectionId: string, itemId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.filter(item => item.id !== itemId)
            }
          : section
      )
    );
  };

  // Calculate totals whenever sections change
  useEffect(() => {
    const totalSQM = sections.reduce(
      (sum, section) => sum + section.items.reduce(
        (sectionSum, item) => sectionSum + item.totalSQM, 0
      ), 0
    );

    const totalFOBEuro = sections.reduce(
      (sum, section) => sum + section.items.reduce(
        (sectionSum, item) => sectionSum + item.totalFOB, 0
      ), 0
    );

    setInvoice(prev => ({
      ...prev,
      totalSQM,
      totalFOBEuro
    }));
  }, [sections]);

  return {
    invoice,
    sections,
    updateInvoice,
    updateClient,
    updateShippingTerm,
    addSection,
    addItem,
    updateItem,
    removeItem
  };
};

export default useInvoiceForm;

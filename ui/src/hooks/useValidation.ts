import { Invoice, Client, ShippingTerm, ProductSection } from '../lib/types';

const useValidation = () => {
  const validateClient = (client: Client): string[] => {
    const errors: string[] = [];
    if (!client.consignee.trim()) errors.push('Consignee is required');
    if (!client.notifyParty.trim()) errors.push('Notify party is required');
    if (!client.buyerOrderNoFormat.trim()) errors.push('Buyer order format is required');
    return errors;
  };

  const validateShippingTerm = (term: ShippingTerm): string[] => {
    const errors: string[] = [];
    if (!term.fob.trim()) errors.push('FOB is required');
    if (!term.port.trim()) errors.push('Port is required');
    if (term.euroRate <= 0) errors.push('Euro rate must be positive');
    return errors;
  };

  const validateInvoiceHeader = (invoice: Invoice): string[] => {
    const errors: string[] = [];
    if (!invoice.invoiceNo.trim()) errors.push('Invoice number is required');
    if (!invoice.date) errors.push('Invoice date is required');
    return errors;
  };

  const validateProducts = (sections: ProductSection[]): string[] => {
    const errors: string[] = [];
    if (sections.length === 0) errors.push('At least one product section is required');
    
    sections.forEach(section => {
      if (section.items.length === 0) {
        errors.push(`Section "${section.title}" has no items`);
      }
    });

    return errors;
  };

  const validateCompleteInvoice = (invoice: Invoice, sections: ProductSection[]): string[] => {
    return [
      ...validateInvoiceHeader(invoice),
      ...validateClient(invoice.client),
      ...validateShippingTerm(invoice.shippingTerm),
      ...validateProducts(sections)
    ];
  };

  return {
    validateClient,
    validateShippingTerm,
    validateInvoiceHeader,
    validateProducts,
    validateCompleteInvoice
  };
};

export default useValidation;

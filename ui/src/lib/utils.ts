
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to generate an invoice number
export function generateInvoiceNumber(): string {
  const currentYear = new Date().getFullYear();
  // In a real application, you would fetch the last invoice number from the database
  // and increment it
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  return `EXP/${String(randomNumber).padStart(3, "0")}/${currentYear}`;
}

// Function to convert amount to words
export function convertAmountToWords(amount: number): string {
  // This is a simplified implementation
  // In a real application, you would use a library like "to-words"
  
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
  const teens = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  
  const placeValues = [
    { value: 10000000, name: "CRORE" },
    { value: 100000, name: "LAKH" },
    { value: 1000, name: "THOUSAND" },
    { value: 100, name: "HUNDRED" },
  ];
  
  if (amount === 0) return "ZERO";
  
  let words = "";
  
  // Process place values
  for (const place of placeValues) {
    const count = Math.floor(amount / place.value);
    if (count > 0) {
      if (count < 10) {
        words += ones[count] + " " + place.name + " ";
      } else if (count < 20) {
        words += teens[count - 10] + " " + place.name + " ";
      } else {
        const tenCount = Math.floor(count / 10);
        const oneCount = count % 10;
        words += tens[tenCount] + (oneCount > 0 ? " " + ones[oneCount] : "") + " " + place.name + " ";
      }
      amount %= place.value;
    }
  }
  
  // Process tens and ones
  if (amount > 0) {
    if (amount < 10) {
      words += ones[amount];
    } else if (amount < 20) {
      words += teens[amount - 10];
    } else {
      const tenCount = Math.floor(amount / 10);
      const oneCount = amount % 10;
      words += tens[tenCount] + (oneCount > 0 ? " " + ones[oneCount] : "");
    }
  }
  
  return words.trim() + " ONLY";
}

// Function to format currency
export function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Function to format date
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

// Create a mock database for demo purposes
// In a real application, these would be API calls to your backend
const LOCAL_STORAGE_KEYS = {
  COMPANY: 'invoice-forge-company',
  CLIENTS: 'invoice-forge-clients',
  PRODUCTS: 'invoice-forge-products',
  SHIPPING: 'invoice-forge-shipping',
  INVOICES: 'invoice-forge-invoices',
};

// Helper function to generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Generic localStorage helpers
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

export const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Export the keys for use in components
export { LOCAL_STORAGE_KEYS };

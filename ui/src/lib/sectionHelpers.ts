/**
 * Helper functions for managing section titles in the PackagingList component
 */

import { ProductSection } from '@/lib/types';

/**
 * Adds a custom section title to the list of options if it doesn't already exist
 * @param title The custom title to add
 * @param currentOptions The current list of section title options
 * @returns A new array with the custom title added (or the original array if the title already exists)
 */
export const addCustomSectionTitle = (title: string, currentOptions: string[]): string[] => {
  if (!title || currentOptions.includes(title)) {
    return currentOptions;
  }
  
  return [...currentOptions, title];
};

/**
 * Updates the section title in the sections array
 * @param sectionId The ID of the section to update
 * @param title The new title for the section
 * @param sections The current array of sections
 * @param hsnCodes Map of section titles to HSN codes
 * @returns A new array with the updated section
 */
export const updateSectionTitle = (
  sectionId: string, 
  title: string, 
  sections: ProductSection[], 
  hsnCodes: Record<string, string>
): ProductSection[] => {
  const defaultHsnCode = "69072100";
  const hsnCode = hsnCodes[title] || defaultHsnCode;
  
  return sections.map(section => {
    if (section.id === sectionId) {
      // Update all items in the section with the new HSN code
      const updatedItems = section.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          hsnCode
        }
      }));
      
      return { 
        ...section, 
        title,
        items: updatedItems 
      };
    }
    return section;
  });
};

/**
 * Persists the updated section options to localStorage
 * @param options The updated section options array
 */
export const persistSectionOptions = (options: string[]): void => {
  try {
    const existingData = localStorage.getItem('packagingListData');
    const data = existingData ? JSON.parse(existingData) : {};
    
    localStorage.setItem('packagingListData', JSON.stringify({
      ...data,
      sectionOptions: options
    }));
  } catch (error) {
    // Error persisting section options - handled silently
  }
};

/**
 * Loads saved section options from localStorage
 * @param defaultOptions Default options to use if none are found in localStorage
 * @returns The saved section options or the default options
 */
export const loadSavedSectionOptions = (defaultOptions: string[]): string[] => {
  try {
    const savedData = localStorage.getItem('packagingListData');
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.sectionOptions && Array.isArray(data.sectionOptions)) {
        return data.sectionOptions;
      }
    }
  } catch (error) {
    // Error loading saved section options - handled silently
  }
  
  return defaultOptions;
};

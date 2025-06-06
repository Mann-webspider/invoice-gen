// Handle toast notifications with error handling to avoid import errors
const showToast = (message: string, type: 'success' | 'error') => {
  try {
    // Use console.log instead of toast to avoid import errors
    console.log(`[${type.toUpperCase()}] ${message}`);
  } catch (error) {
    console.error(`Toast notification (${type}): ${message}`);
  }
};

/**
 * Utility functions for sharing data between forms via localStorage
 */

/**
 * Get the current form ID from localStorage or use a default
 */
export const getCurrentFormId = (): string => {
  return localStorage.getItem('current_form_id') || 'temp_form';
};

/**
 * Load a specific form section from localStorage
 * @param formId - The form ID
 * @param section - The section name (invoice, packagingList, annexure, vgm)
 * @returns The parsed form section data or null if not found
 */
export const loadFormSection = (formId: string, section: string): any => {
  try {
    const sectionData = localStorage.getItem(`form_${formId}_${section}`);
    if (sectionData) {
      return JSON.parse(sectionData);
    }
    
    // If section-specific data not found, try to get it from the full form
    const fullFormData = localStorage.getItem(`form_${formId}`);
    if (fullFormData) {
      const parsedForm = JSON.parse(fullFormData);
      if (parsedForm[section]) {
        return parsedForm[section];
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading ${section} data:`, error);
    return null;
  }
};

/**
 * Load all form data from localStorage
 * @returns An object containing all form sections
 */
export const loadAllFormData = (): any => {
  const formId = getCurrentFormId();
  
  return {
    invoice: loadFormSection(formId, 'invoice'),
    packagingList: loadFormSection(formId, 'packagingList'),
    annexure: loadFormSection(formId, 'annexure'),
    vgm: loadFormSection(formId, 'vgm')
  };
};

/**
 * Get a specific value from another form section
 * @param sourceSection - The section to get the value from
 * @param fieldPath - The dot-notation path to the field (e.g., 'buyer.company_name')
 * @param defaultValue - Default value if not found
 * @returns The value from the specified section or the default value
 */
export const getValueFromSection = (sourceSection: string, fieldPath: string, defaultValue: any = null): any => {
  try {
    const formId = getCurrentFormId();
    const sectionData = loadFormSection(formId, sourceSection);
    
    if (!sectionData) return defaultValue;
    
    // Handle dot notation for nested fields
    const parts = fieldPath.split('.');
    let value = sectionData;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return defaultValue;
      }
    }
    
    return value || defaultValue;
  } catch (error) {
    console.error(`Error getting value from ${sourceSection}.${fieldPath}:`, error);
    return defaultValue;
  }
};

/**
 * Save a form section to localStorage
 * @param formId - The form ID
 * @param section - The section name
 * @param data - The section data to save
 */
export const saveFormSection = (formId: string, section: string, data: any): void => {
  try {
    localStorage.setItem(`form_${formId}_${section}`, JSON.stringify(data));
    
    // Also update the section in the full form data if it exists
    const fullFormData = localStorage.getItem(`form_${formId}`);
    if (fullFormData) {
      const parsedForm = JSON.parse(fullFormData);
      parsedForm[section] = data;
      localStorage.setItem(`form_${formId}`, JSON.stringify(parsedForm));
    }
  } catch (error) {
    console.error(`Error saving ${section} data:`, error);
    showToast(`Failed to save ${section} data`, 'error');
  }
};

/**
 * Collect all form data from localStorage for a specific form ID
 * @param formId - The form ID to collect data for
 * @returns An object containing all form sections for the specified form ID
 */
export const collectAllFormDataFromLocalStorage = (formId: string): any => {
  try {
    return {
      invoice: loadFormSection(formId, 'invoice'),
      packagingList: loadFormSection(formId, 'packagingList'),
      annexure: loadFormSection(formId, 'annexure'),
      vgm: loadFormSection(formId, 'vgm')
    };
  } catch (error) {
    console.error('Error collecting all form data from localStorage:', error);
    return {};
  }
};

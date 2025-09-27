import { useState } from 'react';
import { toast } from 'sonner';
import type { Invoice } from '@/lib/types';

interface UseInvoicePreviewProps {
  onPreviewSuccess?: () => void;
  onPreviewError?: (error: string) => void;
}

export const useInvoicePreview = ({ onPreviewSuccess, onPreviewError }: UseInvoicePreviewProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generatePreview = async (invoiceData: Invoice) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const data = await response.json();
      setPreviewUrl(data.previewUrl);
      onPreviewSuccess?.();
      toast.success('Preview generated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate preview';
      onPreviewError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    previewUrl,
    generatePreview,
  };
};

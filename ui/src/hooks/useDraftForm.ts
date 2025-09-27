import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "@/lib/axios";
import { Toast } from '@/components/ui/toast';
import { useToast } from './use-toast';

interface UseDraftFormOptions {
  formType: string;
  methods: any;
  isDraftMode?: boolean;
}

export const useDraftForm = ({ formType, methods, isDraftMode }: UseDraftFormOptions) => {
  const {toast} = useToast();
  const { id: draftIdFromURL } = useParams();
  const navigate = useNavigate();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { reset, getValues } = methods;

  // ✅ Move loadDraftData inside useEffect or use useCallback
  const loadDraftData = useCallback(async (id: string) => {
    try {
      const res = await api.get(`/draft/${id}`);
      const { data, last_page } = res?.data;

      // ✅ Fix: Only parse once
      const parsed = JSON.parse(data);
      console.log('📄 Loaded draft data:', JSON.parse(parsed));
      // console.log('📄 Loaded draft page:', last_page);
      
      // Reset with parsed data (no double parsing)
      methods.reset(JSON.parse(parsed));
      
      // ✅ Mark as hydrated after a short delay
      setHydrated(true);
      

     
      
     
     
      
      // if ( last_page && isDraftMode) {
      //   navigate(`/invoice/drafts/${id}`);
      // }
    } catch (error) {
      console.error('❌ Failed to load draft data:', error);
      // Set ready even if loading fails
      setIsReady(true);
      throw error;
    }
  }, [methods, isDraftMode, navigate]);

  // Load or create draft ID
  useEffect(() => {
    const initDraft = async () => {
      try {
        if (draftIdFromURL) {
          if (!isDraftMode) {
            setIsReady(true);
            return;
          }
          setDraftId(draftIdFromURL);
          await loadDraftData(draftIdFromURL);
        }
      } catch (error) {
        console.error('❌ Failed to initialize draft:', error);
      } finally {
        setIsReady(true);
      }
    };

    initDraft();
  }, [draftIdFromURL, isDraftMode]);

  // Fixed: Make exitSaveDraft properly async
  // const exitSaveDraft = async () => {
  //   console.log("🚀 exitSaveDraft called - waiting for save to complete");
    
  //   if (!draftId) {
  //     console.log("📝 No draftId, creating new draft");
  //     await handleSubmit();
  //     return;
  //   }

  //   // Wait for the save to complete before returning
  //   await saveDraft();
  //   console.log("✅ exitSaveDraft completed successfully");
  // };

  // Fixed: Make saveDraft properly async
  const saveDraft = async (extraData: Record<string, any> = {}) => {
  // console.log("💾 saveDraft called with draftId:", draftId);
  
  try {
    console.log(extraData);
    
    if (!draftId) {
      // console.log("📝 No draftId in saveDraft, creating new draft");
      let res = await handleSubmit(extraData);
      return res; // ✅ This already returns
    }

    const formData = getValues();
    // console.log("💾 Saving draft with data:", formData);
    
    // console.log("📤 Sending PUT request to save draft...");
    
    const response = await api.put(`/draft/${draftId}`, {
      data: JSON.stringify({
        ...formData
      }),
      last_page: extraData.last_page || formType,
      invoice_number: formData.invoice?.invoice_number || "",
    });
    
    // console.log("✅ Draft updated successfully:", response.data);
    
    toast({
      title: "Draft Saved",
      description: "Your draft has been saved successfully.",
      variant: "default"
    });
    
    // ✅ Return the response or success indicator
    return response.data; // or return "success" or return response
    
  } catch (error) {
    console.error("❌ Failed to save draft:", error);
    
    toast({
      title: "Draft Failed to Save",
      description: "❌ Failed to save draft",
      variant: "destructive"
    });
    
    throw error; // ✅ This is correct - throw error so caller can catch it
  }
};


  // Fixed: Make handleSubmit properly async
  const handleSubmit = async (extraData) => {
    const data = getValues();
    console.log("📤 Submitting form data:", data);
    
    try {
      const res = await api.post("/draft", {
        data: JSON.stringify({ ...data }),
        last_page: extraData.last_page || formType,
        invoice_number: data.invoice?.invoice_number || "",
      });

      const newId = res.data.id;
      console.log("✅ New draft created with ID:", newId);
      toast({
        title: "Draft Saved",
        description: "Your draft has been saved successfully.",
        variant: "success"})
      setDraftId(newId);
      return  res.data;
    } catch (error) {
      console.error("❌ Failed to create draft:", error);
      toast({
        title: "Draft Failed to Save",
        description: "❌ Failed to save draft",
        variant: "destructive"})
      throw error;
    }
  };

  return {
    methods,
    draftId,
    isReady,
    handleSubmit,
    hydrated,
    isDraftMode,
    // exitSaveDraft,
    saveDraft,
  };
};

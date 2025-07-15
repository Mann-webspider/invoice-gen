import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "@/lib/axios";
import debounce from 'lodash.debounce';
import { log } from 'console';

interface UseDraftFormOptions {
  formType: string; // e.g., 'invoice', 'order'
  methods: any;
}

export const useDraftForm = ({ formType ,methods}: UseDraftFormOptions) => {
  const { id: draftIdFromURL } = useParams();
  const navigate = useNavigate();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
//   const methods = useForm();
const [hydrated, setHydrated] = useState(false);

  const { reset, watch ,getValues} = methods;
  const DRAFT_KEY = `${formType}_draft_id`;

  // Load or create draft ID
  useEffect(() => {
    const initDraft = async () => {
      const localDraft = localStorage.getItem(DRAFT_KEY);
      let isUrl = window.location.href.includes('/drafts/');
      // console.log("🔗 Local draft ID:", isUrl);
      try {
        if (draftIdFromURL) {
          // console.log("🔗 Draft ID from URL:", draftIdFromURL);
          setDraftId(draftIdFromURL);
          await loadDraftData(draftIdFromURL);
        } else if (localDraft && isUrl) {
          // console.log("🔗 Using local draft ID:", localDraft);
          setDraftId(localDraft);
          await loadDraftData(localDraft);
        } else {
          const res = await api
        .post('/draft',{
          data:"",
          last_page:"invoice"
        }) ;
          const newId = res.data.id;
          setDraftId(newId);
          localStorage.setItem(DRAFT_KEY, newId);
        }
      } finally {
        setIsReady(true);
      }
    };

    initDraft();
  }, [draftIdFromURL]);

  // Load data from backend
  const loadDraftData = async (id: string) => {
  const res = await api.get(`/draft/${id}`);
  const parsed = JSON.parse(res.data?.data);
  console.log("✅ Loaded draft data:", parsed);
  if (parsed) {
    reset(parsed);
    setHydrated(true); // ✅ trigger hydration complete
  }
};

  // Auto-save
  useEffect(() => {
  if (!draftId || !hydrated) return;

  const debouncedSave = debounce((data) => {
    
    console.log("✅ Auto-saving:", data);

    api
      .put(`/draft/${draftId}`, {
        data: data,
        last_page: formType,
      })
      .catch(console.error);
  }, 1500);

  const subscription = watch(() => {
    console.log("🔄 Form changed, triggering auto-save");
    const data = getValues();
    debouncedSave(data);
  });

  return () => subscription.unsubscribe();
}, [draftId, hydrated, methods]);
  // Submit handler (you can use your own too)
  const handleSubmit = async (data: any, submitUrl: string, redirectUrl: string) => {
    await api.post(submitUrl, {
      draft_id: draftId,
      data,
    });
    localStorage.removeItem(DRAFT_KEY);
    navigate(redirectUrl);
  };

  return {
    methods,
    draftId,
    isReady,
    handleSubmit,
    hydrated
  };
};

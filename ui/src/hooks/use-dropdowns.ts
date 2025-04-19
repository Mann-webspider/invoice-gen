// import { useQueryTemplate } from './use-query-template';
// import api from '@/lib/axios';
// import { AllDropdownsResponse } from '@/types/dropdowns';

import { useEffect, useState } from "react";

// export  function useDropdowns() {
//   const { data, isLoading, isError, error } = useQueryTemplate<AllDropdownsResponse>({
//     queryKey: ['all-dropdowns'],
//     queryFn: async () => {
//       const response = await api.get('/all-dropdowns');
//       return response.data;
//     },
//   });

//   return {
//     dropdowns:  data?.data ,
//     isLoading,
//     isError,
//     error,
//   };
// } 


const useDropdowns = () => {
  const [dropdowns, setDropdowns] = useState(null); // or {}
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/all-dropdowns');
        const data = await res.json();
        setDropdowns(data.data);
      } catch (err) {
        setIsError(true);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdowns();
  }, []);

  return { dropdowns, isLoading, isError, error };
};
export {useDropdowns};

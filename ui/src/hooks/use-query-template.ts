import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

interface QueryTemplateProps<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
}

export function useQueryTemplate<T>({
  queryKey,
  queryFn,
  enabled = true,
}: QueryTemplateProps<T>): {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: AxiosError | null;
  refetch: () => Promise<UseQueryResult<T, AxiosError>>;
} {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<T, AxiosError>({
    queryKey,
    queryFn,
    enabled,
  });

  return {
    data,
    isLoading,
    isError,
    error: error as AxiosError | null,
    refetch,
  };
} 
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';

interface ErrorResponse {
  message?: string;
}

interface QueryStateHandlerProps {
  isLoading: boolean;
  isError: boolean;
  error: AxiosError<ErrorResponse> | null;
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
}

export function QueryStateHandler({
  isLoading,
  isError,
  error,
  children,
  loadingComponent,
  errorComponent,
}: QueryStateHandlerProps) {
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return errorComponent || (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4 text-center">
        <h3 className="text-lg font-semibold text-destructive">Error</h3>
        <p className="text-sm text-muted-foreground">
          {error?.response?.data?.message || error?.message || 'Something went wrong'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
} 
import { useQueryTemplate } from '@/hooks/use-query-template';
import { QueryStateHandler } from '@/components/query-state-handler';
import api from '@/lib/axios';

interface ExampleData {
  id: number;
  name: string;
}

export function ExamplePage() {
  const { data, isLoading, isError, error } = useQueryTemplate<ExampleData[]>({
    queryKey: ['examples'],
    queryFn: async () => {
      const response = await api.get('/api/examples');
      return response.data;
    },
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Example Page</h1>
      
      <QueryStateHandler
        isLoading={isLoading}
        isError={isError}
        error={error}
      >
        <div className="grid gap-4">
          {data?.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{item.name}</h2>
            </div>
          ))}
        </div>
      </QueryStateHandler>
    </div>
  );
} 
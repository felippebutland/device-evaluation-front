import { useState, useEffect, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null
  });

  const execute = useCallback(async (): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState({ data: null, loading: false, error: errorMessage });
      onError?.(errorMessage);
      return null;
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    ...state,
    execute,
    refetch
  };
}

// Hook for mutations (POST, PUT, DELETE)
export function useMutation<T, P = any>(
  mutationFn: (params: P) => Promise<T>,
  options: UseApiOptions = {}
) {
  const { onSuccess, onError } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await mutationFn(params);
      setState({ data: result, loading: false, error: null });
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState({ data: null, loading: false, error: errorMessage });
      onError?.(errorMessage);
      throw error;
    }
  }, [mutationFn, onSuccess, onError]);

  return {
    ...state,
    mutate
  };
}

// Hook for paginated data
export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<{ data: T[]; meta: any }>,
  limit = 10
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [meta, setMeta] = useState<any>(null);

  const { data, loading, error, refetch } = useApi(
    () => apiCall(currentPage, limit),
    [currentPage, limit],
    {
      onSuccess: (result) => {
        if (currentPage === 1) {
          setAllData(result.data);
        } else {
          setAllData(prev => [...prev, ...result.data]);
        }
        setMeta(result.meta);
      }
    }
  );

  const loadMore = useCallback(() => {
    if (meta && currentPage < meta.pages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [meta, currentPage]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    setAllData([]);
    refetch();
  }, [refetch]);

  return {
    data: allData,
    loading,
    error,
    meta,
    loadMore,
    refresh,
    hasMore: meta ? currentPage < meta.pages : false
  };
}

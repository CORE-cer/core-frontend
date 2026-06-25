import type { QueryId, QueryIdToQueryInfoMap, StreamInfo } from '@/types';
import { getQueryInfos, getStreamsInfo, inactivateQuery } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';

export const useQueryManager = () => {
  const { data: queries = new Map() as QueryIdToQueryInfoMap } = useQuery({
    queryKey: ['queries'],
    queryFn: getQueryInfos,
    refetchInterval: 1000,
  });

  const { data: streamsInfo = [] as StreamInfo[] } = useQuery({
    queryKey: ['streams'],
    queryFn: getStreamsInfo,
    refetchInterval: 1000,
  });

  const handleInactivateQuery = (qid: QueryId) => {
    inactivateQuery({ queryId: qid })
      .then(() => enqueueSnackbar('Query inactivated successfully', { variant: 'success' }))
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        enqueueSnackbar(`Error inactivating query: ${errorMessage}`, { variant: 'error' });
      });
  };

  return {
    queries,
    streamsInfo,
    handleInactivateQuery,
  };
};

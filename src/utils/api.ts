import type { QueryId, QueryIdToQueryInfoMap, QueryInfo, StreamId, StreamInfo } from '@/types';
import { CreateQuerySchema, GetQueryInfoSchema } from '@/schemas/querySchema';
import { GetStreamInfoSchema } from '@/schemas/streamInfoSchema';

function getApiBaseUrl(): string {
  const baseUrl: unknown = import.meta.env.VITE_API_URL;
  if (baseUrl) {
    return baseUrl as string;
  }
  throw new Error('VITE_API_URL is not defined in environment variables');
}

export function getWsBaseUrl(): string {
  const httpUrl = getApiBaseUrl();
  return httpUrl.replace(/^http/, 'ws');
}

export async function getQueryInfos(): Promise<QueryIdToQueryInfoMap> {
  const baseUrl = getApiBaseUrl();
  const fetchRes = await fetch(baseUrl + '/query', {
    method: 'GET',
  });
  const queriesUntyped: unknown = await fetchRes.json();

  const queriesParse = GetQueryInfoSchema.array().safeParse(queriesUntyped);

  if (!queriesParse.success) {
    throw new Error('Failed to parse query info: ' + queriesParse.error.message);
  }

  const queries = queriesParse.data;

  const activeQueryInfos = queries.filter((query) => query.active && query.query_id !== null);
  const res: QueryIdToQueryInfoMap = new Map();
  for (const getQueryInfo of activeQueryInfos) {
    const queryId = getQueryInfo.query_id as QueryId;
    const queryInfo: QueryInfo = {
      ...getQueryInfo,
      queryId,
    };
    res.set(queryId, queryInfo);
  }
  return res;
}

export async function getStreamsInfo(): Promise<StreamInfo[]> {
  const baseUrl = getApiBaseUrl();
  const fetchRes = await fetch(baseUrl + '/stream', {
    method: 'GET',
  });
  const streamsInfoUntyped: unknown = await fetchRes.json();

  const streamsInfoParse = GetStreamInfoSchema.array().safeParse(streamsInfoUntyped);

  if (!streamsInfoParse.success) {
    throw new Error('Failed to parse streams info: ' + streamsInfoParse.error.message);
  }

  const getStreamsInfo = streamsInfoParse.data;

  const streamsInfo: StreamInfo[] = getStreamsInfo.map((streamInfo) => ({
    ...streamInfo,
    streamId: streamInfo.id as StreamId,
  }));

  return streamsInfo;
}

export async function inactivateQuery({ queryId }: { queryId: QueryId }): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const fetchRes = await fetch(baseUrl + '/query/' + queryId.toString(), {
    method: 'DELETE',
  });
  if (!fetchRes.ok) {
    throw new Error('Failed to inactivate query');
  }
  console.info('Successfully inactivated query', queryId);
}

export const addQuery = async ({ query, queryName }: { query: string; queryName: string }): Promise<void> => {
  const createQueryParse = CreateQuerySchema.safeParse({
    query,
    query_name: queryName,
  });

  if (!createQueryParse.success) {
    throw new Error('Failed to create new query due to error: ' + createQueryParse.error.message);
  }

  const baseUrl = getApiBaseUrl();
  const res = await fetch(baseUrl + '/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createQueryParse.data),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
};

import type { QueryId, QueryIdToQueryWebSocketMap } from '@/types';
import { getWsBaseUrl } from '@/utils/api';
import { useEffect, useRef, useState } from 'react';

export function useWebSocketConnections(selectedQueryIds: Set<QueryId>) {
  const [connections, setConnections] = useState<QueryIdToQueryWebSocketMap>(new Map());
  const connectionsRef = useRef<QueryIdToQueryWebSocketMap>(connections);

  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  useEffect(() => {
    setConnections((prev) => {
      const next: QueryIdToQueryWebSocketMap = new Map();
      const baseUrl = getWsBaseUrl();

      for (const [queryId, ws] of prev) {
        if (selectedQueryIds.has(queryId)) {
          next.set(queryId, ws);
        } else {
          console.info('Closing connection for queryId', queryId);
          ws.close();
        }
      }

      for (const queryId of selectedQueryIds) {
        if (!next.has(queryId)) {
          const ws = new WebSocket(baseUrl + '/ws/' + queryId.toString());
          next.set(queryId, ws);
          ws.onopen = () => {
            console.info('Connected to queryId', queryId);
          };
          ws.onerror = () => {
            console.error('Error on queryId', queryId);
          };
        }
      }

      return next;
    });
  }, [selectedQueryIds]);

  useEffect(() => {
    return () => {
      console.info('Disconnecting from all websockets...');
      for (const ws of connectionsRef.current.values()) {
        ws.close();
      }
    };
  }, []);

  return connections;
}

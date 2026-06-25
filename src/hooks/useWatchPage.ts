import type { QueryId, ViewMode } from '@/types';
import { useEffect, useState } from 'react';

import { useEventBuffer } from './useEventBuffer';
import { useQueryManager } from './useQueryManager';
import { useQueryStats } from './useQueryStats';
import { useTimelineManager } from './useTimelineManager';
import { useWebSocketConnections } from './useWebSocketConnections';
import { useWebSocketMessages } from './useWebSocketMessages';

export function useWatchPage() {
  const [selectedQueryIds, setSelectedQueryIds] = useState<Set<QueryId>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [eventInterval, setEventInterval] = useState<number>(0);

  const { queries, streamsInfo, handleInactivateQuery } = useQueryManager();

  const connections = useWebSocketConnections(selectedQueryIds);
  const { data: rawData, hitCountsRef, clearData: clearRawData } = useWebSocketMessages(connections, queries, streamsInfo);
  const data = useEventBuffer(rawData, eventInterval, selectedQueryIds);
  const { queryIdToQueryStat, clearStats } = useQueryStats(connections, hitCountsRef);

  const { timelineConfig, updateTimeHorizon, getAllActiveQueryEvents } = useTimelineManager(data, selectedQueryIds);

  useEffect(() => {
    setSelectedQueryIds((prev) => {
      let changed = false;
      for (const qid of prev) {
        if (!queries.has(qid)) {
          changed = true;
          break;
        }
      }
      if (!changed) return prev;

      const next = new Set(prev);
      for (const qid of prev) {
        if (!queries.has(qid)) {
          next.delete(qid);
        }
      }
      return next;
    });
  }, [queries]);

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newValue: ViewMode) => {
    setViewMode(newValue);
  };

  const clearData = () => {
    clearRawData();
    clearStats();
  };

  return {
    queries,
    streamsInfo,
    selectedQueryIds,
    setSelectedQueryIds,
    data,
    queryIdToQueryStat,
    viewMode,
    eventInterval,
    setEventInterval,
    handleViewModeChange,
    handleInactivateQuery,
    timelineConfig,
    updateTimeHorizon,
    getAllActiveQueryEvents,
    clearData,
  };
}

import type { DataItem, QueryId, TimelineEvent } from "@/types";
import { useCallback, useRef, useState } from "react";

const MAX_EVENTS_PER_QUERY = 10000;

export function useTimelineManager(
  data: DataItem[],
  selectedQueryIds: Set<QueryId>,
) {
  const eventsRef = useRef<Map<QueryId, TimelineEvent[]>>(new Map());
  const processedLengthRef = useRef(0);
  const eventCounterRef = useRef(0);
  const timeHorizonRef = useRef(10);
  const [timeHorizonSeconds, setTimeHorizonSeconds] = useState(10);

  // Reset when data is cleared
  if (data.length < processedLengthRef.current) {
    processedLengthRef.current = 0;
    eventsRef.current.clear();
  }

  // Process new items synchronously during render
  const newItems = data.slice(processedLengthRef.current);
  processedLengthRef.current = data.length;

  for (const item of newItems) {
    if (!selectedQueryIds.has(item.qid)) continue;

    let queryEvents = eventsRef.current.get(item.qid);
    if (!queryEvents) {
      queryEvents = [];
      eventsRef.current.set(item.qid, queryEvents);
    }

    for (const complexEvent of item.data.complexEvents) {
      queryEvents.push({
        id: `ev-${(eventCounterRef.current++).toString()}`,
        queryId: item.qid,
        receivedAt: new Date(),
        data: complexEvent,
      });
    }

    if (queryEvents.length > MAX_EVENTS_PER_QUERY) {
      queryEvents.splice(0, queryEvents.length - MAX_EVENTS_PER_QUERY);
    }
  }

  // Clean up unselected queries
  for (const qid of eventsRef.current.keys()) {
    if (!selectedQueryIds.has(qid)) {
      eventsRef.current.delete(qid);
    }
  }

  const getActiveEvents = useCallback((queryId: QueryId): TimelineEvent[] => {
    const events = eventsRef.current.get(queryId) ?? [];
    const cutoff = Date.now() - timeHorizonRef.current * 1000;
    return events.filter((e) => e.receivedAt.getTime() >= cutoff);
  }, []);

  const getAllActiveQueryEvents = useCallback((): Map<
    QueryId,
    TimelineEvent[]
  > => {
    const result = new Map<QueryId, TimelineEvent[]>();
    for (const qid of selectedQueryIds) {
      const events = getActiveEvents(qid);
      if (events.length > 0) {
        result.set(qid, events);
      }
    }
    return result;
  }, [selectedQueryIds, getActiveEvents]);

  const updateTimeHorizon = useCallback((seconds: number) => {
    timeHorizonRef.current = seconds;
    setTimeHorizonSeconds(seconds);
  }, []);

  return {
    timelineConfig: {
      timeHorizonSeconds,
      maxEventsPerQuery: MAX_EVENTS_PER_QUERY,
    },
    updateTimeHorizon,
    getAllActiveQueryEvents,
    getActiveEvents,
  };
}

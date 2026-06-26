import type { DataItem, QueryId } from "@/types";
import { useEffect, useRef, useState } from "react";

export function useEventBuffer(
  rawData: DataItem[],
  eventInterval: number,
  selectedQueryIds: Set<QueryId>,
) {
  const [bufferedData, setBufferedData] = useState<DataItem[]>([]);
  const bufferRef = useRef<DataItem[]>([]);
  const lastRawLengthRef = useRef(0);

  useEffect(() => {
    const newItems = rawData.slice(lastRawLengthRef.current);
    lastRawLengthRef.current = rawData.length;

    if (eventInterval === 0) {
      if (newItems.length > 0) {
        setBufferedData((prev) => [...prev, ...newItems]);
      }
    } else {
      bufferRef.current.push(...newItems);
    }
  }, [rawData, eventInterval]);

  useEffect(() => {
    if (eventInterval === 0) return;

    const interval = setInterval(() => {
      const next = bufferRef.current.shift();
      if (next && selectedQueryIds.has(next.qid)) {
        setBufferedData((prev) => [...prev, next]);
      }
    }, eventInterval);

    return () => {
      clearInterval(interval);
    };
  }, [eventInterval, selectedQueryIds]);

  useEffect(() => {
    if (rawData.length === 0) {
      setBufferedData([]);
      bufferRef.current = [];
      lastRawLengthRef.current = 0;
    }
  }, [rawData.length]);

  return bufferedData;
}

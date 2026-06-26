import {
  ComplexEventSchema,
  type DataItem,
  type HitCount,
  type QueryId,
  type QueryIdToQueryInfoMap,
  type QueryIdToQueryWebSocketMap,
  type StreamInfo,
} from "@/types";
import { formatHit } from "@/utils/formatHit";
import { useEffect, useRef, useState } from "react";

export function useWebSocketMessages(
  connections: QueryIdToQueryWebSocketMap,
  queryIdToQueryInfoMap: QueryIdToQueryInfoMap,
  streamsInfo: StreamInfo[],
) {
  const [data, setData] = useState<DataItem[]>([]);
  const hitCountsRef = useRef<Map<QueryId, HitCount>>(new Map());

  useEffect(() => {
    for (const [qid, ws] of connections.entries()) {
      if (!hitCountsRef.current.has(qid)) {
        hitCountsRef.current.set(qid, { numHits: 0, numComplexEvents: 0 });
      }

      ws.onmessage = (event) => {
        const queryInfo = queryIdToQueryInfoMap.get(qid);
        if (!queryInfo || typeof event.data !== "string") return;

        let transformedHits;
        try {
          const parsed = ComplexEventSchema.array().safeParse(
            JSON.parse(event.data),
          );
          if (!parsed.success) {
            console.error("Failed to parse complex event:", parsed.error);
            return;
          }
          transformedHits = formatHit(parsed.data, queryInfo, streamsInfo);
        } catch (error) {
          console.error("Failed to process websocket message:", error);
          return;
        }

        const counts = hitCountsRef.current.get(qid);
        if (counts) {
          counts.numHits += 1;
          counts.numComplexEvents += transformedHits.complexEvents.length;
        }

        setData((prev) => [...prev, { qid, data: transformedHits }]);
      };

      ws.onclose = () => {
        console.info("Disconnected from queryId", qid);
        hitCountsRef.current.delete(qid);
      };
    }

    for (const qid of hitCountsRef.current.keys()) {
      if (!connections.has(qid)) {
        hitCountsRef.current.delete(qid);
      }
    }
  }, [connections, queryIdToQueryInfoMap, streamsInfo]);

  const clearData = () => {
    setData([]);
    for (const [qid] of hitCountsRef.current) {
      hitCountsRef.current.set(qid, { numHits: 0, numComplexEvents: 0 });
    }
  };

  return { data, hitCountsRef, clearData };
}

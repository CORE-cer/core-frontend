import type {
  HitCount,
  QueryId,
  QueryIdToQueryStatMap,
  QueryIdToQueryWebSocketMap,
} from "@/types";
import { type RefObject, useEffect, useState } from "react";

export function useQueryStats(
  connections: QueryIdToQueryWebSocketMap,
  hitCountsRef: RefObject<Map<QueryId, HitCount>>,
) {
  const [queryIdToQueryStat, setQueryIdToQueryStat] =
    useState<QueryIdToQueryStatMap>(new Map());

  useEffect(() => {
    setQueryIdToQueryStat((prev) => {
      const next = new Map(prev);
      for (const qid of connections.keys()) {
        if (!next.has(qid)) {
          next.set(qid, {
            perSec: [],
            hitStats: { max: 0, total: 0 },
            complexEventStats: { max: 0, total: 0 },
          });
        }
      }
      for (const qid of next.keys()) {
        if (!connections.has(qid)) {
          next.delete(qid);
        }
      }
      return next;
    });
  }, [connections]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hitCountsRef.current.size === 0) return;

      const currentCounts = new Map(hitCountsRef.current);

      for (const queryId of currentCounts.keys()) {
        hitCountsRef.current.set(queryId, { numHits: 0, numComplexEvents: 0 });
      }

      setQueryIdToQueryStat((prev) => {
        const next = new Map(prev);
        const time = new Date();
        for (const qid of next.keys()) {
          const curr = next.get(qid);
          const counts = currentCounts.get(qid);
          if (!curr || !counts) continue;

          curr.perSec.push({ ...counts, time });
          curr.hitStats.total += counts.numHits;
          curr.complexEventStats.total += counts.numComplexEvents;
          curr.hitStats.max = Math.max(curr.hitStats.max, counts.numHits);
          curr.complexEventStats.max = Math.max(
            curr.complexEventStats.max,
            counts.numComplexEvents,
          );
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [hitCountsRef]);

  const clearStats = () => {
    setQueryIdToQueryStat((prev) => {
      const next = new Map(prev);
      for (const [qid] of next) {
        next.set(qid, {
          perSec: [],
          hitStats: { max: 0, total: 0 },
          complexEventStats: { max: 0, total: 0 },
        });
      }
      return next;
    });
  };

  return { queryIdToQueryStat, clearStats };
}

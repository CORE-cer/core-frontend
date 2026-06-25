import { getQueryColor } from '@/colors';
import type { QueryIdToQueryInfoMap, QueryIdToQueryStatMap } from '@/types';
import { useMemo } from 'react';

type ChartCommon = {
  colors: string[];
  labels: string[];
};

type DonutSeries = {
  totalHits: number[];
  totalComplexEvents: number[];
};

type LineSeries = {
  hitsPerSec: { name: string; data: { x: Date; y: number }[] }[];
  complexEventsPerSec: { name: string; data: { x: Date; y: number }[] }[];
};

export function useChartData(qid2Stats: QueryIdToQueryStatMap, queries: QueryIdToQueryInfoMap) {
  const common = useMemo<ChartCommon>(() => {
    const res: ChartCommon = { colors: [], labels: [] };
    for (const qid of qid2Stats.keys()) {
      const queryInfo = queries.get(qid);
      if (!queryInfo) continue;
      res.colors.push(getQueryColor(Number(qid)));
      res.labels.push(queryInfo.query_name);
    }
    return res;
  }, [qid2Stats, queries]);

  const donutSeries = useMemo<DonutSeries>(() => {
    const res: DonutSeries = { totalHits: [], totalComplexEvents: [] };
    for (const queryStats of qid2Stats.values()) {
      res.totalHits.push(queryStats.hitStats.total);
      res.totalComplexEvents.push(queryStats.complexEventStats.total);
    }
    return res;
  }, [qid2Stats]);

  const lineSeries = useMemo<LineSeries>(() => {
    const res: LineSeries = { hitsPerSec: [], complexEventsPerSec: [] };
    for (const [queryId, queryStats] of qid2Stats.entries()) {
      const queryInfo = queries.get(queryId);
      if (!queryInfo) continue;
      res.hitsPerSec.push({
        name: queryInfo.query_name,
        data: queryStats.perSec.map((s) => ({ x: s.time, y: s.numHits })),
      });
      res.complexEventsPerSec.push({
        name: queryInfo.query_name,
        data: queryStats.perSec.map((s) => ({ x: s.time, y: s.numComplexEvents })),
      });
    }
    return res;
  }, [qid2Stats, queries]);

  return { common, donutSeries, lineSeries };
}

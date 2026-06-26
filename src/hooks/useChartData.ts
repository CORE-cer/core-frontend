import { getQueryColor } from "@/colors";
import type { QueryIdToQueryInfoMap, QueryIdToQueryStatMap } from "@/types";
import { useMemo } from "react";

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

export function useChartData(
  qid2Stats: QueryIdToQueryStatMap,
  queries: QueryIdToQueryInfoMap,
) {
  const chartEntries = useMemo(
    () =>
      Array.from(qid2Stats.entries()).flatMap(([queryId, queryStats]) => {
        const queryInfo = queries.get(queryId);
        return queryInfo ? [{ queryId, queryInfo, queryStats }] : [];
      }),
    [qid2Stats, queries],
  );

  const common = useMemo<ChartCommon>(() => {
    const res: ChartCommon = { colors: [], labels: [] };
    for (const { queryId, queryInfo } of chartEntries) {
      res.colors.push(getQueryColor(Number(queryId)));
      res.labels.push(queryInfo.query_name);
    }
    return res;
  }, [chartEntries]);

  const donutSeries = useMemo<DonutSeries>(() => {
    const res: DonutSeries = { totalHits: [], totalComplexEvents: [] };
    for (const { queryStats } of chartEntries) {
      res.totalHits.push(queryStats.hitStats.total);
      res.totalComplexEvents.push(queryStats.complexEventStats.total);
    }
    return res;
  }, [chartEntries]);

  const lineSeries = useMemo<LineSeries>(() => {
    const res: LineSeries = { hitsPerSec: [], complexEventsPerSec: [] };
    for (const { queryInfo, queryStats } of chartEntries) {
      res.hitsPerSec.push({
        name: queryInfo.query_name,
        data: queryStats.perSec.map((s) => ({ x: s.time, y: s.numHits })),
      });
      res.complexEventsPerSec.push({
        name: queryInfo.query_name,
        data: queryStats.perSec.map((s) => ({
          x: s.time,
          y: s.numComplexEvents,
        })),
      });
    }
    return res;
  }, [chartEntries]);

  return { common, donutSeries, lineSeries };
}

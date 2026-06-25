import { useChartData } from '@/hooks/useChartData';
import type { QueryIdToQueryInfoMap, QueryIdToQueryStatMap } from '@/types';
import { Box } from '@mui/material';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import DonutChart from './DonutChart';
import DraggableChart from './DraggableChart';
import LineChart from './LineChart';
import ResponsiveChartWrapper from './ResponsiveChartWrapper';

type ChartsProps = {
  qid2Stats: QueryIdToQueryStatMap;
  queries: QueryIdToQueryInfoMap;
};

type ChartId = 'hits-per-sec' | 'complex-events-per-sec' | 'total-hits' | 'total-complex-events';

type ChartItem = {
  id: ChartId;
  title: string;
  component: React.ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
};

const INITIAL_POSITIONS: Record<ChartId, { position: { x: number; y: number }; size: { width: number; height: number } }> = {
  'hits-per-sec': { position: { x: 20, y: 20 }, size: { width: 400, height: 300 } },
  'complex-events-per-sec': { position: { x: 440, y: 20 }, size: { width: 400, height: 300 } },
  'total-hits': { position: { x: 20, y: 400 }, size: { width: 400, height: 300 } },
  'total-complex-events': { position: { x: 440, y: 400 }, size: { width: 400, height: 300 } },
};

const CHART_TITLES: Record<ChartId, string> = {
  'hits-per-sec': 'Hits per sec',
  'complex-events-per-sec': 'Complex events per sec',
  'total-hits': 'Total hits',
  'total-complex-events': 'Total Complex Events',
};

const ChartsFreeform: React.FC<ChartsProps> = ({ qid2Stats, queries }) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const justResizedRefs = useRef<Record<string, RefObject<boolean>>>({});

  const getJustResizedRef = (chartId: string) => {
    justResizedRefs.current[chartId] = { current: false };
    return justResizedRefs.current[chartId];
  };

  const { common, donutSeries, lineSeries } = useChartData(qid2Stats, queries);

  const chartComponents = useMemo<Record<ChartId, React.ReactNode>>(
    () => ({
      'hits-per-sec': (
        <ResponsiveChartWrapper>
          <LineChart series={lineSeries.hitsPerSec} colors={common.colors} />
        </ResponsiveChartWrapper>
      ),
      'complex-events-per-sec': (
        <ResponsiveChartWrapper>
          <LineChart series={lineSeries.complexEventsPerSec} colors={common.colors} />
        </ResponsiveChartWrapper>
      ),
      'total-hits': (
        <ResponsiveChartWrapper>
          <DonutChart series={donutSeries.totalHits} labels={common.labels} colors={common.colors} />
        </ResponsiveChartWrapper>
      ),
      'total-complex-events': (
        <ResponsiveChartWrapper>
          <DonutChart series={donutSeries.totalComplexEvents} labels={common.labels} colors={common.colors} />
        </ResponsiveChartWrapper>
      ),
    }),
    [lineSeries, donutSeries, common]
  );

  const initialCharts = useMemo<ChartItem[]>(
    () =>
      (Object.keys(INITIAL_POSITIONS) as ChartId[]).map((id) => ({
        id,
        title: CHART_TITLES[id],
        component: chartComponents[id],
        ...INITIAL_POSITIONS[id],
      })),
    // Only run once on mount — positions are seeded from constants
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [charts, setCharts] = useState<ChartItem[]>(initialCharts);

  // Update chart components when data changes, but preserve user's drag/resize state
  useEffect(() => {
    setCharts((prevCharts) =>
      prevCharts.map((chart) => ({
        ...chart,
        component: chartComponents[chart.id],
      }))
    );
  }, [chartComponents]);

  const handleDragEnd = (id: string, newPosition: { x: number; y: number }) => {
    setCharts((prevCharts) => prevCharts.map((chart) => (chart.id === id ? { ...chart, position: newPosition } : chart)));
  };

  const handleResize = (id: string, newSize: { width: number; height: number }) => {
    setCharts((prevCharts) => prevCharts.map((chart) => (chart.id === id ? { ...chart, size: newSize } : chart)));
  };

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragStop = () => {
    setDraggingId(null);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {charts.map((chart) => (
        <DraggableChart
          key={chart.id}
          id={chart.id}
          title={chart.title}
          position={chart.position}
          size={chart.size}
          onDragEnd={handleDragEnd}
          onResize={handleResize}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
          isDragging={draggingId === chart.id}
          justResizedRef={getJustResizedRef(chart.id)}
        >
          {chart.component}
        </DraggableChart>
      ))}
    </Box>
  );
};

export default ChartsFreeform;

import { useChartData } from '@/hooks/useChartData';
import type { QueryIdToQueryInfoMap, QueryIdToQueryStatMap } from '@/types';
import { Box, Paper, Typography } from '@mui/material';
import { Reorder } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

import DonutChart from './DonutChart';
import LineChart from './LineChart';

type ChartsProps = {
  qid2Stats: QueryIdToQueryStatMap;
  queries: QueryIdToQueryInfoMap;
};

type ChartId = 'hits-per-sec' | 'complex-events-per-sec' | 'total-hits' | 'total-complex-events';

type ChartItem = {
  id: ChartId;
  title: string;
};

const INITIAL_ORDER: ChartItem[] = [
  { id: 'hits-per-sec', title: 'Hits per sec' },
  { id: 'complex-events-per-sec', title: 'Complex events per sec' },
  { id: 'total-hits', title: 'Total hits' },
  { id: 'total-complex-events', title: 'Total Complex Events' },
];

const Charts: React.FC<ChartsProps> = ({ qid2Stats, queries }) => {
  const { common, donutSeries, lineSeries } = useChartData(qid2Stats, queries);

  const [chartOrder, setChartOrder] = useState<ChartItem[]>(INITIAL_ORDER);

  // Keep chartOrder in sync with INITIAL_ORDER items (no-op here since items are stable,
  // but guards against any future dynamic chart sets)
  useEffect(() => {
    setChartOrder((prev) => {
      const prevIds = new Set(prev.map((c) => c.id));
      const allPresent = INITIAL_ORDER.every((c) => prevIds.has(c.id));
      return allPresent ? prev : INITIAL_ORDER;
    });
  }, []);

  const chartComponents = useMemo<Record<ChartId, React.ReactNode>>(
    () => ({
      'hits-per-sec': <LineChart series={lineSeries.hitsPerSec} colors={common.colors} />,
      'complex-events-per-sec': <LineChart series={lineSeries.complexEventsPerSec} colors={common.colors} />,
      'total-hits': <DonutChart series={donutSeries.totalHits} labels={common.labels} colors={common.colors} />,
      'total-complex-events': (
        <DonutChart series={donutSeries.totalComplexEvents} labels={common.labels} colors={common.colors} />
      ),
    }),
    [lineSeries, donutSeries, common]
  );

  return (
    <Box sx={{ p: 1 }}>
      <Reorder.Group
        axis="y"
        values={chartOrder}
        onReorder={setChartOrder}
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {chartOrder.map((chart) => (
          <Reorder.Item
            key={chart.id}
            value={chart}
            style={{
              marginBottom: '16px',
            }}
            whileDrag={{
              scale: 1.02,
              zIndex: 1000,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
            dragElastic={0.2}
          >
            <Paper
              sx={{
                p: 1,
                cursor: 'grab',
                '&:active': {
                  cursor: 'grabbing',
                },
                userSelect: 'none',
                width: '100%',
              }}
            >
              <Typography variant="h6" textAlign="center" sx={{ mb: 1 }}>
                {chart.title}
              </Typography>
              {chartComponents[chart.id]}
            </Paper>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </Box>
  );
};

export default Charts;

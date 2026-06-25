import { getQueryColor } from '@/colors';
import { useWatchPageContext } from '@/context/WatchPageContext';
import type { QueryId, QueryInfo, QueryStats } from '@/types';
import { Box, Divider, Grid2 as Grid, Paper, Typography } from '@mui/material';

type QueryStatProps = {
  query?: QueryInfo;
  qid: QueryId;
  stats: QueryStats;
};

function QueryStat({ query, qid, stats }: QueryStatProps) {
  const { perSec, hitStats, complexEventStats } = stats;

  if (!query) {
    return (
      <Paper sx={{ py: 2, px: 1, textAlign: 'center' }} elevation={2}>
        <Typography variant="h6">Query {qid} not found</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ py: 2, px: 1, textAlign: 'center' }} elevation={2}>
      <Box
        sx={{
          height: 16,
          marginX: -1,
          marginY: -2,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          mb: 1,
          backgroundColor: getQueryColor(Number(qid)),
        }}
      ></Box>
      <Typography sx={{ pb: 1 }} variant="h6">
        {query.query_name}
      </Typography>
      <Divider />
      {/* HITS */}
      <Grid container spacing={2} sx={{ pt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1">{'Hits'}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant="body1">{hitStats.total || 0}</Typography>
          <Typography variant="body2">{'total'}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant="body1">{perSec[perSec.length - 1]?.numHits || 0}</Typography>
          <Typography variant="body2">{'per sec'}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant="body1">{hitStats.max || 0}</Typography>
          <Typography variant="body2">{'max/sec'}</Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider />
        </Grid>

        {/* COMPLEX EVENTS */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1">{'Complex Events'}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant="body1">{complexEventStats.total || 0}</Typography>
          <Typography variant="body2">{'total'}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant="body1">{perSec[perSec.length - 1]?.numComplexEvents || 0}</Typography>
          <Typography variant="body2">{'per sec'}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Typography variant="body1">{complexEventStats.max || 0}</Typography>
          <Typography variant="body2">{'max/sec'}</Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default function Stats() {
  const { queryIdToQueryStat: queryIdToQueryStatMap, queries: queryIdToQueryInfoMap } = useWatchPageContext();
  return (
    <Grid container sx={{ p: 1 }} spacing={2}>
      {Array.from(queryIdToQueryStatMap, ([queryId, queryStats]) => (
        <Grid key={queryId} size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 3 }}>
          <QueryStat query={queryIdToQueryInfoMap.get(queryId)} qid={queryId} stats={queryStats} />{' '}
        </Grid>
      ))}
    </Grid>
  );
}

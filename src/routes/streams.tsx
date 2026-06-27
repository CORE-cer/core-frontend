import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getStreamStats,
  getQueryInfos,
  getStreamsInfo,
  getWsBaseUrl,
} from "@/utils/api";
import { getSchemaInfo, type FAQItem } from "@/data/faq";
import type { StreamInfo, StreamStats, StreamType } from "@/types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Container,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Fragment, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/streams")({
  component: StreamsPage,
});

function SummaryBar({
  stats,
  activeQueryCount,
}: {
  stats: StreamStats[];
  activeQueryCount: number;
}) {
  const liveCount = stats.filter((s) => s.status === "live").length;
  const totalEps = stats.reduce((sum, s) => sum + s.events_per_sec, 0);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        mb: 3,
      }}
    >
      {[
        { label: "Active Streams", value: liveCount, color: "success.main" },
        {
          label: "Total Events/sec",
          value: totalEps.toFixed(1),
          color: "info.main",
        },
        {
          label: "Active Queries",
          value: activeQueryCount,
          color: "text.primary",
        },
      ].map((item) => (
        <Paper
          key={item.label}
          sx={{
            flex: 1,
            py: 2,
            textAlign: "center",
          }}
          variant="outlined"
        >
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontSize: "0.65rem" }}
          >
            {item.label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: item.color }}>
            {item.value}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}

function formatLastEvent(secondsAgo: number | null): string {
  if (secondsAgo === null) return "Never";
  if (secondsAgo < 1) return "< 1s ago";
  if (secondsAgo < 60) return `${Math.round(secondsAgo)}s ago`;
  if (secondsAgo < 3600) return `${Math.round(secondsAgo / 60)}m ago`;
  return `${Math.round(secondsAgo / 3600)}h ago`;
}

function StatusChip({ status }: { status: StreamStats["status"] }) {
  const config = {
    live: { label: "Live", color: "success" as const },
    stale: { label: "Stale", color: "warning" as const },
    inactive: { label: "Inactive", color: "default" as const },
  };
  const { label, color } = config[status];
  return <Chip label={label} color={color} size="small" variant="outlined" />;
}

const VALUE_TYPE_NAMES: Record<number, string> = {
  0: "int",
  1: "double",
  2: "string",
  3: "bool",
};

function StreamSchema({ streamInfo }: { streamInfo: StreamInfo }) {
  return (
    <Box
      component="pre"
      sx={{
        fontFamily: '"Roboto Mono", monospace',
        fontSize: "0.7rem",
        bgcolor: "background.default",
        p: 1,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        overflow: "auto",
        maxHeight: 120,
        m: 0,
        lineHeight: 1.6,
      }}
    >
      {streamInfo.events_info.map((event, i) => (
        <Fragment key={event.id}>
          <Box component="span" sx={{ color: "success.main", fontWeight: 600 }}>
            {event.name}
          </Box>
          {" { "}
          {event.attributes_info.map((attr, j) => (
            <Fragment key={attr.name}>
              {attr.name}
              {": "}
              <Box component="span" sx={{ color: "info.main" }}>
                {VALUE_TYPE_NAMES[attr.value_type] ?? String(attr.value_type)}
              </Box>
              {j < event.attributes_info.length - 1 ? ", " : ""}
            </Fragment>
          ))}
          {" }"}
          {i < streamInfo.events_info.length - 1 ? "\n" : ""}
        </Fragment>
      ))}
    </Box>
  );
}

const MAX_EVENTS = 50;

type RawEvent = {
  event_type: string;
  attributes: (string | number | boolean)[];
};

function LiveEventFeed({ streamName }: { streamName: string }) {
  const [events, setEvents] = useState<RawEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = getWsBaseUrl() + "/stream/events/" + streamName;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (msg) => {
      const event = JSON.parse(msg.data as string) as RawEvent;
      setEvents((prev) => {
        const next = [event, ...prev];
        if (next.length > MAX_EVENTS) next.length = MAX_EVENTS;
        return next;
      });
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [streamName]);

  return (
    <Box
      sx={{
        maxHeight: 240,
        overflow: "auto",
        fontFamily: '"Roboto Mono", monospace',
        fontSize: "0.7rem",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.default",
      }}
    >
      {events.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ p: 2, textAlign: "center", fontFamily: "inherit" }}
        >
          Waiting for events...
        </Typography>
      ) : (
        events.map((event, i) => (
          <Box
            key={i}
            sx={{
              px: 1.5,
              py: 0.5,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              gap: 1,
              "&:last-child": { borderBottom: 0 },
            }}
          >
            <Chip
              label={event.event_type}
              size="small"
              variant="outlined"
              color="info"
              sx={{ fontFamily: "inherit", fontSize: "inherit", height: 20 }}
            />
            <Box
              component="span"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "text.secondary",
              }}
            >
              {event.attributes.join(", ")}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

function StreamDetailRow({
  stream,
  streamInfo,
}: {
  stream: StreamStats;
  streamInfo: StreamInfo | undefined;
}) {
  const streamType = stream.name.toLowerCase() as StreamType;
  const schemaInfo = getSchemaInfo(streamType);

  return (
    <TableRow>
      <TableCell colSpan={5} sx={{ py: 0, px: 0 }}>
        <Box sx={{ p: 2, bgcolor: "action.hover" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: schemaInfo ? "1fr 1fr" : "1fr",
              gap: 2,
              mb: 1,
            }}
          >
            {/* Left: About + Schema */}
            <Box>
              {schemaInfo && (
                <>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ mb: 1, display: "block" }}
                  >
                    About
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.5 }}>
                    {schemaInfo.description}
                  </Typography>
                </>
              )}
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                Event Schema
              </Typography>
              {streamInfo ? (
                <StreamSchema streamInfo={streamInfo} />
              ) : (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {stream.event_types.map((et) => (
                    <Chip key={et} label={et} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </Box>

            {/* Right: FAQ */}
            {schemaInfo && (
              <Box>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ mb: 1, display: "block" }}
                >
                  FAQ
                </Typography>
                {schemaInfo.faqs.map((item: FAQItem) => (
                  <Accordion
                    key={item.id}
                    disableGutters
                    sx={{
                      "&:before": { display: "none" },
                      "&.Mui-expanded": { margin: "0 0 4px 0" },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        "& .MuiAccordionSummary-content": {
                          alignItems: "center",
                          gap: 1,
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.question}
                      </Typography>
                      {item.category && (
                        <Chip
                          label={item.category}
                          size="small"
                          variant="outlined"
                          sx={{ ml: "auto" }}
                        />
                      )}
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {item.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 1 }} />
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            Live Events
          </Typography>
          <LiveEventFeed streamName={stream.name} />
        </Box>
      </TableCell>
    </TableRow>
  );
}

function StreamTable({
  stats,
  streamsInfo,
}: {
  stats: StreamStats[];
  streamsInfo: StreamInfo[];
}) {
  const [expandedStream, setExpandedStream] = useState<string | null>(null);

  const handleRowClick = (name: string) => {
    setExpandedStream((prev) => (prev === name ? null : name));
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Stream</TableCell>
            <TableCell align="right">Events/sec</TableCell>
            <TableCell align="right">Total Events</TableCell>
            <TableCell align="right">Last Event</TableCell>
            <TableCell align="center">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stats.map((stream) => (
            <Fragment key={stream.name}>
              <TableRow
                hover
                onClick={() => handleRowClick(stream.name)}
                sx={{
                  cursor: "pointer",
                  "& > *": {
                    borderBottom:
                      expandedStream === stream.name ? 0 : undefined,
                  },
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {expandedStream === stream.name ? "▾" : "▸"}{" "}
                    {stream.name.charAt(0).toUpperCase() + stream.name.slice(1)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "info.main" }}
                  >
                    {stream.events_per_sec}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {stream.total_events.toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  {formatLastEvent(stream.last_event_seconds_ago)}
                </TableCell>
                <TableCell align="center">
                  <StatusChip status={stream.status} />
                </TableCell>
              </TableRow>
              {expandedStream === stream.name && (
                <StreamDetailRow
                  stream={stream}
                  streamInfo={streamsInfo.find((si) =>
                    si.events_info.some((e) =>
                      stream.event_types.includes(e.name),
                    ),
                  )}
                />
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function StreamsPage() {
  const { data: stats = [] } = useQuery({
    queryKey: ["streamStats"],
    queryFn: getStreamStats,
    refetchInterval: 2000,
  });

  const { data: queries = new Map() } = useQuery({
    queryKey: ["queries"],
    queryFn: getQueryInfos,
    refetchInterval: 2000,
  });

  const { data: streamsInfo = [] } = useQuery({
    queryKey: ["streams"],
    queryFn: getStreamsInfo,
    refetchInterval: 10000,
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          py: 3,
        }}
      >
        <Container
          component="main"
          maxWidth="lg"
          sx={{
            overflow: "auto",
            flex: "1 1 auto",
            minHeight: 0,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ mb: 3, fontWeight: 500 }}
          >
            Streams
          </Typography>
          <SummaryBar stats={stats} activeQueryCount={queries.size} />
          <StreamTable stats={stats} streamsInfo={streamsInfo} />
        </Container>
      </Box>
    </Box>
  );
}

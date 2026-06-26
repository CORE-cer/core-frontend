import { useWatchPageContext } from "@/context/WatchPageContext";
import type { QueryId, TimelineEvent } from "@/types";
import { Box, Slider, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import TimelineEventComponent from "./TimelineEvent";

const MAX_VISIBLE_EVENTS_PER_QUERY = 2000;

export default function Timeline() {
  const {
    queries: queryIdToQueryInfoMap,
    selectedQueryIds,
    getAllActiveQueryEvents,
    timelineConfig,
    updateTimeHorizon: onTimeHorizonChange,
  } = useWatchPageContext();
  const timeHorizonSeconds = timelineConfig.timeHorizonSeconds;
  const [visibleEvents, setVisibleEvents] = useState<
    Map<QueryId, TimelineEvent[]>
  >(new Map());
  const containerRefsMap = useRef<Map<QueryId, HTMLDivElement | null>>(
    new Map(),
  );
  const rafRef = useRef<number | null>(null);
  const queryColorIndexRef = useRef<Map<QueryId, number>>(new Map());

  const getQueryColorIndex = useCallback((queryId: QueryId): number => {
    if (!queryColorIndexRef.current.has(queryId)) {
      queryColorIndexRef.current.set(queryId, queryColorIndexRef.current.size);
    }
    return queryColorIndexRef.current.get(queryId)!;
  }, []);

  const setContainerRef = useCallback(
    (queryId: QueryId, el: HTMLDivElement | null) => {
      containerRefsMap.current.set(queryId, el);
    },
    [],
  );

  useEffect(() => {
    let lastEventUpdate = 0;

    const tick = () => {
      const now = Date.now();
      const timeHorizonMs = timeHorizonSeconds * 1000;

      // Every ~200ms, refresh the event set (triggers React re-render only if changed)
      if (now - lastEventUpdate > 200) {
        lastEventUpdate = now;
        const activeEvents = getAllActiveQueryEvents();
        setVisibleEvents((prev) => {
          // Quick check if anything changed
          let changed = false;
          if (prev.size !== activeEvents.size) {
            changed = true;
          } else {
            for (const [qid, events] of activeEvents) {
              const prevEvents = prev.get(qid);
              if (
                !prevEvents ||
                prevEvents.length !== events.length ||
                prevEvents.at(-1)?.id !== events.at(-1)?.id
              ) {
                changed = true;
                break;
              }
            }
          }
          if (!changed) return prev;

          const next = new Map<QueryId, TimelineEvent[]>();
          for (const [qid, events] of activeEvents) {
            next.set(qid, events.slice(-MAX_VISIBLE_EVENTS_PER_QUERY));
          }
          return next;
        });
      }

      // Every frame, update dot positions via DOM manipulation (no React)
      for (const [, container] of containerRefsMap.current) {
        if (!container) continue;
        const dots =
          container.querySelectorAll<HTMLElement>("[data-received-at]");
        for (const dot of dots) {
          const receivedAt = Number(dot.dataset.receivedAt);
          const age = now - receivedAt;
          const pct = Math.min(100, (age / timeHorizonMs) * 100);
          dot.style.right = `${pct.toString()}%`;

          if (age > timeHorizonMs) {
            dot.style.display = "none";
          } else {
            dot.style.display = "";
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [timeHorizonSeconds, getAllActiveQueryEvents]);

  return (
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Timeline Visualization
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Time Horizon:
          </Typography>
          <Slider
            value={timeHorizonSeconds}
            onChange={(_, value) => {
              onTimeHorizonChange(value as number);
            }}
            min={1}
            max={60}
            step={1}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => `${value.toString()}s`}
            sx={{ flex: 1, maxWidth: 300 }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          Visible limit: {MAX_VISIBLE_EVENTS_PER_QUERY} per query | Active
          queries: {selectedQueryIds.size}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          position: "relative",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
          backgroundColor: "background.paper",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 30,
            borderBottom: 1,
            borderColor: "divider",
            backgroundColor: "background.default",
            display: "flex",
            alignItems: "center",
            px: 1,
          }}
        >
          <Typography variant="caption" sx={{ position: "absolute", right: 8 }}>
            Now
          </Typography>
          <Typography variant="caption" sx={{ position: "absolute", left: 8 }}>
            -{timeHorizonSeconds}s
          </Typography>
        </Box>

        <Box sx={{ mt: "30px", height: "calc(100% - 30px)", overflow: "auto" }}>
          {selectedQueryIds.size === 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "text.secondary",
              }}
            >
              <Typography variant="body2">
                Select queries from the left panel to see events on the timeline
              </Typography>
            </Box>
          ) : (
            Array.from(selectedQueryIds).map((queryId, index) => {
              const queryInfo = queryIdToQueryInfoMap.get(queryId);
              const queryEvents = visibleEvents.get(queryId) ?? [];
              const colorIndex = getQueryColorIndex(queryId);

              return (
                <Box
                  key={queryId}
                  sx={{
                    position: "relative",
                    height: 60,
                    borderBottom: index < selectedQueryIds.size - 1 ? 1 : 0,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      position: "absolute",
                      left: 8,
                      zIndex: 2,
                      backgroundColor: "background.paper",
                      px: 1,
                      borderRadius: 0.5,
                      maxWidth: 150,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Query {queryId}{" "}
                    {queryInfo?.query_name && `(${queryInfo.query_name})`}
                    {queryEvents.length > 0 && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ ml: 1, opacity: 0.7 }}
                      >
                        ({queryEvents.length})
                      </Typography>
                    )}
                  </Typography>

                  <Box
                    sx={{
                      position: "absolute",
                      left: 160,
                      right: 20,
                      height: 2,
                      backgroundColor: "divider",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />

                  <Box
                    ref={(el: HTMLDivElement | null) => {
                      setContainerRef(queryId, el);
                    }}
                    sx={{
                      position: "absolute",
                      left: 160,
                      right: 20,
                      height: "100%",
                      overflow: "hidden",
                      contain: "layout style paint",
                    }}
                  >
                    {queryEvents.map((event) => (
                      <TimelineEventComponent
                        key={event.id}
                        event={event}
                        queryIndex={colorIndex}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
}

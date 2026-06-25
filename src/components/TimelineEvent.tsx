import { getQueryColor } from '@/colors';
import type { TimelineEvent } from '@/types';
import { Box } from '@mui/material';
import { memo } from 'react';

type TimelineEventProps = {
  event: TimelineEvent;
  queryIndex: number;
};

function TimelineEventComponent({ event, queryIndex }: TimelineEventProps) {
  const color = getQueryColor(queryIndex);

  return (
    <Box
      data-event-id={event.id}
      data-received-at={event.receivedAt.getTime().toString()}
      title={`Query ${event.queryId.toString()} - Event at ${event.data.end.toLocaleTimeString()}`}
      sx={{
        position: 'absolute',
        width: 12,
        height: 12,
        backgroundColor: color,
        borderRadius: '50%',
        border: '2px solid',
        borderColor: 'background.paper',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1,
        cursor: 'pointer',
        willChange: 'right',
        '&:hover': {
          transform: 'translateY(-50%) scale(1.3)',
          zIndex: 2,
          boxShadow: '0 3px 6px rgba(0,0,0,0.25)',
        },
      }}
    />
  );
}

export default memo(TimelineEventComponent, (prev, next) => {
  return prev.event.id === next.event.id && prev.queryIndex === next.queryIndex;
});

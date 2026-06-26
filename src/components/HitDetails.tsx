import type { FormattedHit, FormattedMarkedComplexEvent } from "@/types";
import { formatTime } from "@/utils/formatTime";
import { Box, Divider, Paper, Typography } from "@mui/material";

type HitDetailsProps = {
  hit: FormattedHit;
  selectedComplexEvent?: FormattedMarkedComplexEvent;
};

const HitDetails: React.FC<HitDetailsProps> = ({
  hit,
  selectedComplexEvent,
}) => {
  return (
    <Box sx={{ height: "100%", overflow: "auto", p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Hit Details
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        End Time: {formatTime(hit.end)}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Total Complex Events: {hit.complexEvents.length}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Complex Events
      </Typography>

      {hit.complexEvents.map((event, index) => (
        <Paper
          key={index}
          sx={{
            p: 2,
            my: 1,
            backgroundColor:
              selectedComplexEvent === event
                ? "action.selected"
                : "background.paper",
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Time Range: {formatTime(event.start)} - {formatTime(event.end)}
          </Typography>

          {Object.entries(event.complexEvents).map(([variable, events]) => (
            <Box key={variable} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="primary">
                {variable}
              </Typography>
              {events.map((e, i) => (
                <Box key={i} sx={{ mt: 1, pl: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Event Type: {e.eventName}
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {Object.entries(e.attributes).map(([key, value]) => (
                      <Typography key={key} variant="body2">
                        {key}: {value}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        </Paper>
      ))}
    </Box>
  );
};

export default HitDetails;

import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function LoadingState({ title = "Loading files...", subtitle = "Please wait" }) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <CircularProgress size={20} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} variant="rounded" height={120} width="100%" />
        ))}
      </Stack>
    </Stack>
  );
}

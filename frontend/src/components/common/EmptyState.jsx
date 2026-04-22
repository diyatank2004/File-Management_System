import React from "react";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function EmptyState({ title, description }) {
  return (
    <Box
      sx={{
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 2,
        p: 4,
        textAlign: "center",
        bgcolor: "background.paper"
      }}
    >
      <InsertDriveFileOutlinedIcon color="disabled" sx={{ fontSize: 40 }} />
      <Typography variant="h6" sx={{ mt: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {description}
      </Typography>
    </Box>
  );
}

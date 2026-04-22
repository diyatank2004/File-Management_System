import React from "react";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import Box from "@mui/material/Box";

export default function FileTypeIcon({ type }) {
  let icon = <DescriptionOutlinedIcon />;
  let color = "#64748b";

  if (type === "pdf") {
    icon = <PictureAsPdfOutlinedIcon />;
    color = "#dc2626";
  } else if (type === "image") {
    icon = <ImageOutlinedIcon />;
    color = "#2563eb";
  } else if (type === "spreadsheet") {
    icon = <TableChartOutlinedIcon />;
    color = "#16a34a";
  } else if (type === "presentation") {
    icon = <SlideshowOutlinedIcon />;
    color = "#ea580c";
  } else if (type === "code") {
    icon = <CodeOutlinedIcon />;
    color = "#7c3aed";
  }

  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 1.5,
        display: "grid",
        placeItems: "center",
        bgcolor: `${color}1A`,
        color
      }}
    >
      {icon}
    </Box>
  );
}

import React from "react";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

const ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: <DashboardOutlinedIcon fontSize="small" /> },
  { key: "files", label: "Files", icon: <FolderOpenOutlinedIcon fontSize="small" /> },
  { key: "upload", label: "Upload", icon: <CloudUploadOutlinedIcon fontSize="small" /> },
  { key: "settings", label: "Settings", icon: <SettingsOutlinedIcon fontSize="small" /> }
];

export default function AppSidebar({ activeNav, onChangeNav }) {
  return (
    <Box sx={{ position: { md: "sticky" }, top: { md: 24 } }}>
      <Stack direction={{ xs: "row", md: "column" }} spacing={1} sx={{ overflowX: "auto" }}>
        {ITEMS.map((item) => (
          <Button
            key={item.key}
            startIcon={item.icon}
            onClick={() => onChangeNav(item.key)}
            variant={activeNav === item.key ? "contained" : "text"}
            color={activeNav === item.key ? "primary" : "inherit"}
            sx={{ justifyContent: "flex-start", minWidth: { xs: "fit-content", md: 180 } }}
          >
            {item.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}

import React from "react";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppInput from "../common/AppInput";

export default function AppNavbar({
  mode,
  onToggleMode,
  quickSearch,
  onQuickSearchChange,
  userName,
  onLogout
}) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", md: "center" }}
      justifyContent="space-between"
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box className="logo-chip">FM</Box>
        <Box>
          <Typography variant="h6">File Management Pro</Typography>
          <Typography variant="caption" color="text.secondary">
            Phase 1 Frontend Dashboard
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: "100%", md: "auto" } }}>
        <Box sx={{ width: { xs: "100%", md: 320 } }}>
          <AppInput
            value={quickSearch}
            onChange={(event) => onQuickSearchChange(event.target.value)}
            placeholder="Quick search by name or content"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </Box>
        <IconButton>
          <NotificationsNoneOutlinedIcon />
        </IconButton>
        <IconButton onClick={onToggleMode}>
          {mode === "light" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
        </IconButton>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
          <Avatar sx={{ width: 30, height: 30 }}>
            {(userName || "U").slice(0, 1).toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
            {userName || "User"}
          </Typography>
          <IconButton onClick={onLogout} title="Logout">
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
}

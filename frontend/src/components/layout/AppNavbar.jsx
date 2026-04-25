import React, { useMemo, useState } from "react";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppInput from "../common/AppInput";

export default function AppNavbar({
  mode,
  onToggleMode,
  quickSearch,
  onQuickSearchChange,
  userName,
  userEmail,
  userCreatedAt,
  notifications,
  unreadNotificationCount,
  onOpenNotifications,
  onClearNotifications,
  onLogout
}) {
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const profileMenuOpen = Boolean(profileAnchorEl);
  const notificationsMenuOpen = Boolean(notificationsAnchorEl);

  const joinedOn = useMemo(() => {
    if (!userCreatedAt) {
      return "N/A";
    }

    const date = new Date(userCreatedAt);
    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString();
  }, [userCreatedAt]);

  function handleOpenProfileMenu(event) {
    setProfileAnchorEl(event.currentTarget);
  }

  function handleCloseProfileMenu() {
    setProfileAnchorEl(null);
  }

  function handleLogoutClick() {
    handleCloseProfileMenu();
    onLogout();
  }

  function handleOpenNotifications(event) {
    setNotificationsAnchorEl(event.currentTarget);
    onOpenNotifications();
  }

  function handleCloseNotifications() {
    setNotificationsAnchorEl(null);
  }

  function handleClearNotifications() {
    onClearNotifications();
    handleCloseNotifications();
  }

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
        <IconButton onClick={handleOpenNotifications}>
          <Badge badgeContent={unreadNotificationCount} color="error" max={99}>
            <NotificationsNoneOutlinedIcon />
          </Badge>
        </IconButton>
        <IconButton onClick={onToggleMode}>
          {mode === "light" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
        </IconButton>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
          <ButtonBase
            onClick={handleOpenProfileMenu}
            sx={{ borderRadius: 2, px: 1, py: 0.4 }}
            aria-haspopup="true"
            aria-expanded={profileMenuOpen ? "true" : undefined}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 30, height: 30 }}>
                {(userName || "U").slice(0, 1).toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
                {userName || "User"}
              </Typography>
            </Stack>
          </ButtonBase>
        </Stack>
      </Stack>

      <Menu
        anchorEl={notificationsAnchorEl}
        open={notificationsMenuOpen}
        onClose={handleCloseNotifications}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ px: 2, py: 1.2, minWidth: 320, maxWidth: 360 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
            <Typography variant="subtitle2">Notifications</Typography>
            {notifications.length > 0 && (
              <ButtonBase onClick={handleClearNotifications} sx={{ borderRadius: 1, px: 0.8, py: 0.3 }}>
                <Typography variant="caption" color="primary.main">Clear all</Typography>
              </ButtonBase>
            )}
          </Stack>

          {notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No new notifications</Typography>
          ) : (
            <Stack spacing={1} sx={{ maxHeight: 300, overflowY: "auto", pr: 0.5 }}>
              {notifications.map((item, index) => (
                <Box key={item.id} sx={{ pt: index === 0 ? 0 : 1, borderTop: index === 0 ? "none" : "1px solid", borderColor: "divider" }}>
                  <Typography variant="body2" sx={{ fontWeight: item.type === "error" ? 700 : 500 }}>
                    {item.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.3 }}>
                    {item.timestamp}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Menu>

      <Menu
        anchorEl={profileAnchorEl}
        open={profileMenuOpen}
        onClose={handleCloseProfileMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ px: 2, py: 1.2, maxWidth: 280 }}>
          <Typography variant="subtitle2">{userName || "User"}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {userEmail || "No email available"}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.6 }}>
            Joined on: {joinedOn}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2 }}>
            Login status: Active session
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogoutClick}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LogoutRoundedIcon fontSize="small" />
            <Typography variant="body2">Logout</Typography>
          </Stack>
        </MenuItem>
      </Menu>
    </Stack>
  );
}

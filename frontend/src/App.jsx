import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  Box, CssBaseline, Grid, Stack, Typography, Snackbar, Alert,
  Avatar, LinearProgress, IconButton, AppBar,
  Toolbar, Drawer, List, ListItemButton, ListItemIcon, ListItemText
} from "@mui/material";
import {
  Menu, Dashboard, CloudUpload, Logout
} from "@mui/icons-material";

// Component Imports
import AuthPanel from "./components/auth/AuthPanel";
import CategoryCards from "./components/dashboard/CategoryCards";
import RecentFilesTable from "./components/files/RecentFilesTable";
import StoragePanel from "./components/dashboard/StoragePanel";

// API & Utils
import {
  getFiles, getStoredToken, getStoredUser, storeSession, clearSession,
  login, signup
} from "./services/api";

const DRAWER_WIDTH = 280;

export default function App() {
  // --- CONSOLIDATED STATE ---
  const [authState, setAuthState] = useState({
    token: getStoredToken(),
    user: getStoredUser(),
    isInitializing: true
  });

  const [files, setFiles] = useState([]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const dashboardTheme = useMemo(() => createTheme({
    palette: {
      primary: { main: "#3a97f9" },
      background: { default: "#f8f9fa", paper: "#ffffff" },
    },
    shape: { borderRadius: 16 },
    typography: { fontFamily: "'Inter', sans-serif" }
  }), []);

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    const t = getStoredToken();
    const u = getStoredUser();
    setAuthState({ token: t, user: u, isInitializing: false });
  }, []);

  // --- 2. AUTH HANDLERS ---
  const handleAuthSuccess = useCallback((response) => {
    const payload = response?.data || response;
    const authToken = payload.token || payload.sfm_token;
    const authUser = payload.user || payload.sfm_user;

    if (authToken && authUser) {
      storeSession(authToken, authUser);
      setAuthState({
        token: authToken,
        user: authUser,
        isInitializing: false
      });
      setSuccessMessage("Identity Verified.");
    } else {
      setErrorMessage("Authentication failed: Invalid data received.");
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearSession();
    setAuthState({ token: null, user: null, isInitializing: false });
    setFiles([]);
  }, []);

  // --- 3. DATA FETCHING ---
  const loadFiles = useCallback(async (activeToken) => {
    if (!activeToken) return;
    try {
      const data = await getFiles(activeToken, "");
      setFiles(data?.files || data || []);
    } catch (e) {
      setErrorMessage("Sync failed: " + e.message);
      if (e.message.includes("401")) handleLogout();
    }
  }, [handleLogout]);

  useEffect(() => {
    if (authState.token) loadFiles(authState.token);
  }, [authState.token, loadFiles]);

  // --- 4. DATA PROCESSING ---
  const fileStats = useMemo(() => {
    const stats = { images: 0, docs: 0, music: 0, totalSize: 0, types: { pdf: 0, image: 0 } };
    if (!Array.isArray(files)) return stats;
    files.forEach(file => {
      const name = (file.filename || file.name || "").toLowerCase();
      stats.totalSize += (file.size || 0);
      if (/\.(jpg|jpeg|png)$/.test(name)) { stats.images++; stats.types.image++; }
      else if (name.endsWith('.pdf')) { stats.docs++; stats.types.pdf++; }
    });
    return stats;
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (!Array.isArray(files)) return [];
    return files.filter(f => (f.filename || f.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery]);

  // --- 5. RENDER LOGIC ---

  if (authState.isInitializing) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <LinearProgress sx={{ width: '200px', mb: 2 }} />
        <Typography variant="caption">BOOTING VAULT...</Typography>
      </Box>
    );
  }

  if (!authState.token) {
    return (
      <ThemeProvider theme={dashboardTheme}>
        <CssBaseline />
        <AuthPanel
          onLogin={async (creds) => {
            try {
              const res = await login(creds);
              handleAuthSuccess(res);
            } catch (err) { setErrorMessage(err.response?.data?.message || err.message); }
          }}
          onSignup={async (form) => {
            try {
              const res = await signup(form);
              handleAuthSuccess(res);
            } catch (err) { setErrorMessage(err.response?.data?.message || err.message); }
          }}
        />
        <Snackbar open={!!errorMessage} autoHideDuration={4000} onClose={() => setErrorMessage("")}>
          <Alert severity="error" variant="filled">{errorMessage}</Alert>
        </Snackbar>
      </ThemeProvider>
    );
  }

  const userInitial = authState.user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <ThemeProvider theme={dashboardTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>

        {/* FIX: Set higher Z-index for AppBar */}
        <AppBar position="fixed" elevation={0} sx={{ bgcolor: "white", borderBottom: "1px solid #edf2f7", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton onClick={() => setDrawerOpen(!isDrawerOpen)} sx={{ color: "#1a202c" }}><Menu /></IconButton>
              <Typography variant="h6" sx={{ color: "#1a202c", fontWeight: 900 }}>VAULT 2026</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: "#3a97f9" }}>{userInitial}</Avatar>
              <IconButton onClick={handleLogout} color="error"><Logout /></IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* FIX: Use Toolbar spacer inside Drawer to prevent content from hiding behind AppBar */}
        <Drawer
          open={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Toolbar /> {/* This is the hidden spacer */}
          <Box sx={{ p: 2 }}>
            <List>
              <MenuLink
                icon={<Dashboard />}
                label="Dashboard"
                active={activeNav === 'dashboard'}
                onClick={() => { setActiveNav('dashboard'); setDrawerOpen(false); }}
              />
              <MenuLink
                icon={<CloudUpload />}
                label="Upload"
                active={activeNav === 'upload'}
                onClick={() => { setActiveNav('upload'); setDrawerOpen(false); }}
              />
            </List>
          </Box>
        </Drawer>

        {/* FIX: Use Toolbar spacer in Main content to fix the "Hello" cut-off */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 3, md: 5 } }}>
          <Toolbar /> {/* This pushes "Welcome" down */}
          <Typography variant="h3" fontWeight={900} mb={4}>
            Welcome, {authState.user?.name || 'User'}
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} lg={8}>
              <Stack spacing={4}>
                <CategoryCards stats={fileStats} />
                <RecentFilesTable files={filteredFiles} />
              </Stack>
            </Grid>
            <Grid item xs={12} lg={4}>
              <StoragePanel totalSize={fileStats.totalSize} />
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Notifications */}
      <Snackbar open={!!errorMessage} autoHideDuration={4000} onClose={() => setErrorMessage("")}>
        <Alert severity="error" variant="filled">{errorMessage}</Alert>
      </Snackbar>
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")}>
        <Alert severity="success" variant="filled">{successMessage}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function MenuLink({ icon, label, active, onClick }) {
  return (
    <ListItemButton onClick={onClick} sx={{ borderRadius: 3, mb: 1, bgcolor: active ? 'rgba(58, 151, 249, 0.08)' : 'transparent' }}>
      <ListItemIcon sx={{ color: active ? '#3a97f9' : '#a0aec0', minWidth: 45 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 700, color: active ? '#3a97f9' : '#4a5568' }} />
    </ListItemButton>
  );
}
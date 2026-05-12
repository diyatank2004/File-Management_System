import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  Box, CssBaseline, Grid, Stack, Typography, Snackbar, Alert,
  Avatar, LinearProgress, IconButton, AppBar, TextField, Button,
  Toolbar, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Paper,
  InputAdornment, Tooltip as MuiTooltip, Chip
} from "@mui/material";
import {
  Menu, Dashboard as DashboardIcon, CloudUpload, Logout, ManageSearch, Search, FileUpload,
  Settings, History, InfoOutlined, WarningAmber
} from "@mui/icons-material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Services
import { getFiles, uploadFile, getStoredToken, getStoredUser, clearSession } from "./services/api";

// Local Dashboard Components
import CategoryCards from "./components/dashboard/CategoryCards";
import RecentFilesTable from "./components/files/RecentFilesTable";
import StoragePanel from "./components/dashboard/StoragePanel";
import QuickActions from "./components/dashboard/QuickActions";
import ActivityFeed from "./components/dashboard/ActivityFeed";
import Login from "./components/auth/Login";

const DRAWER_WIDTH = 280;

const lexiconTheme = createTheme({
  palette: {
    primary: { main: "#0061FF" },
    secondary: { main: "#60EFFF" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    text: { primary: "#1E293B", secondary: "#64748B" }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h4: { fontWeight: 900, letterSpacing: "-0.02em" }
  }
});

export default function App() {
  const [authState, setAuthState] = useState({ token: getStoredToken(), user: getStoredUser() });
  const [files, setFiles] = useState([]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [isDrawerOpen, setDrawerOpen] = useState(true);
  const [msg, setMsg] = useState({ error: "", success: "", warning: "" });

  const [searchQuery, setSearchQuery] = useState("");
  const [stagingFiles, setStagingFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const loadFiles = useCallback(async (token) => {
    try {
      const data = await getFiles(token);
      setFiles(Array.isArray(data) ? data : data.files || []);
    } catch (e) {
      setMsg({ success: "", warning: "", error: "Lexicon sync failed." });
    }
  }, []);

  useEffect(() => {
    if (authState.token) loadFiles(authState.token);
  }, [authState.token, loadFiles]);

  const handleScanAndIndex = async () => {
    if (stagingFiles.length === 0) return;

    setIsScanning(true);
    let uploadedCount = 0;
    let duplicateCount = 0;

    // OPTIMIZED: Create a Set for O(1) duplicate lookups
    const existingFileKeys = new Set(files.map(f => `${f.filename}-${f.size}`));

    try {
      for (const file of stagingFiles) {
        const currentKey = `${file.name}-${file.size}`;

        if (existingFileKeys.has(currentKey)) {
          duplicateCount++;
          continue;
        }

        await uploadFile(authState.token, file);
        uploadedCount++;
      }

      setMsg({
        success: `Scan Complete: ${uploadedCount} indexed. ${duplicateCount > 0 ? `Skipped ${duplicateCount} duplicates.` : ""}`,
        error: "",
        warning: ""
      });

      setStagingFiles([]);
      await loadFiles(authState.token);
    } catch (err) {
      setMsg({ success: "", warning: "", error: "OCR/Indexing Engine Error. Check CORS or Auth." });
    } finally {
      setIsScanning(false);
    }
  };

  const stats = useMemo(() => {
    const s = { images: 0, docs: 0, music: 0, totalSize: 0 };
    files.forEach(f => {
      s.totalSize += (f.size || 0);
      const mime = f.mimetype?.toLowerCase() || "";
      if (mime.includes("image")) s.images++;
      else if (mime.includes("pdf") || mime.includes("doc")) s.docs++;
      else s.music++;
    });
    return s;
  }, [files]);

  const filteredByFilename = useMemo(() =>
    files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase())),
    [files, searchQuery]);

  // OPTIMIZED: Deep Search Result Memoization
  const searchResults = useMemo(() => {
    if (searchQuery.length < 3) return [];
    return files.filter(f => f.content?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery]);

  const logout = () => {
    clearSession();
    setAuthState({ token: null, user: null });
  };

  if (!authState.token) {
    return <ThemeProvider theme={lexiconTheme}><Login setAuthState={setAuthState} /></ThemeProvider>;
  }

  return (
    <ThemeProvider theme={lexiconTheme}>
      <CssBaseline />

      {isScanning && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3000, height: 4 }} color="secondary" />}

      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <AppBar position="fixed" sx={{ bgcolor: "white", zIndex: (theme) => theme.zIndex.drawer + 1, borderBottom: "1px solid #E2E8F0" }} elevation={0}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={() => setDrawerOpen(!isDrawerOpen)} sx={{ color: 'primary.main' }}><Menu /></IconButton>
              <Typography variant="h6" color="primary" fontWeight={900} letterSpacing={-1}>LEXICON 2.6</Typography>
              <Chip label="CORE ENGINE ACTIVE" size="small" color="success" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
            </Stack>

            <TextField
              size="small"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 400, bgcolor: "#F1F5F9", borderRadius: 2, "& fieldset": { border: "none" } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />

            <Stack direction="row" spacing={2} alignItems="center">
              <MuiTooltip title="History"><IconButton size="small"><History /></IconButton></MuiTooltip>
              <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32, fontSize: '0.8rem' }}>{authState.user?.name?.[0] || "U"}</Avatar>
              <IconButton onClick={logout} size="small" color="error"><Logout /></IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="persistent"
          open={isDrawerOpen}
          sx={{
            width: DRAWER_WIDTH,
            [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: "border-box", borderRight: "1px solid #E2E8F0", bgcolor: "#F8FAFC" },
          }}
        >
          <Toolbar />
          <Box p={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ ml: 2, mb: 2, display: 'block' }}>MAIN MENU</Typography>
            <List>
              {[
                { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
                { id: "upload", label: "Upload & Scan", icon: <CloudUpload /> },
                { id: "content-search", label: "Deep Search", icon: <ManageSearch /> }
              ].map((item) => (
                <ListItemButton
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  selected={activeNav === item.id}
                  sx={{ borderRadius: 3, mb: 1, '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } } }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Drawer>

        <Box component="main" sx={{
          flexGrow: 1,
          p: 4,
          transition: 'margin 0.3s ease-in-out',
          marginLeft: isDrawerOpen ? 0 : `-${DRAWER_WIDTH}px`,
          marginTop: 8
        }}>

          {activeNav === "dashboard" && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <CategoryCards stats={{ images: stats.images, docs: stats.docs, music: stats.music, totalFiles: files.length }} />
                <Paper sx={{ p: 0, borderRadius: 4, overflow: 'hidden', border: '1px solid #E2E8F0' }} elevation={0}>
                  <RecentFilesTable files={filteredByFilename} />
                </Paper>
              </Grid>

              <Grid item xs={12} lg={4}>
                <QuickActions onAction={(a) => a === 'upload' && setActiveNav('upload')} />
                <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '1px solid #E2E8F0' }} elevation={0}>
                  <Stack direction="row" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" fontWeight={800}>Content Mix</Typography>
                    <MuiTooltip title="Analysis based on Mime-type"><InfoOutlined fontSize="small" /></MuiTooltip>
                  </Stack>
                  <Box height={320}>
                    {files.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Images', value: stats.images },
                              { name: 'Docs', value: stats.docs },
                              { name: 'Other', value: stats.music }
                            ]}
                            innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value"
                          >
                            <Cell fill="#0061FF" /><Cell fill="#60EFFF" /><Cell fill="#CBD5E1" />
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Stack alignItems="center" justifyContent="center" height="100%" color="text.secondary">
                        <Typography variant="caption">No data to display</Typography>
                      </Stack>
                    )}
                  </Box>
                </Paper>
                <StoragePanel totalSize={stats.totalSize} />
                <Box mt={3}>
                  <ActivityFeed />
                </Box>
              </Grid>
            </Grid>
          )}

          {activeNav === "upload" && (
            <Box textAlign="center" py={5} maxWidth={800} mx="auto">
              <Paper sx={{ p: 6, border: '2px dashed #0061FF', bgcolor: 'rgba(0, 97, 255, 0.02)', borderRadius: 8, mb: 4 }} elevation={0}>
                <FileUpload sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" mb={1}>Lexicon Indexer</Typography>
                <Typography color="text.secondary" mb={4}>Staging area for OCR and Content Extraction</Typography>

                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button variant="contained" component="label" startIcon={<CloudUpload />} sx={{ borderRadius: 3, px: 4 }}>
                    Select Files
                    <input type="file" hidden multiple onChange={(e) => setStagingFiles(Array.from(e.target.files))} />
                  </Button>
                  <Button variant="outlined" component="label" startIcon={<DashboardIcon />} sx={{ borderRadius: 3, px: 4 }}>
                    Folder Upload
                    <input type="file" hidden webkitdirectory="true" multiple onChange={(e) => setStagingFiles(Array.from(e.target.files))} />
                  </Button>
                </Stack>
              </Paper>

              {stagingFiles.length > 0 && (
                <Box>
                  <Alert icon={<WarningAmber />} severity="info" sx={{ mb: 3, borderRadius: 3 }}>
                    {stagingFiles.length} files detected. Redundant files will be skipped automatically.
                  </Alert>
                  <Button
                    fullWidth variant="contained" size="large" onClick={handleScanAndIndex} disabled={isScanning}
                    sx={{ py: 2, borderRadius: 4, fontSize: '1.1rem', fontWeight: 900 }}
                  >
                    {isScanning ? "REVERSE INDEXING DATA..." : "COMMIT TO STORAGE"}
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {activeNav === "content-search" && (
            <Box>
              <Typography variant="h4" mb={1}>Deep Search</Typography>
              <Typography color="text.secondary" mb={4}>Lexicon is searching INSIDE your documents using OCR.</Typography>
              <TextField
                fullWidth variant="outlined"
                placeholder="Query content (e.g. 'Tax Invoice')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'primary.main' }} />, sx: { borderRadius: 4, bgcolor: 'white' } }}
              />
              <Box mt={4}>
                {searchResults.length > 0 ? (
                  <RecentFilesTable files={searchResults} />
                ) : (
                  <Box textAlign="center" py={10} sx={{ opacity: 0.3 }}>
                    <ManageSearch sx={{ fontSize: 100 }} />
                    <Typography variant="h6">{searchQuery.length < 3 ? "Awaiting Query..." : "No matches found."}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Snackbar open={!!msg.success} autoHideDuration={4000} onClose={() => setMsg({ ...msg, success: "" })}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 3 }}>{msg.success}</Alert>
      </Snackbar>
      <Snackbar open={!!msg.error} autoHideDuration={4000} onClose={() => setMsg({ ...msg, error: "" })}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>{msg.error}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
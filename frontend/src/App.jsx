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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

// Services
import { getFiles, uploadFile, getStoredToken, getStoredUser, clearSession, deleteFileMetadata } from "./services/api";

// Local Dashboard Components
import CategoryCards from "./components/dashboard/CategoryCards";
import RecentFilesTable from "./components/files/RecentFilesTable";
import ModernStorageHub from "./components/dashboard/ModernStorageHub";
import StorageBreakdown from "./components/dashboard/StorageBreakdown";
import SecurityCard from "./components/dashboard/SecurityCard";
import QuickActions from "./components/dashboard/QuickActions";
import ActivityFeed from "./components/dashboard/ActivityFeed";
import StagingArea from "./components/upload/StagingArea";
import Login from "./components/auth/Login";
import SettingsPage from "./pages/Settings";
import ShareDialog from "./components/dashboard/ShareDialog";
import SearchResultCard from "./components/dashboard/SearchResultCard";
import FileSearchHeader from "./components/files/FileSearchHeader";
import { translations } from "./services/translations";
import { motion, AnimatePresence } from "framer-motion";
import { NearMe, ArrowForward, PlayCircleFilled } from "@mui/icons-material";

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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [language, setLanguage] = useState("English");
  const [guideStep, setGuideStep] = useState(-1);
  const [fileStatuses, setFileStatuses] = useState({});
  const [serverSearchResults, setServerSearchResults] = useState([]);

  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const t = translations[language] || translations.English;

  const loadFiles = useCallback(async (token, query = "", mode = "both", type = "all", date = "all") => {
    try {
      const data = await getFiles(token, query, mode, type, date);
      const fetchedFiles = Array.isArray(data) ? data : data.files || [];
      if (mode === "content" || type !== "all" || date !== "all") {
        setServerSearchResults(fetchedFiles);
      } else {
        setFiles(fetchedFiles);
      }
    } catch (e) {
      console.error("[LEXICON_SEARCH] Error:", e);
      setServerSearchResults([]);
      setMsg({ success: "", warning: "", error: "Search failed. Please try again." });
    }
  }, []);

  useEffect(() => {
    if (authState.token) loadFiles(authState.token);
  }, [authState.token, loadFiles]);

  const validateSearchQuery = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return { valid: false, message: "Please enter a word to search inside files." };
    const words = trimmed.split(/\s+/);
    if (words.length > 5) return { valid: false, message: "Use 1 to 5 words only." };
    return { valid: true, message: "" };
  };

  useEffect(() => {
    if (activeNav !== "files") {
      setServerSearchResults([]);
      return;
    }
    const validation = validateSearchQuery(searchQuery);
    if (!validation.valid) {
      setServerSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      if (authState.token && searchQuery.trim().length > 0) {
        setMsg({ success: "", warning: "", error: "" });
        loadFiles(authState.token, searchQuery, "content", filterType, filterDate);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, activeNav, filterType, filterDate, authState.token, loadFiles]);

  // ENHANCED: Handle Scan & Index with Folder/Duplicacy Logic
  const handleScanAndIndex = async () => {
    if (stagingFiles.length === 0) return;

    setIsScanning(true);
    let uploadedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    const scanStartTime = Date.now();
    const existingFileKeys = new Set(files.map(f => `${f.filename}-${f.size}`));

    for (const file of stagingFiles) {
      const currentKey = `${file.name}-${file.size}`;

      // 1. Initial Local Check
      if (existingFileKeys.has(currentKey)) {
        setFileStatuses(prev => ({ ...prev, [file.name]: 'duplicate' }));
        duplicateCount++;
        continue;
      }

      try {
        setFileStatuses(prev => ({ ...prev, [file.name]: 'scanning' }));
        await new Promise(r => setTimeout(r, 600));

        setFileStatuses(prev => ({ ...prev, [file.name]: 'indexing' }));

        // PASS webkitRelativePath to the API service
        // You may need to update your uploadFile service function to accept this third argument
        await uploadFile(authState.token, file, file.webkitRelativePath);

        setFileStatuses(prev => ({ ...prev, [file.name]: 'success' }));
        uploadedCount++;
        existingFileKeys.add(currentKey);
      } catch (err) {
        console.error(`Error indexing ${file.name}:`, err);
        const isDuplicate = err.response?.status === 409 || err.message?.toLowerCase().includes("already");

        if (isDuplicate) {
          setFileStatuses(prev => ({ ...prev, [file.name]: 'duplicate' }));
          duplicateCount++;
        } else {
          setFileStatuses(prev => ({ ...prev, [file.name]: 'error' }));
          errorCount++;
        }
      }
    }

    const timeTakenSec = ((Date.now() - scanStartTime) / 1000).toFixed(1);

    setMsg({
      success: uploadedCount > 0 ? `Indexed ${uploadedCount} file(s) in ${timeTakenSec}s.` : "",
      error: errorCount > 0 ? `Failed ${errorCount} file(s).` : "",
      warning: duplicateCount > 0 ? `Skipped ${duplicateCount} duplicate content items.` : ""
    });

    setTimeout(() => {
      setStagingFiles(prev => prev.filter(f => {
        const status = fileStatuses[f.name];
        return status && status !== 'success' && status !== 'duplicate';
      }));
      setFileStatuses({});
    }, 3000);

    await loadFiles(authState.token);
    setIsScanning(false);
  };

  const stats = useMemo(() => {
    const s = { images: 0, docs: 0, music: 0, totalSize: 0 };
    files.forEach(f => {
      s.totalSize += (f.size || 0);
      const mime = f.mimetype?.toLowerCase() || "";
      if (mime.includes("image")) s.images++;
      else if (mime.includes("pdf") || mime.includes("doc") || mime.includes("text")) s.docs++;
      else if (mime.includes("audio") || mime.includes("music") || mime.includes("mp3")) s.music++;
    });
    return s;
  }, [files]);

  const searchResults = useMemo(() => {
    if (activeNav === "files") return searchQuery.trim().length > 0 ? serverSearchResults : [];
    if (searchQuery.length < 3) return [];
    return files.filter(f => f.filename?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery, serverSearchResults, activeNav]);

  const logout = () => { clearSession(); setAuthState({ token: null, user: null }); };

  if (!authState.token) return <ThemeProvider theme={lexiconTheme}><Login setAuthState={setAuthState} /></ThemeProvider>;

  return (
    <ThemeProvider theme={lexiconTheme}>
      <CssBaseline />
      {isScanning && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3000, height: 4 }} color="secondary" />}

      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <AppBar position="fixed" sx={{ bgcolor: "white", zIndex: 1300, borderBottom: "1px solid #E2E8F0" }} elevation={0}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={() => setDrawerOpen(!isDrawerOpen)} sx={{ color: 'primary.main' }}><Menu /></IconButton>
              <Typography variant="h6" color="primary" fontWeight={900} letterSpacing={-1}>LEXICON 2.6</Typography>
              <Chip label="CORE ENGINE ACTIVE" size="small" color="success" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>{authState.user?.name?.[0] || "U"}</Avatar>
              <IconButton onClick={logout} size="small" color="error"><Logout /></IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Drawer variant="persistent" open={isDrawerOpen} sx={{ width: DRAWER_WIDTH, [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, bgcolor: "#F8FAFC" } }}>
          <Toolbar />
          <Box p={3}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ ml: 2, mb: 2, display: 'block' }}>{t.mainMenu}</Typography>
            <List>
              {[
                { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
                { id: "files", label: "SMART SEARCH", icon: <ManageSearch /> },
                { id: "upload", label: "Upload", icon: <CloudUpload /> },
                { id: "settings", label: "Settings", icon: <Settings /> }
              ].map((item) => (
                <ListItemButton key={item.id} onClick={() => setActiveNav(item.id)} selected={activeNav === item.id} sx={{ borderRadius: 3, mb: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 4, transition: 'margin 0.3s ease-in-out', marginLeft: isDrawerOpen ? 0 : `-${DRAWER_WIDTH}px`, marginTop: 8 }}>
          {activeNav === "dashboard" && (
            <Box>
              <Grid container spacing={4} mb={4}>
                <Grid item xs={12} lg={8}>
                  <ModernStorageHub totalSize={stats.totalSize} token={authState.token}
                    onDeleteFile={async (id) => {
                      try { await deleteFileMetadata(authState.token, id); setFiles(prev => prev.filter(f => f._id !== id)); setMsg({ success: "File deleted" }); }
                      catch (e) { setMsg({ error: "Failed to delete" }); }
                    }} />
                </Grid>
                <Grid item xs={12} lg={4}>
                  <Stack spacing={3}>
                    <QuickActions onAction={(a) => { if (a === 'upload') setActiveNav('upload'); if (a === 'search') setActiveNav('files'); }} />
                    <StorageBreakdown stats={stats} />
                  </Stack>
                </Grid>
              </Grid>
              <CategoryCards stats={stats} onCategoryClick={(cat) => setSelectedCategory(selectedCategory === cat ? null : cat)} />
              <ActivityFeed files={files} />
            </Box>
          )}

          {activeNav === "upload" && (
            <Box py={2} maxWidth={900} mx="auto">
              <Grid container spacing={4}>
                <Grid item xs={12} md={stagingFiles.length > 0 ? 6 : 12}>
                  <Paper sx={{ p: 6, border: '2px dashed #0061FF', bgcolor: 'rgba(0, 97, 255, 0.02)', borderRadius: 8, textAlign: 'center' }} elevation={0}>
                    <FileUpload sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" mb={1} fontWeight={900}>Lexicon Indexer</Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button variant="contained" component="label" startIcon={<CloudUpload />} sx={{ borderRadius: 3, px: 4 }}>
                        Select Files
                        <input type="file" hidden multiple onChange={(e) => setStagingFiles(Array.from(e.target.files))} />
                      </Button>

                      {/* NEW: Folder Upload Button */}
                      <Button variant="outlined" component="label" startIcon={<ManageSearch />} sx={{ borderRadius: 3, px: 4 }}>
                        Folder Upload
                        <input
                          type="file"
                          hidden
                          webkitdirectory="true"
                          mozdirectory="true"
                          multiple
                          onChange={(e) => setStagingFiles(Array.from(e.target.files))}
                        />
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
                {stagingFiles.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <StagingArea stagingFiles={stagingFiles} setStagingFiles={setStagingFiles} fileStatuses={fileStatuses} />
                    <Box mt={3}>
                      <Button fullWidth variant="contained" size="large" onClick={handleScanAndIndex} disabled={isScanning} sx={{ py: 2, borderRadius: 4, fontWeight: 900 }}>
                        {isScanning ? "REVERSE INDEXING..." : "COMMIT TO STORAGE"}
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {activeNav === "files" && (
            <Box>
              <FileSearchHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} onClear={() => setSearchQuery("")} />
              <Box mt={2}>
                {searchResults.length > 0 ? (
                  <Grid container spacing={3}>
                    {searchResults.map((file) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={file._id}>
                        <SearchResultCard file={file} query={searchQuery} onDelete={async (id) => {
                          try { await deleteFileMetadata(authState.token, id); setServerSearchResults(prev => prev.filter(f => f._id !== id)); setFiles(prev => prev.filter(f => f._id !== id)); }
                          catch (e) { setMsg({ error: "Failed to delete" }); }
                        }} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box textAlign="center" py={15} sx={{ opacity: 0.3 }}>
                    <ManageSearch sx={{ fontSize: 100 }} />
                    <Typography variant="h6">{searchQuery ? "No matches found." : "Enter keywords to search inside files."}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <AnimatePresence>
        {guideStep >= 0 && (
          <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, top: '30%', left: '40%' }} style={{ position: 'absolute' }}>
              <Paper sx={{ p: 4, borderRadius: 6, maxWidth: 300, border: '3px solid #0061FF' }}>
                <Typography variant="h6" fontWeight={900}>Neural Search Ready</Typography>
                <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => setGuideStep(-1)}>Let's Go</Button>
              </Paper>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>

      <Snackbar open={!!msg.success || !!msg.error} autoHideDuration={4000} onClose={() => setMsg({ success: "", error: "", warning: "" })}>
        <Alert severity={msg.error ? "error" : "success"} variant="filled">{msg.success || msg.error}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
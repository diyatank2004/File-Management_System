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
import { getFiles, uploadFile, getStoredToken, getStoredUser, clearSession, deleteFileMetadata } from "./services/api";

// Local Dashboard Components
import CategoryCards from "./components/dashboard/CategoryCards";
import RecentFilesTable from "./components/files/RecentFilesTable";
import StoragePanel from "./components/dashboard/StoragePanel";
import ModernStorageHub from "./components/dashboard/ModernStorageHub";
import StorageBreakdown from "./components/dashboard/StorageBreakdown";
import SecurityCard from "./components/dashboard/SecurityCard";
import QuickActions from "./components/dashboard/QuickActions";
import ActivityFeed from "./components/dashboard/ActivityFeed";
import StagingArea from "./components/upload/StagingArea";
import Login from "./components/auth/Login";
import SettingsPage from "./pages/Settings";
import ShareDialog from "./components/dashboard/ShareDialog";
import FileSearchHeader from "./components/files/FileSearchHeader";
import SearchResultCard from "./components/files/SearchResultCard";
import { translations } from "./services/translations";
import { motion, AnimatePresence } from "framer-motion";
import FileExplorerPane from "./components/files/FileExplorerPane";
import { NearMe, ArrowForward, PlayCircleFilled } from "@mui/icons-material";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

// Set up public un-throttled CDN worker mapping for PDF parsing in browser runtime context
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

  const [stagingFiles, setStagingFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [language, setLanguage] = useState("English");
  const [guideStep, setGuideStep] = useState(-1);
  const [fileStatuses, setFileStatuses] = useState({});

  // Added Missing Search and Result States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setServerSearchResults] = useState([]);

  // Search Filters & View Mode
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const t = translations[language] || translations.English;

  const loadFiles = useCallback(async (token, query = "", mode = "both", type = "all", date = "all") => {
    try {
      const data = await getFiles(token, query, mode, type, date);

      console.log("[LEXICON_DEBUG] Server Response Data:", data);

      // Normalize data object extraction
      const fetchedFiles = Array.isArray(data) ? data : data.files || [];

      if (mode === "content" || type !== "all" || date !== "all") {
        // 🌟 FIX HERE: Map backend keys to the frontend expectations 
        // and extract the snippet text safely.
        const mappedResults = fetchedFiles.map((file) => ({
          ...file,
          id: file._id,                                     // Map _id to id
          name: file.filename,                             // Map filename to name
          type: file.fileType,                             // Map fileType to type
          snippet: file.snippet || file.search?.snippet || "Text preview unavailable..." // Safeguard snippet
        }));

        setServerSearchResults(mappedResults);
      } else {
        // Also map standard dashboard files list to avoid crashing grid views
        const mappedDashboardFiles = fetchedFiles.map((file) => ({
          ...file,
          id: file._id,
          name: file.filename,
          type: file.fileType
        }));
        setFiles(mappedDashboardFiles);
      }
    } catch (e) {
      console.error("Search Error:", e);
    }
  }, []);

  useEffect(() => {
    if (authState.token) loadFiles(authState.token);
  }, [authState.token, loadFiles]);

  const validateSearchQuery = (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return { valid: false, message: "Please enter a keyword or short phrase to search inside your files." };
    }
    const words = trimmed.split(/\s+/);
    if (words.length > 5) {
      return { valid: false, message: "Use 1 to 5 words only. Try a shorter phrase from the content you remember." };
    }
    return { valid: true, message: "" };
  };

  // FIXED: Properly wrapped floating logic in a unified useEffect hook
  useEffect(() => {
    const validation = validateSearchQuery(searchQuery);
    if (!validation.valid) {
      setServerSearchResults([]);
      if (searchQuery.trim().length > 0) {
        setMsg({ success: "", warning: "", error: validation.message });
      }
      return;
    }

    const hasSearchCriteria = searchQuery.trim().length > 0;
    if (!hasSearchCriteria) {
      setServerSearchResults([]);
      return;
    }

    // Capturing the query value immediately to prevent closure scope slip-ups
    const currentQuery = searchQuery.trim();

    const timer = setTimeout(() => {
      if (authState.token) {
        setMsg({ success: "", warning: "", error: "" });
        const searchMode = "content";
        console.log(`[LEXICON_SEARCH] Sending to API - Query: "${currentQuery}"`);

        // FIX: Passing currentQuery explicitly ensures the API call gets the text
        loadFiles(authState.token, currentQuery, searchMode, filterType, filterDate);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, activeNav, filterType, filterDate, authState.token, loadFiles]);

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

      if (existingFileKeys.has(currentKey)) {
        setFileStatuses(prev => ({ ...prev, [file.name]: 'duplicate' }));
        duplicateCount++;
        continue;
      }

      try {
        setFileStatuses(prev => ({ ...prev, [file.name]: 'scanning' }));

        // --- NEW BROWSER EXTRACTION LOGIC ---
        let localExtractedText = "";
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const isImage = file.type.startsWith("image/");
        const isText = file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt");

        if (isPdf) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let combinedPagesText = "";
            // Read up to first 50 pages to prevent sandbox tabs freezing on ultra huge text files
            const maxPages = Math.min(pdf.numPages, 50);
            for (let i = 1; i <= maxPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageStr = textContent.items.map(item => item.str).join(" ");
              combinedPagesText += pageStr + " ";
            }
            localExtractedText = combinedPagesText;
          } catch (pdfErr) {
            console.error("Local PDF reader fault:", pdfErr);
          }
        } else if (isImage) {
          try {
            // Leverage Client Engine specs using standard layout workers
            const { data: { text } } = await Tesseract.recognize(file, "eng+hin");
            localExtractedText = text || "";
          } catch (ocrErr) {
            console.error("Local Tesseract worker fault:", ocrErr);
          }
        } else if (isText) {
          localExtractedText = await file.text();
        }
        // ------------------------------------

        setFileStatuses(prev => ({ ...prev, [file.name]: 'indexing' }));

        // Pass the client-side text extraction result to your updated api.js call
        await uploadFile(authState.token, file, file.webkitRelativePath, localExtractedText.trim());

        setFileStatuses(prev => ({ ...prev, [file.name]: 'success' }));
        uploadedCount++;
        existingFileKeys.add(currentKey);
      } catch (err) {
        console.error(`Error indexing ${file.name}:`, err);
        const isDuplicate = err.message?.toLowerCase().includes("already") || err.status === 409;

        if (isDuplicate) {
          setFileStatuses(prev => ({ ...prev, [file.name]: 'duplicate' }));
          duplicateCount++;
          existingFileKeys.add(currentKey);
        } else {
          setFileStatuses(prev => ({ ...prev, [file.name]: 'error' }));
          errorCount++;
        }
      }
    }

    const timeTakenSec = ((Date.now() - scanStartTime) / 1000).toFixed(1);

    setMsg({
      success: uploadedCount > 0 ? `Successfully indexed ${uploadedCount} file(s) in ${timeTakenSec}s.` : "",
      error: errorCount > 0 ? `Failed to index ${errorCount} file(s).` : "",
      warning: duplicateCount > 0 ? `Skipped ${duplicateCount} duplicate(s).` : ""
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

  const categorizedFiles = useMemo(() => {
    if (!selectedCategory) return [];
    return files.filter(f => {
      const mime = f.mimetype?.toLowerCase() || "";
      if (selectedCategory === 'image') return mime.includes("image");
      if (selectedCategory === 'doc') return mime.includes("pdf") || mime.includes("doc") || mime.includes("text");
      if (selectedCategory === 'music') return mime.includes("audio") || mime.includes("music") || mime.includes("mp3");
      return false;
    });
  }, [files, selectedCategory]);

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
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={() => setDrawerOpen(!isDrawerOpen)} sx={{ color: 'primary.main' }}><Menu /></IconButton>
              <Typography variant="h6" color="primary" fontWeight={900} letterSpacing={-1}>LEXICON 2.6</Typography>
              <Chip label="CORE ENGINE ACTIVE" size="small" color="success" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
            </Stack>

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
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ ml: 2, mb: 2, display: 'block' }}>{t.mainMenu}</Typography>
            <List>
              {[
                { id: "dashboard", label: t.dashboard, icon: <DashboardIcon /> },
                { id: "files", label: "SMART SEARCH", icon: <ManageSearch /> },
                { id: "upload", label: t.upload, icon: <CloudUpload /> },
                { id: "settings", label: t.settings, icon: <Settings /> }
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
            <Box>
              <Grid container spacing={4} mb={4}>
                <Grid item xs={12} lg={8}>
                  <ModernStorageHub totalSize={stats.totalSize} t={t} token={authState.token}
                    onDeleteFile={async (id) => {
                      try {
                        await deleteFileMetadata(authState.token, id);
                        setFiles(prev => prev.filter(f => f._id !== id));
                        setMsg({ success: "File deleted successfully", error: "", warning: "" });
                      } catch (e) {
                        setMsg({ success: "", error: "Failed to delete file", warning: "" });
                      }
                    }} />
                </Grid>
                <Grid item xs={12} lg={4}>
                  <Stack spacing={3}>
                    <QuickActions onAction={(a) => {
                      if (a === 'upload') setActiveNav('upload');
                      if (a === 'search') setActiveNav('files');
                      if (a === 'settings') setActiveNav('settings');
                      if (a === 'share') setIsShareOpen(true);
                    }} t={t} />
                    <StorageBreakdown stats={{ images: stats.images, docs: stats.docs, music: stats.music }} t={t} />
                  </Stack>
                </Grid>
              </Grid>

              <Box mb={5}>
                <Typography variant="h6" fontWeight={800} mb={3} sx={{ opacity: 0.8 }}>{t.categories}</Typography>
                <CategoryCards
                  stats={{ images: stats.images, docs: stats.docs, music: stats.music, totalFiles: files.length }}
                  onCategoryClick={(cat) => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  t={t}
                />
              </Box>

              {selectedCategory && (
                <Paper sx={{ p: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid #0061FF33', mb: 5, bgcolor: '#FFFFFF' }} elevation={0}>
                  <Box p={3} borderBottom="1px solid #E2E8F0" display="flex" justifyContent="space-between" alignItems="center" bgcolor="rgba(0, 97, 255, 0.02)">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ width: 8, height: 24, bgcolor: 'primary.main', borderRadius: 2 }} />
                      <Typography variant="h6" fontWeight={900} color="primary">EXPLORING {selectedCategory.toUpperCase()}S</Typography>
                    </Stack>
                    <Button variant="outlined" size="small" onClick={() => setSelectedCategory(null)} sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>Close</Button>
                  </Box>
                  <RecentFilesTable files={categorizedFiles} />
                </Paper>
              )}

              <Grid container spacing={4}>
                <Grid item xs={12} lg={8}><ActivityFeed files={files} t={t} /></Grid>
                <Grid item xs={12} lg={4}>
                  <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }} elevation={0}>
                    <Typography variant="h6" fontWeight={800} mb={2}>{t.insights}</Typography>
                    <Stack spacing={2}>
                      <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                        <Typography variant="caption" color="text.secondary">{t.syncStatus}</Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">{t.optimized}</Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                        <Typography variant="caption" color="text.secondary">{t.lastIndexed}</Typography>
                        <Typography variant="body2" fontWeight={700}>{t.justNow}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                  <SecurityCard t={t} />
                </Grid>
              </Grid>
            </Box>
          )}


          {activeNav === "files" && (
            <Stack spacing={2}>
              <FileSearchHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                onClear={() => {
                  setSearchQuery("");
                  setServerSearchResults([]);
                  setMsg({ success: "", warning: "", error: "" });
                }}
              />
              <FileExplorerPane
                files={searchResults}
                searchQuery={searchQuery}
                onDelete={async (id) => {
                  try {
                    await deleteFileMetadata(authState.token, id);
                    setServerSearchResults(prev => prev.filter(f => f._id !== id && f.id !== id));
                    setMsg({ success: "File deleted successfully", error: "", warning: "" });
                  } catch (e) {
                    setMsg({ success: "", error: "Failed to delete file", warning: "" });
                  }
                }}
              />
            </Stack>
          )}

          {activeNav === "upload" && (
            <Box py={2} maxWidth={900} mx="auto">
              <Grid container spacing={4}>
                <Grid item xs={12} md={stagingFiles.length > 0 ? 6 : 12}>
                  <Paper sx={{ p: 6, border: '2px dashed #0061FF', bgcolor: 'rgba(0, 97, 255, 0.02)', borderRadius: 8, textAlign: 'center' }} elevation={0}>
                    <FileUpload sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" mb={1} fontWeight={900}>Lexicon Indexer</Typography>
                    <Typography color="text.secondary" mb={4}>Staging area for content extraction</Typography>

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
                </Grid>

                {stagingFiles.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <StagingArea stagingFiles={stagingFiles} setStagingFiles={setStagingFiles} fileStatuses={fileStatuses} />
                    <Box mt={3}>
                      <Button fullWidth variant="contained" size="large" onClick={handleScanAndIndex} disabled={isScanning} sx={{ py: 2, borderRadius: 4, fontWeight: 900 }}>
                        {isScanning ? "REVERSE INDEXING IN PROGRESS..." : "COMMIT TO STORAGE"}
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}


          {activeNav === "settings" && (
            <SettingsPage language={language} setLanguage={setLanguage} token={authState.token}
              startGuide={() => { setActiveNav('dashboard'); setTimeout(() => setGuideStep(0), 500); }}
            />
          )}
        </Box>
      </Box>

      <AnimatePresence>
        {guideStep >= 0 && (
          <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, top: ['30%', '25%', '25%', '60%', '5%'][guideStep], left: ['5%', '35%', '85%', '40%', '50%'][guideStep] }}
              style={{ position: 'absolute', transform: 'translate(-50%, -50%)' }}
            >
              <Paper sx={{ p: 4, borderRadius: 6, maxWidth: 300, border: '3px solid #0061FF' }}>
                <Stack spacing={2.5}>
                  <Typography variant="h6" fontWeight={900}>{[t.mainMenu, t.storageHub, "Actions", t.categories, "Search"][guideStep]}</Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {["Sidebar navigation.", "Monitor storage capacity.", "Access tasks.", "Dive into categories.", "Search documents."][guideStep]}
                  </Typography>
                  <Button variant="contained" fullWidth onClick={() => guideStep < 4 ? setGuideStep(guideStep + 1) : setGuideStep(-1)}>
                    {guideStep === 4 ? "EXPLORE NOW" : "NEXT STEP"}
                  </Button>
                </Stack>
              </Paper>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>

      <ShareDialog open={isShareOpen} onClose={() => setIsShareOpen(false)} files={files} />
      <Snackbar open={!!msg.success} autoHideDuration={4000} onClose={() => setMsg({ ...msg, success: "" })}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 3 }}>{msg.success}</Alert>
      </Snackbar>
      <Snackbar open={!!msg.error} autoHideDuration={4000} onClose={() => setMsg({ ...msg, error: "" })}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>{msg.error}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
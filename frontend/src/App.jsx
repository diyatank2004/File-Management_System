import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  Box, CssBaseline, Grid, Stack, Typography, Snackbar, Alert,
  Avatar, LinearProgress, IconButton, AppBar, TextField, Button,
  Toolbar, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Paper, Menu as MuiMenu, MenuItem, Divider,
  InputAdornment, Tooltip as MuiTooltip, Chip, useMediaQuery
} from "@mui/material";
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, CloudUpload, Logout, ManageSearch, Search, FileUpload,
  Settings, InfoOutlined, WarningAmber
} from "@mui/icons-material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Services
import { getFiles, uploadFile, getStoredToken, getStoredUser, clearSession, deleteFileMetadata } from "./services/api";

// Local Dashboard Components
import CategoryCards from "./components/dashboard/CategoryCards";
import RecentFilesTable from "./components/files/RecentFilesTable";
import ModernStorageHub from "./components/dashboard/ModernStorageHub";
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
import { classifyFileType, getExtension } from "./utils/fileHelpers";

// Set up public un-throttled CDN worker mapping for PDF parsing in browser runtime context
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const DRAWER_WIDTH = 250;

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

const CODE_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "cs", "go", "rs",
  "sql", "html", "css", "json", "xml", "md", "yml", "yaml", "sh", "php",
  "rb", "dart", "kt", "swift", "lua", "ini", "toml", "env", "conf"
]);

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "tif", "tiff"]);
const DOCUMENT_EXTENSIONS = new Set(["pdf", "doc", "docx", "txt", "md"]);
const SPREADSHEET_EXTENSIONS = new Set(["xls", "xlsx", "csv"]);
const PRESENTATION_EXTENSIONS = new Set(["ppt", "pptx"]);

const getFileName = (file = {}) => (file.filename || file.name || "").toLowerCase();

const isImageFile = (file) => {
  const ext = getExtension(file.name || file.filename || "");
  const name = getFileName(file);
  const mime = (file.mimetype || file.type || "").toLowerCase();
  return mime.startsWith("image/") || IMAGE_EXTENSIONS.has(ext) || /\.(png|jpe?g|gif|webp|bmp|tif|tiff|svg)$/i.test(name);
};

const isSpreadsheetFile = (file) => {
  const ext = getExtension(file.name || file.filename || "");
  const name = getFileName(file);
  const mime = (file.mimetype || file.type || "").toLowerCase();
  return SPREADSHEET_EXTENSIONS.has(ext) || /\.(xls|xlsx|csv)$/i.test(name) || /(?:excel|spreadsheet)/i.test(mime);
};

const isPresentationFile = (file) => {
  const ext = getExtension(file.name || file.filename || "");
  const name = getFileName(file);
  const mime = (file.mimetype || file.type || "").toLowerCase();
  return PRESENTATION_EXTENSIONS.has(ext) || /\.(ppt|pptx)$/i.test(name) || /(?:powerpoint|presentation)/i.test(mime);
};

const isDocumentFile = (file) => {
  const ext = getExtension(file.name || file.filename || "");
  const name = getFileName(file);
  const mime = (file.mimetype || file.type || "").toLowerCase();
  return DOCUMENT_EXTENSIONS.has(ext) || /\.(pdf|doc|docx|txt|md)$/i.test(name) || /(?:pdf|word|text|msword)/i.test(mime);
};

const isLikelyTextFile = (file) => {
  const ext = getExtension(file.name);
  return file.type.startsWith("text/") || CODE_EXTENSIONS.has(ext) || file.name.toLowerCase().endsWith(".txt");
};

const isLikelyImageFile = (file) => {
  const ext = getExtension(file.name);
  return file.type.startsWith("image/") || IMAGE_EXTENSIONS.has(ext);
};

const extractPdfText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let combinedPagesText = "";
  const maxPages = Math.min(pdf.numPages, 50);

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageStr = textContent.items.map(item => item.str).join(" ");
    combinedPagesText += pageStr + " ";
  }

  const trimmedText = combinedPagesText.trim();

  if (trimmedText.length >= 40) {
    return trimmedText;
  }

  const ocrPages = Math.min(pdf.numPages, 8);
  let ocrText = "";

  for (let i = 1; i <= ocrPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      break;
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    const { data: { text } } = await Tesseract.recognize(canvas, "eng+hin");
    ocrText += `${text || ""} `;
  }

  return (ocrText.trim() || trimmedText);
};

const extractHandwrittenText = async (file) => {
  const primaryResult = await Tesseract.recognize(file, "eng+hin");
  const primaryText = primaryResult?.data?.text?.trim() || "";

  if (primaryText.length >= 20) {
    return primaryText;
  }

  const englishOnlyResult = await Tesseract.recognize(file, "eng");
  return englishOnlyResult?.data?.text?.trim() || primaryText;
};

export default function App() {
  const [authState, setAuthState] = useState({ token: getStoredToken(), user: getStoredUser() });
  const [files, setFiles] = useState([]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [isDrawerOpen, setDrawerOpen] = useState(true);
  const isDesktop = useMediaQuery("(min-width:1024px)");
  const [msg, setMsg] = useState({ error: "", success: "", warning: "" });

  const [stagingFiles, setStagingFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [language, setLanguage] = useState("English");
  const [guideStep, setGuideStep] = useState(-1);
  const [fileStatuses, setFileStatuses] = useState({});
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const sharedFileParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      id: params.get('share'),
      name: params.get('name') || 'Shared file'
    };
  }, []);

  // Added Missing Search and Result States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setServerSearchResults] = useState([]);

  // Search Filters & View Mode
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const t = translations[language] || translations.English;
  const profileMenuOpen = Boolean(profileAnchorEl);

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
          id: file._id,
          name: file.filename,
          // Prefer filename-based classification to avoid server mislabels
          type: classifyFileType(file.filename || file.name || ""),
          snippet: file.snippet || file.search?.snippet || "Text preview unavailable..."
        }));

        setServerSearchResults(mappedResults);
      } else {
        // Also map standard dashboard files list to avoid crashing grid views
        const mappedDashboardFiles = fetchedFiles.map((file) => ({
          ...file,
          id: file._id,
          name: file.filename,
          // Use filename extension to classify type reliably
          type: classifyFileType(file.filename || file.name || "")
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

  useEffect(() => {
    setDrawerOpen(isDesktop);
  }, [isDesktop]);

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
      const isBlockedUpload = file.type?.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a|aac|wma)$/i.test(file.name);

      if (isBlockedUpload) {
        setFileStatuses(prev => ({ ...prev, [file.name]: 'error' }));
        errorCount++;
        continue;
      }

      if (existingFileKeys.has(currentKey)) {
        setFileStatuses(prev => ({ ...prev, [file.name]: 'duplicate' }));
        duplicateCount++;
        continue;
      }

      try {
        setFileStatuses(prev => ({ ...prev, [file.name]: 'scanning' }));

        let localExtractedText = "";
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const isImage = isLikelyImageFile(file);
        const isText = isLikelyTextFile(file);

        if (isPdf) {
          try {
            localExtractedText = await extractPdfText(file);
          } catch (pdfErr) {
            console.error("Local PDF reader fault:", pdfErr);
          }
        } else if (isImage) {
          try {
            localExtractedText = await extractHandwrittenText(file);
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
    const s = { images: 0, docs: 0, code: 0, spreadsheets: 0, presentations: 0, totalSize: 0 };
    files.forEach(f => {
      s.totalSize += (f.size || 0);
      const type = classifyFileType(f.filename || f.name || "").toLowerCase();

      if (isImageFile(f)) s.images++;
      else if (type === "code") s.code++;
      else if (isSpreadsheetFile(f)) s.spreadsheets++;
      else if (isPresentationFile(f)) s.presentations++;
      else if (isDocumentFile(f) || type === "pdf" || type === "document") s.docs++;
      else s.docs++;
    });
    return s;
  }, [files]);

  const categorizedFiles = useMemo(() => {
    if (!selectedCategory) return [];
    return files.filter(f => {
      const type = classifyFileType(f.filename || f.name || "").toLowerCase();
      if (selectedCategory === 'image') return isImageFile(f);
      if (selectedCategory === 'doc') return isDocumentFile(f) || type === "pdf" || type === "document";
      if (selectedCategory === 'spreadsheet') return isSpreadsheetFile(f);
      if (selectedCategory === 'presentation') return isPresentationFile(f);
      if (selectedCategory === 'code') return type === "code";
      return false;
    });
  }, [files, selectedCategory]);

  const handleDeleteFile = useCallback(async (id) => {
    if (!authState.token || !id) {
      setMsg({ success: "", error: "Unable to delete file", warning: "" });
      return;
    }

    try {
      await deleteFileMetadata(authState.token, id);
      setFiles((prev) => prev.filter((file) => file._id !== id && file.id !== id));
      setServerSearchResults((prev) => prev.filter((file) => file._id !== id && file.id !== id));
      setMsg({ success: "File deleted successfully", error: "", warning: "" });
    } catch (error) {
      setMsg({ success: "", error: "Failed to delete file", warning: "" });
    }
  }, [authState.token]);

  const logout = () => {
    clearSession();
    setAuthState({ token: null, user: null });
  };

  const openProfileMenu = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const closeProfileMenu = () => {
    setProfileAnchorEl(null);
  };

  if (sharedFileParams.id) {
    return (
      <ThemeProvider theme={lexiconTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, bgcolor: 'linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%)' }}>
          <Paper elevation={0} sx={{ width: '100%', maxWidth: 560, p: { xs: 3, sm: 4 }, borderRadius: 4, border: '1px solid #E2E8F0', boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)' }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.4 }}>
                  Shared link
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, lineHeight: 1.1 }}>
                  {sharedFileParams.name}
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Typography variant="body2" color="text.secondary">
                  This link opens the file manager app on the current machine. If you are signed in, open the dashboard to view your files.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.search = '';
                    url.hash = '';
                    window.location.href = url.toString();
                  }}
                >
                  Open app
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                >
                  Copy link
                </Button>
              </Stack>

              <Typography variant="caption" color="text.secondary">
                Share ID: {sharedFileParams.id}
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  if (!authState.token) {
    return <ThemeProvider theme={lexiconTheme}><Login setAuthState={setAuthState} /></ThemeProvider>;
  }

  return (
    <ThemeProvider theme={lexiconTheme}>
      <CssBaseline />

      {isScanning && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3000, height: 4 }} color="secondary" />}

      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <AppBar
          position="fixed"
          sx={{
            bgcolor: "white",
            zIndex: (theme) => theme.zIndex.drawer + 1,
            borderBottom: "1px solid #E2E8F0",
            px: { xs: 0.5, sm: 1, md: 0 }
          }}
          elevation={0}
        >
          <Toolbar
            sx={{
              justifyContent: "space-between",
              gap: 2,
              py: { xs: 1, sm: 1.25 },
              minHeight: { xs: 64, sm: 72 }
            }}
          >
            <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
              {!isDesktop && (
                <IconButton
                  onClick={() => setDrawerOpen((open) => !open)}
                  sx={{ color: 'primary.main', flexShrink: 0 }}
                  aria-label="Open navigation menu"
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  color="primary"
                  fontWeight={900}
                  letterSpacing={-1}
                  sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }, lineHeight: 1.1 }}
                  noWrap
                >
                  LEXICON 2.6
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1.2 }}
                  noWrap
                >
                  File management dashboard
                </Typography>
              </Box>
              <Chip
                label="CORE ENGINE ACTIVE"
                size="small"
                color="success"
                variant="outlined"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  flexShrink: 0
                }}
              />
            </Stack>

            <Stack direction="row" spacing={{ xs: 0.5, sm: 1, md: 2 }} alignItems="center" sx={{ flexShrink: 0 }}>
              <MuiTooltip title="Profile">
                <IconButton size="small" sx={{ p: 0 }} onClick={openProfileMenu} aria-label="Open profile menu">
                  <Avatar sx={{ bgcolor: "primary.main", width: { xs: 30, sm: 32 }, height: { xs: 30, sm: 32 }, fontSize: '0.8rem' }}>{authState.user?.name?.[0] || "U"}</Avatar>
                </IconButton>
              </MuiTooltip>
              <IconButton onClick={logout} size="small" color="error" sx={{ p: { xs: 0.75, sm: 1 } }} aria-label="Logout">
                <Logout fontSize="small" />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Drawer
          variant={isDesktop ? "persistent" : "temporary"}
          open={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
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

        <MuiMenu
          anchorEl={profileAnchorEl}
          open={profileMenuOpen}
          onClose={closeProfileMenu}
          PaperProps={{ sx: { width: 260, borderRadius: 3, mt: 1 } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                {authState.user?.name?.[0] || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={800} noWrap>
                  {authState.user?.name || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {authState.user?.email || 'Signed in'}
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setActiveNav('settings'); closeProfileMenu(); }}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <MenuItem onClick={() => { setActiveNav('dashboard'); closeProfileMenu(); }}>
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            Dashboard
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { closeProfileMenu(); logout(); }} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </MuiMenu>

        <Box component="main" sx={{
          flexGrow: 1,
          width: '100%',
          minWidth: 0,
          overflowX: 'hidden',
          px: { xs: 1.5, sm: 2.5, md: 4 },
          py: { xs: 1.5, sm: 3, md: 4 },
          marginTop: { xs: 8, sm: 9 }
        }}>

          {activeNav === "dashboard" && (
            <Box sx={{ width: '100%', display: 'grid', gap: { xs: 2.5, md: 4 }, maxWidth: 1440, mx: 'auto' }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3, md: 4 },
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)'
                }}
              >
                <Stack
                  direction={{ xs: 'column', lg: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'flex-start', lg: 'center' }}
                  justifyContent="space-between"
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.4 }}>
                      Dashboard overview
                    </Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ fontSize: { xs: '1.5rem', sm: '1.9rem', md: '2.25rem' }, lineHeight: 1.1 }}>
                      File intelligence workspace
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
                      The page is arranged into clear sections so the storage hub, actions, categories, and activity feed use the full screen without wasted space.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', lg: 'auto' } }}>
                    <Button variant="outlined" onClick={() => setActiveNav('files')} sx={{ borderRadius: 3, minWidth: { xs: '100%', sm: 150 } }}>
                      Open search
                    </Button>
                    <Button variant="contained" onClick={() => setActiveNav('upload')} sx={{ borderRadius: 3, minWidth: { xs: '100%', sm: 150 } }}>
                      Upload files
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 2fr) minmax(340px, 1fr)' }, gap: { xs: 2.5, md: 3.5 }, alignItems: 'start' }}>
                <ModernStorageHub
                  totalSize={stats.totalSize}
                  t={t}
                  token={authState.token}
                  onDeleteFile={async (id) => {
                    try {
                      await deleteFileMetadata(authState.token, id);
                      setFiles(prev => prev.filter(f => f._id !== id));
                      setMsg({ success: "File deleted successfully", error: "", warning: "" });
                    } catch (e) {
                      setMsg({ success: "", error: "Failed to delete file", warning: "" });
                    }
                  }}
                />

                <Stack spacing={3} sx={{ minWidth: 0 }}>
                  <QuickActions
                    onAction={(a) => {
                      if (a === 'upload') setActiveNav('upload');
                      if (a === 'search') setActiveNav('files');
                      if (a === 'settings') setActiveNav('settings');
                      if (a === 'share') setIsShareOpen(true);
                    }}
                    t={t}
                  />
                  
                </Stack>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3, md: 4 },
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={900}>{t.categories}</Typography>
                    <Typography variant="body2" color="text.secondary">Organized summaries by file type.</Typography>
                  </Box>
                </Stack>
                <Box sx={{ px: { xs: 0, sm: 0.5 } }}>
                  <CategoryCards
                    stats={{ images: stats.images, docs: stats.docs, code: stats.code, spreadsheets: stats.spreadsheets, presentations: stats.presentations, totalFiles: files.length }}
                    onCategoryClick={(cat) => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    t={t}
                  />
                </Box>
              </Paper>

              {selectedCategory && (
                <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid #0061FF33', bgcolor: '#FFFFFF' }} elevation={0}>
                  <Box
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 2,
                      flexDirection: { xs: 'column', sm: 'row' },
                      bgcolor: 'rgba(0, 97, 255, 0.02)'
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                      <Box sx={{ width: 8, height: 24, bgcolor: 'primary.main', borderRadius: 2, flexShrink: 0 }} />
                      <Typography variant="h6" fontWeight={900} color="primary" noWrap>
                        {selectedCategory.toUpperCase()} FILES
                      </Typography>
                    </Stack>
                    <Button variant="outlined" size="small" onClick={() => setSelectedCategory(null)} sx={{ borderRadius: 3, fontWeight: 700, px: 3, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
                      Close
                    </Button>
                  </Box>
                  <RecentFilesTable files={categorizedFiles} onDelete={handleDeleteFile} />
                </Paper>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 2fr) minmax(340px, 1fr)' }, gap: { xs: 2.5, md: 3.5 }, alignItems: 'start' }}>
                <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }} elevation={0}>
                  <Typography variant="h6" fontWeight={900} mb={1}>Recent activity</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    A live feed of recent uploads and indexing activity.
                  </Typography>
                  <ActivityFeed files={files} t={t} />
                </Paper>

                <Stack spacing={3} sx={{ minWidth: 0 }}>
                  <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }} elevation={0}>
                    <Typography variant="h6" fontWeight={900} mb={2}>{t.insights}</Typography>
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
                </Stack>
              </Box>
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
                onDelete={handleDeleteFile}
              />
            </Stack>
          )}

          {activeNav === "upload" && (
            <Box py={2} maxWidth={900} mx="auto">
              <Grid container spacing={4}>
                <Grid item xs={12} md={stagingFiles.length > 0 ? 6 : 12}>
                  <Paper sx={{ p: 6, border: '2px dashed #0061FF', bgcolor: 'rgba(0, 97, 255, 0.02)', borderRadius: 4, textAlign: 'center' }} elevation={0}>
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
              <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 300, border: '3px solid #0061FF' }}>
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
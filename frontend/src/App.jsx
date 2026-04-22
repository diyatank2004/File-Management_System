import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import AuthPanel from "./components/auth/AuthPanel";
import AppButton from "./components/common/AppButton";
import AppCard from "./components/common/AppCard";
import ConfirmDialog from "./components/common/ConfirmDialog";
import EmptyState from "./components/common/EmptyState";
import LoadingState from "./components/common/LoadingState";
import FileGrid from "./components/files/FileGrid";
import FileList from "./components/files/FileList";
import SearchFilterBar from "./components/files/SearchFilterBar";
import AppNavbar from "./components/layout/AppNavbar";
import AppSidebar from "./components/layout/AppSidebar";
import UploadPanel from "./components/upload/UploadPanel";
import { buildAppTheme } from "./theme";
import { classifyFileType, matchesDateFilter } from "./utils/fileHelpers";
import { extractTextFromFile } from "./utils/fileParsers";
import { MAX_FILE_SIZE } from "./utils/indexing";
import {
  addFileMetadata,
  clearSession,
  deleteFileMetadata,
  getFiles,
  getStoredToken,
  getStoredUser,
  login,
  signup,
  storeSession
} from "./services/api";

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25 }
};

function toUiFile(file) {
  return {
    id: file._id,
    name: file.filename,
    path: file.relativePath || file.filename,
    size: file.size,
    lastModified: file.createdAt,
    type: file.fileType,
    snippet: file.snippet || ""
  };
}

export default function App() {
  const [mode, setMode] = useState("light");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [viewMode, setViewMode] = useState("grid");

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);

  const [nameQuery, setNameQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const [pendingUploadFiles, setPendingUploadFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchMeta, setSearchMeta] = useState({ query: "", matched: 0 });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const theme = useMemo(() => buildAppTheme(mode), [mode]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const typeMatch = typeFilter === "all" || file.type === typeFilter;
      const dateMatch = matchesDateFilter(file.lastModified, dateFilter);
      return typeMatch && dateMatch;
    });
  }, [dateFilter, files, typeFilter]);

  const stats = useMemo(() => {
    const total = files.length;
    const images = files.filter((item) => item.type === "image").length;
    const docs = files.filter((item) => item.type === "document" || item.type === "pdf").length;
    const code = files.filter((item) => item.type === "code").length;

    return { total, images, docs, code };
  }, [files]);

  const handleLogout = (withMessage = true) => {
    clearSession();
    setToken(null);
    setUser(null);
    setFiles([]);
    setPendingUploadFiles([]);
    setIsUploading(false);
    setUploadProgress(0);
    setActiveNav("dashboard");

    if (withMessage) {
      toast.success("Logged out successfully");
    }
  };

  const loadFiles = async (authToken, query = "") => {
    if (!authToken) {
      return;
    }

    setFilesLoading(true);
    try {
      const data = await getFiles(authToken, query);
      setFiles((data.files || []).map(toUiFile));
      setSearchMeta(data.search || { query, matched: (data.files || []).length });
    } catch (error) {
      if (error.message.toLowerCase().includes("token")) {
        toast.error("Session expired. Please login again.");
        handleLogout(false);
      } else {
        toast.error(error.message);
      }
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      loadFiles(storedToken);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    if (!nameQuery.trim()) {
      loadFiles(token);
      return undefined;
    }

    if (nameQuery.trim().length < 3) {
      setSearchMeta({ query: nameQuery.trim(), matched: 0 });
      return undefined;
    }

    const timer = setTimeout(() => {
      loadFiles(token, nameQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [nameQuery, token]);

  const handleLogin = async (payload) => {
    setAuthLoading(true);
    try {
      const response = await login(payload);
      storeSession(response.token, response.user);
      setToken(response.token);
      setUser(response.user);
      setActiveNav("dashboard");
      toast.success("Login successful");
      await loadFiles(response.token);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (payload) => {
    setAuthLoading(true);
    try {
      const response = await signup(payload);
      storeSession(response.token, response.user);
      setToken(response.token);
      setUser(response.user);
      setActiveNav("dashboard");
      toast.success("Account created and logged in");
      await loadFiles(response.token);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFilesSelected = (selectedFiles) => {
    const supportedFiles = selectedFiles.filter((file) => file.size > 0 && file.size <= MAX_FILE_SIZE);

    if (supportedFiles.length !== selectedFiles.length) {
      toast.error("Some files were skipped. File size must be between 1 byte and 50 MB.");
    }

    if (!supportedFiles.length) {
      return;
    }

    const newItems = supportedFiles.map((file) => {
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      return {
        id:
          (window.crypto && window.crypto.randomUUID && window.crypto.randomUUID()) ||
          `${Date.now()}-${Math.random()}`,
        file,
        previewUrl
      };
    });

    setPendingUploadFiles((prev) => [...prev, ...newItems]);
    toast.success(`${newItems.length} file(s) ready for upload`);
  };

  const handleStartUpload = async () => {
    if (!pendingUploadFiles.length || isUploading || !token) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    await new Promise((resolve) => {
      let progress = 0;
      const timer = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);

        if (progress >= 100) {
          clearInterval(timer);
          resolve();
        }
      }, 120);
    });

    try {
      for (const upload of pendingUploadFiles) {
        const extractedContent = await extractTextFromFile(upload.file);
        await addFileMetadata(token, {
          filename: upload.file.name,
          fileType: classifyFileType(upload.file.name),
          size: upload.file.size,
          content: typeof extractedContent === "string" ? extractedContent.slice(0, 200000) : "",
          relativePath: upload.file.webkitRelativePath || upload.file.name
        });
      }

      pendingUploadFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      setPendingUploadFiles([]);
      setUploadProgress(100);
      setIsUploading(false);
      setActiveNav("files");
      toast.success("Files uploaded and indexed for content search");
      await loadFiles(token, nameQuery);
    } catch (error) {
      setIsUploading(false);
      toast.error(error.message);
    }
  };

  const requestDeleteFile = (file) => {
    setDeleteTarget(file);
  };

  const confirmDeleteFile = async () => {
    if (!deleteTarget || !token) {
      return;
    }

    try {
      await deleteFileMetadata(token, deleteTarget.id);
      setFiles((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success(`Deleted ${deleteTarget.name}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!token || !user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster position="top-right" />
        <AuthPanel onLogin={handleLogin} onSignup={handleSignup} loading={authLoading} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
        <Paper
          elevation={0}
          sx={{ p: { xs: 1.5, md: 2.5 }, border: "1px solid", borderColor: "divider" }}
        >
          <AppNavbar
            mode={mode}
            onToggleMode={() => setMode((prev) => (prev === "light" ? "dark" : "light"))}
            quickSearch={nameQuery}
            onQuickSearchChange={(value) => {
              setNameQuery(value);
              setActiveNav("files");
            }}
            userName={user.name}
            onLogout={() => handleLogout(true)}
          />
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={3} lg={2.5}>
              <AppSidebar activeNav={activeNav} onChangeNav={setActiveNav} />
            </Grid>

            <Grid item xs={12} md={9} lg={9.5}>
              <AnimatePresence mode="wait">
                <motion.div key={activeNav} {...PAGE_TRANSITION}>
                  {activeNav === "dashboard" && (
                    <Stack spacing={2}>
                      <Typography variant="h5">Dashboard</Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6} md={3}>
                          <AppCard sx={{ border: "1px solid", borderColor: "divider" }}>
                            <Typography variant="body2" color="text.secondary">
                              Total Files
                            </Typography>
                            <Typography variant="h5">{stats.total}</Typography>
                          </AppCard>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <AppCard sx={{ border: "1px solid", borderColor: "divider" }}>
                            <Typography variant="body2" color="text.secondary">
                              Documents
                            </Typography>
                            <Typography variant="h5">{stats.docs}</Typography>
                          </AppCard>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <AppCard sx={{ border: "1px solid", borderColor: "divider" }}>
                            <Typography variant="body2" color="text.secondary">
                              Images
                            </Typography>
                            <Typography variant="h5">{stats.images}</Typography>
                          </AppCard>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <AppCard sx={{ border: "1px solid", borderColor: "divider" }}>
                            <Typography variant="body2" color="text.secondary">
                              Code Files
                            </Typography>
                            <Typography variant="h5">{stats.code}</Typography>
                          </AppCard>
                        </Grid>
                      </Grid>

                      <AppCard sx={{ border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          Account Overview
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Logged in as: {user.name} ({user.email})
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                          <Chip label={mode === "light" ? "Light Mode" : "Dark Mode"} variant="outlined" />
                          <Chip label={`Your files: ${files.length}`} color="primary" variant="outlined" />
                        </Stack>
                      </AppCard>
                    </Stack>
                  )}

                  {activeNav === "files" && (
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        justifyContent="space-between"
                      >
                        <Typography variant="h5">Files</Typography>
                        <AppButton onClick={() => loadFiles(token)} disabled={filesLoading}>
                          {filesLoading ? "Refreshing..." : "Refresh Files"}
                        </AppButton>
                      </Stack>

                      <SearchFilterBar
                        nameQuery={nameQuery}
                        onNameQueryChange={setNameQuery}
                        typeFilter={typeFilter}
                        onTypeFilterChange={setTypeFilter}
                        dateFilter={dateFilter}
                        onDateFilterChange={setDateFilter}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                      />

                      {nameQuery.trim() && !filesLoading && (
                        <Typography variant="body2" color="text.secondary">
                          Found {searchMeta.matched} matching file(s) for "{nameQuery.trim()}".
                        </Typography>
                      )}

                      {filesLoading && (
                        <LoadingState
                          title="Loading your files"
                          subtitle="Fetching user-specific metadata from backend"
                        />
                      )}

                      {!filesLoading && !filteredFiles.length && (
                        <EmptyState
                          title="No files found"
                          description="Try a different search term or upload files from the Upload section."
                        />
                      )}

                      {!filesLoading &&
                        filteredFiles.length > 0 &&
                        (viewMode === "grid" ? (
                          <FileGrid
                            files={filteredFiles}
                            searchQuery={nameQuery}
                            onRequestDelete={requestDeleteFile}
                          />
                        ) : (
                          <FileList
                            files={filteredFiles}
                            searchQuery={nameQuery}
                            onRequestDelete={requestDeleteFile}
                          />
                        ))}
                    </Stack>
                  )}

                  {activeNav === "upload" && (
                    <Stack spacing={2}>
                      <Typography variant="h5">Upload</Typography>
                      <UploadPanel
                        pendingFiles={pendingUploadFiles}
                        uploadProgress={uploadProgress}
                        isUploading={isUploading}
                        onFilesSelected={handleFilesSelected}
                        onStartUpload={handleStartUpload}
                      />
                    </Stack>
                  )}

                  {activeNav === "settings" && (
                    <Stack spacing={2}>
                      <Typography variant="h5">Settings</Typography>
                      <AppCard sx={{ border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          Security
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          Your session uses a JWT token stored in localStorage. Use logout to clear
                          it any time.
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
                          <AppButton onClick={() => handleLogout(true)} color="error">
                            Logout
                          </AppButton>
                        </Stack>
                      </AppCard>
                    </Stack>
                  )}
                </motion.div>
              </AnimatePresence>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete file"
        description={
          deleteTarget
            ? `Are you sure you want to remove ${deleteTarget.name}? This action cannot be undone.`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteFile}
      />
    </ThemeProvider>
  );
}

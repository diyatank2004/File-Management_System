import React, { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";
import AuthPanel from "./components/auth/AuthPanel";
import ConfirmDialog from "./components/common/ConfirmDialog";
import EmptyState from "./components/common/EmptyState";
import LoadingState from "./components/common/LoadingState";
import FileGrid from "./components/files/FileGrid";
import FileList from "./components/files/FileList";
import SearchFilterBar from "./components/files/SearchFilterBar";
import AppNavbar from "./components/layout/AppNavbar";
import AppSidebar from "./components/layout/AppSidebar";
import UploadPanel from "./components/upload/UploadPanel";
import {
  addFileMetadata,
  clearSession,
  deleteAllFileMetadata,
  deleteFileMetadata,
  getFiles,
  getStoredToken,
  getStoredUser,
  login,
  signup,
  storeSession
} from "./services/api";
import { classifyFileType, formatBytes, matchesDateFilter } from "./utils/fileHelpers";
import { extractTextFromFile } from "./utils/fileParsers";
import { buildAppTheme } from "./theme";

function normalizeApiFile(file) {
  return {
    id: file._id,
    name: file.filename,
    path: file.relativePath || file.filename,
    type: file.fileType || classifyFileType(file.filename),
    size: file.size,
    lastModified: file.createdAt,
    snippet: file.snippet || ""
  };
}

export default function App() {
  const [mode, setMode] = useState("light");
  const [token, setToken] = useState(() => getStoredToken() || "");
  const [user, setUser] = useState(() => getStoredUser());

  const [authLoading, setAuthLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [files, setFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [activeNav, setActiveNav] = useState("dashboard");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [notifications, setNotifications] = useState([]);

  const [fileToDelete, setFileToDelete] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const appTheme = useMemo(() => buildAppTheme(mode), [mode]);
  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  function addNotification(type, message) {
    const timestamp = new Date().toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        message,
        timestamp,
        read: false
      },
      ...prev
    ].slice(0, 50));
  }

  function markNotificationsAsRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  function clearNotifications() {
    setNotifications([]);
  }

  async function loadFiles(activeToken, query) {
    if (!activeToken) {
      return;
    }

    setFilesLoading(true);
    try {
      const data = await getFiles(activeToken, query || "");
      const normalized = (data.files || []).map(normalizeApiFile);
      setFiles(normalized);
    } catch (error) {
      setErrorMessage(error.message || "Failed to fetch files");
    } finally {
      setFilesLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadFiles(token, searchQuery);
  }, [token, searchQuery]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [pendingFiles]);

  const visibleFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesType = typeFilter === "all" ? true : file.type === typeFilter;
      const matchesDate = matchesDateFilter(file.lastModified, dateFilter);
      return matchesType && matchesDate;
    });
  }, [dateFilter, files, typeFilter]);

  const dashboardStats = useMemo(() => {
    return files.reduce(
      (stats, file) => {
        stats.total += 1;
        stats.storage += file.size || 0;
        stats.byType[file.type] = (stats.byType[file.type] || 0) + 1;
        return stats;
      },
      { total: 0, storage: 0, byType: {} }
    );
  }, [files]);

  const recentFiles = useMemo(() => {
    return [...files]
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, 4);
  }, [files]);

  const topFileTypes = useMemo(() => {
    return Object.entries(dashboardStats.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({
        type,
        count,
        percentage: dashboardStats.total > 0 ? Math.round((count / dashboardStats.total) * 100) : 0
      }));
  }, [dashboardStats]);

  const weeklyUploadActivity = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      day.setHours(0, 0, 0, 0);

      days.push({
        key: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString(undefined, { weekday: "short" }),
        count: 0
      });
    }

    files.forEach((file) => {
      const date = new Date(file.lastModified);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().slice(0, 10);
      const match = days.find((item) => item.key === key);
      if (match) {
        match.count += 1;
      }
    });

    const maxCount = Math.max(...days.map((d) => d.count), 1);
    return {
      days,
      maxCount,
      totalUploads: days.reduce((sum, day) => sum + day.count, 0)
    };
  }, [files]);

  async function handleLogin(payload) {
    setAuthLoading(true);
    try {
      const data = await login(payload);
      setToken(data.token);
      setUser(data.user);
      storeSession(data.token, data.user);
      setSuccessMessage("Login successful");
    } catch (error) {
      setErrorMessage(error.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignup(payload) {
    setAuthLoading(true);
    try {
      const data = await signup(payload);
      setToken(data.token);
      setUser(data.user);
      storeSession(data.token, data.user);
      setSuccessMessage("Signup successful");
    } catch (error) {
      setErrorMessage(error.message || "Signup failed");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    clearSession();
    setToken("");
    setUser(null);
    setFiles([]);
    setPendingFiles([]);
    setNotifications([]);
    setSearchQuery("");
    setTypeFilter("all");
    setDateFilter("all");
  }

  function handleFilesSelected(newFiles) {
    const mapped = newFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : ""
    }));

    setPendingFiles((prev) => [...prev, ...mapped]);
    setSuccessMessage(`${newFiles.length} file(s) added to queue`);
  }

  async function handleStartUpload() {
    if (!token || pendingFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let uploadedCount = 0;
      let duplicateCount = 0;
      const retryQueue = [];
      const removeFromQueueIds = new Set();

      for (let i = 0; i < pendingFiles.length; i += 1) {
        const item = pendingFiles[i];

        try {
          const fileType = classifyFileType(item.file.name);
          const content = await extractTextFromFile(item.file);

          await addFileMetadata(token, {
            filename: item.file.name,
            fileType,
            size: item.file.size,
            content,
            relativePath: item.file.webkitRelativePath || item.file.name
          });

          uploadedCount += 1;
          removeFromQueueIds.add(item.id);
        } catch (error) {
          const message = String(error?.message || "Upload failed");
          const isDuplicate = message.toLowerCase().includes("duplicate file rejected");

          if (isDuplicate) {
            duplicateCount += 1;
            removeFromQueueIds.add(item.id);
          } else {
            retryQueue.push(item);
          }
        }

        const progress = Math.round(((i + 1) / pendingFiles.length) * 100);
        setUploadProgress(progress);
      }

      pendingFiles.forEach((item) => {
        if (removeFromQueueIds.has(item.id) && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      setPendingFiles(retryQueue);

      if (uploadedCount > 0) {
        await loadFiles(token, searchQuery);
      }

      if (uploadedCount > 0 || duplicateCount > 0) {
        const summaryParts = [];
        if (uploadedCount > 0) {
          summaryParts.push(`${uploadedCount} uploaded`);
          addNotification("success", `${uploadedCount} file(s) uploaded successfully`);
        }
        if (duplicateCount > 0) {
          summaryParts.push(`${duplicateCount} duplicate rejected`);
          addNotification("warning", `${duplicateCount} duplicate file(s) were rejected`);
        }
        setSuccessMessage(summaryParts.join(". "));
      }

      if (retryQueue.length > 0) {
        addNotification("error", `${retryQueue.length} file(s) failed and remain in queue`);
        setErrorMessage(`${retryQueue.length} file(s) failed and remain in queue.`);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDeleteFile() {
    if (!fileToDelete || !token) {
      return;
    }

    try {
      await deleteFileMetadata(token, fileToDelete.id);
      setFiles((prev) => prev.filter((item) => item.id !== fileToDelete.id));
      setSuccessMessage("File deleted");
    } catch (error) {
      setErrorMessage(error.message || "Delete failed");
    } finally {
      setFileToDelete(null);
    }
  }

  async function handleDeleteAll() {
    if (!token) {
      return;
    }

    try {
      await deleteAllFileMetadata(token);
      setFiles([]);
      setSuccessMessage("All file metadata deleted");
    } catch (error) {
      setErrorMessage(error.message || "Delete all failed");
    } finally {
      setConfirmDeleteAll(false);
    }
  }

  if (!token) {
    return (
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <AuthPanel onLogin={handleLogin} onSignup={handleSignup} loading={authLoading} />
        <Snackbar
          open={Boolean(errorMessage)}
          autoHideDuration={3500}
          onClose={() => setErrorMessage("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          <AppNavbar
            mode={mode}
            onToggleMode={() => setMode((prev) => (prev === "light" ? "dark" : "light"))}
            quickSearch={searchQuery}
            onQuickSearchChange={setSearchQuery}
            userName={user?.name || "User"}
            userEmail={user?.email || ""}
            userCreatedAt={user?.createdAt || ""}
            notifications={notifications}
            unreadNotificationCount={unreadNotificationCount}
            onOpenNotifications={markNotificationsAsRead}
            onClearNotifications={clearNotifications}
            onLogout={handleLogout}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={2.5} lg={2}>
              <AppSidebar activeNav={activeNav} onChangeNav={setActiveNav} />
            </Grid>
            <Grid item xs={12} md={9.5} lg={10}>
              <Stack spacing={2}>
                {activeNav === "dashboard" && (
                  <>
                    {filesLoading ? (
                      <LoadingState title="Loading dashboard..." subtitle="Fetching latest file insights" />
                    ) : (
                      <Stack spacing={2}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                          spacing={1}
                        >
                          <Box>
                            <Typography variant="h6">Dashboard Overview</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Track your documents, activity trends, and file type distribution.
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button variant="outlined" onClick={() => setActiveNav("files")}>Browse Files</Button>
                            <Button variant="contained" onClick={() => setActiveNav("upload")}>Upload New</Button>
                          </Stack>
                        </Stack>

                        <Grid container spacing={1.5}>
                          <Grid item xs={12} sm={6} lg={3}>
                            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
                              <Typography variant="body2" color="text.secondary">Total Files</Typography>
                              <Typography variant="h5">{dashboardStats.total}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} lg={3}>
                            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
                              <Typography variant="body2" color="text.secondary">Storage Used</Typography>
                              <Typography variant="h5">{formatBytes(dashboardStats.storage)}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} lg={3}>
                            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
                              <Typography variant="body2" color="text.secondary">Active File Types</Typography>
                              <Typography variant="h5">{Object.keys(dashboardStats.byType).length}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} lg={3}>
                            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
                              <Typography variant="body2" color="text.secondary">Uploads (7 Days)</Typography>
                              <Typography variant="h5">{weeklyUploadActivity.totalUploads}</Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        <Grid container spacing={1.5}>
                          <Grid item xs={12} lg={6}>
                            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", height: "100%" }}>
                              <Typography variant="subtitle1" fontWeight={700}>Top File Types</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Distribution of the most common document types in your account.
                              </Typography>

                              {topFileTypes.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">No data yet.</Typography>
                              ) : (
                                <Stack spacing={1.4}>
                                  {topFileTypes.map((item) => (
                                    <Box key={item.type}>
                                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{item.type}</Typography>
                                        <Typography variant="caption" color="text.secondary">{item.count} files ({item.percentage}%)</Typography>
                                      </Stack>
                                      <Box sx={{ height: 8, borderRadius: 999, bgcolor: "action.hover", overflow: "hidden" }}>
                                        <Box
                                          sx={{
                                            width: `${item.percentage}%`,
                                            height: "100%",
                                            bgcolor: "primary.main"
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  ))}
                                </Stack>
                              )}
                            </Box>
                          </Grid>

                          <Grid item xs={12} lg={6}>
                            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", height: "100%" }}>
                              <Typography variant="subtitle1" fontWeight={700}>Last 7 Days Activity</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Daily upload count for the past week.
                              </Typography>

                              <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ minHeight: 120 }}>
                                {weeklyUploadActivity.days.map((day) => {
                                  const height = Math.max(8, Math.round((day.count / weeklyUploadActivity.maxCount) * 84));
                                  return (
                                    <Box key={day.key} sx={{ flex: 1, textAlign: "center" }}>
                                      <Box
                                        sx={{
                                          height,
                                          borderRadius: 1,
                                          bgcolor: day.count > 0 ? "secondary.main" : "action.disabledBackground",
                                          transition: "0.2s ease"
                                        }}
                                      />
                                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.6 }}>
                                        {day.label}
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: "block" }}>
                                        {day.count}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Stack>
                            </Box>
                          </Grid>
                        </Grid>

                        <Typography variant="h6" sx={{ mt: 1 }}>Recent Files</Typography>
                        {recentFiles.length === 0 ? (
                          <EmptyState
                            title="No recent files"
                            description="Upload files to populate your dashboard overview."
                          />
                        ) : (
                          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
                            {recentFiles.map((file, index) => (
                              <Box
                                key={file.id}
                                sx={{
                                  p: 1.5,
                                  borderTop: index === 0 ? "none" : "1px solid",
                                  borderColor: "divider"
                                }}
                              >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap>
                                      {file.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {file.path}
                                    </Typography>
                                  </Box>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                                      {file.type}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatBytes(file.size)}
                                    </Typography>
                                  </Stack>
                                </Stack>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Stack>
                    )}
                  </>
                )}

                {activeNav === "files" && (
                  <>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", md: "center" }}
                    >
                      <Box>
                        <Typography variant="h6">Files</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Search, filter, and manage your indexed files.
                        </Typography>
                      </Box>
                      <Button
                        color="error"
                        variant="outlined"
                        onClick={() => setConfirmDeleteAll(true)}
                        disabled={files.length === 0}
                      >
                        Delete All Files
                      </Button>
                    </Stack>

                    <SearchFilterBar
                      nameQuery={searchQuery}
                      onNameQueryChange={setSearchQuery}
                      typeFilter={typeFilter}
                      onTypeFilterChange={setTypeFilter}
                      dateFilter={dateFilter}
                      onDateFilterChange={setDateFilter}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                    />

                    {filesLoading ? (
                      <LoadingState />
                    ) : visibleFiles.length === 0 ? (
                      <EmptyState
                        title="No files found"
                        description="Upload files or change filters to view matching records."
                      />
                    ) : viewMode === "grid" ? (
                      <FileGrid
                        files={visibleFiles}
                        searchQuery={searchQuery}
                        onRequestDelete={setFileToDelete}
                      />
                    ) : (
                      <FileList
                        files={visibleFiles}
                        searchQuery={searchQuery}
                        onRequestDelete={setFileToDelete}
                      />
                    )}
                  </>
                )}

                {activeNav === "upload" && (
                  <UploadPanel
                    pendingFiles={pendingFiles}
                    uploadProgress={uploadProgress}
                    isUploading={isUploading}
                    onFilesSelected={handleFilesSelected}
                    onStartUpload={handleStartUpload}
                  />
                )}

              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Container>

      <ConfirmDialog
        open={Boolean(fileToDelete)}
        title="Delete file"
        description={fileToDelete ? `Delete ${fileToDelete.name}?` : "Delete this file?"}
        onCancel={() => setFileToDelete(null)}
        onConfirm={handleDeleteFile}
      />

      <ConfirmDialog
        open={confirmDeleteAll}
        title="Delete all files"
        description="This will remove all indexed file metadata for your account."
        onCancel={() => setConfirmDeleteAll(false)}
        onConfirm={handleDeleteAll}
      />

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={3500}
        onClose={() => setErrorMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={2500}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

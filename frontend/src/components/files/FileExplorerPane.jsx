import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Grid,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Typography,
    Divider,
    Stack,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
} from "@mui/material";
import {
    InsertDriveFile,
    Image,
    AudioFile,
    Description,
} from "@mui/icons-material";
import FilePanePreview from "./FilePanePreview";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

export default function FileExplorerPane({
    files = [],
    searchQuery = "",
    onDelete = null
}) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // 1. Calculate pagination parameters properly
    const totalPages = Math.max(1, Math.ceil(files.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const paginatedFiles = useMemo(
        () => files.slice(startIndex, endIndex),
        [files, startIndex, endIndex]
    );

    // 2. CORRECTION: Reset page ONLY when total array size changes or search query filters it
    // Auto-selects the first file of the CURRENT page safely.
    useEffect(() => {
        if (paginatedFiles.length > 0) {
            // Only auto-select if the current selected file isn't in the active page view
            const isSelectedFileInView = paginatedFiles.some(f => f.id === selectedFile?.id);
            if (!isSelectedFileInView) {
                setSelectedFile(paginatedFiles[0]);
            }
        } else {
            setSelectedFile(null);
        }
    }, [paginatedFiles, selectedFile?.id]);

    // Reset to page 1 only if total files count changes (e.g. a new search query runs)
    useEffect(() => {
        setCurrentPage(1);
    }, [files.length]);

    // Handle page change
    const handlePageChange = (event, newPage) => {
        setCurrentPage(newPage);
    };

    // Handle items per page change
    const handleItemsPerPageChange = (event) => {
        setItemsPerPage(event.target.value);
        setCurrentPage(1);
    };

    // Handle file selection with loading simulation
    const handleFileSelect = (file) => {
        if (selectedFile?.id === file.id) return; // Avoid re-triggering for already selected file
        setIsLoadingPreview(true);
        setSelectedFile(file);
        const timer = setTimeout(() => setIsLoadingPreview(false), 200);
        return () => clearTimeout(timer);
    };

    // Get appropriate file icon
    const getFileIcon = (file) => {
        const mimetype = file.mimetype?.toLowerCase() || "";
        if (mimetype.includes("image")) {
            return <Image sx={{ fontSize: 20, color: "#0061FF" }} />;
        }
        if (mimetype.includes("audio") || mimetype.includes("music")) {
            return <AudioFile sx={{ fontSize: 20, color: "#F59E0B" }} />;
        }
        return <Description sx={{ fontSize: 20, color: "#EF4444" }} />;
    };

    // Format file size
    const formatSize = (bytes) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <Grid container spacing={3} sx={{ minHeight: "75vh", alignItems: "stretch" }}>
            {/* LEFT PANE: Paginated File List */}
            <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={2} sx={{ height: "100%" }}>
                    {/* Pagination Controls */}
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "#F8FAFC",
                        }}
                    >
                        <Stack spacing={1.5}>
                            {/* Items Per Page Selector */}
                            <FormControl fullWidth size="small">
                                <InputLabel>Items per page</InputLabel>
                                <Select
                                    label="Items per page"
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    sx={{ borderRadius: 2 }}
                                >
                                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option} items
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Results Summary */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    {files.length === 0 ? "No results" : `${startIndex + 1}–${Math.min(endIndex, files.length)} of ${files.length}`}
                                </Typography>
                                {totalPages > 1 && (
                                    <Chip
                                        label={`Page ${currentPage} of ${totalPages}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        </Stack>
                    </Paper>

                    {/* File List */}
                    <Paper
                        variant="outlined"
                        sx={{
                            flex: 1,
                            borderRadius: 2,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {paginatedFiles.length === 0 ? (
                            <Box
                                sx={{
                                    p: 3,
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flex: 1,
                                }}
                            >
                                <InsertDriveFile
                                    sx={{ fontSize: 48, color: "text.disabled", mb: 1, opacity: 0.3 }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    No documents match that phrase.
                                </Typography>
                            </Box>
                        ) : (
                            <List sx={{ p: 0, overflowY: "auto", flex: 1 }}>
                                {paginatedFiles.map((file, index) => {
                                    const isSelected = selectedFile?.id === file.id;
                                    return (
                                        <React.Fragment key={file.id}>
                                            <ListItemButton
                                                selected={isSelected}
                                                onClick={() => handleFileSelect(file)}
                                                sx={{
                                                    py: 1.75,
                                                    px: 2,
                                                    borderLeft: isSelected ? "4px solid #0061FF" : "4px solid transparent",
                                                    backgroundColor: isSelected ? "rgba(0, 97, 255, 0.08)" : "transparent",
                                                    transition: "all 0.2s ease",
                                                    "&:hover": {
                                                        backgroundColor: "rgba(0, 97, 255, 0.04)",
                                                    },
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    {getFileIcon(file)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={file.filename || file.name}
                                                    secondary={formatSize(file.size)}
                                                    primaryTypographyProps={{
                                                        variant: "body2",
                                                        fontWeight: isSelected ? 600 : 500,
                                                        noWrap: true,
                                                        sx: { color: isSelected ? "#0061FF" : "#1E293B" },
                                                    }}
                                                    secondaryTypographyProps={{
                                                        variant: "caption",
                                                        noWrap: true,
                                                    }}
                                                />
                                            </ListItemButton>
                                            {index < paginatedFiles.length - 1 && (
                                                <Divider sx={{ my: 0 }} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </List>
                        )}
                    </Paper>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                size="small"
                                sx={{
                                    "& .MuiPaginationItem-root": {
                                        borderRadius: 1.5,
                                    },
                                }}
                            />
                        </Box>
                    )}
                </Stack>
            </Grid>

            {/* RIGHT PANE: Dynamic Single Document Preview */}
            <Grid item xs={12} md={8}>
                <FilePanePreview
                    file={selectedFile}
                    searchQuery={searchQuery}
                    onDelete={onDelete}
                    isLoading={isLoadingPreview}
                />
            </Grid>
        </Grid>
    );
}
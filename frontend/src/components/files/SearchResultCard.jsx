import React from "react";
import { Paper, Box, Stack, Typography, IconButton, Chip } from "@mui/material";
import {
    Description, Image, Audiotrack, DeleteOutline, MoreVert
} from "@mui/icons-material";

// Utility helper to safely escape string items for dynamic RegExp parsing
function escapeRegex(text = "") {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function SearchResultCard({ file, query, onDelete }) {
    // Helper to get the correct icon based on mimetype
    const getFileIcon = (mime) => {
        const type = mime?.toLowerCase() || "";
        if (type.includes("image")) return <Image color="primary" sx={{ fontSize: 28 }} />;
        if (type.includes("audio") || type.includes("music") || type.includes("mp3")) {
            return <Audiotrack color="warning" sx={{ fontSize: 28 }} />;
        }
        return <Description color="error" sx={{ fontSize: 28 }} />; // Default to doc icon
    };

    // Format file sizes nicely
    const formatSize = (bytes) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <Paper
            sx={{
                p: 2.5,
                borderRadius: 4,
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justify: "space-between",
                position: "relative",
                boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.02)"
            }}
            elevation={0}
        >
            <Box>
                {/* Top bar: Icon and options menu indicator */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box sx={{ p: 1, bgcolor: "rgba(0, 0, 0, 0.02)", borderRadius: 2.5, display: "flex" }}>
                        {getFileIcon(file.mimetype)}
                    </Box>
                    <IconButton size="small" disabled>
                        <MoreVert sx={{ fontSize: 18 }} />
                    </IconButton>
                </Stack>

                {/* Filename */}
                <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    noWrap
                    sx={{ color: "#1E293B", mb: 0.5 }}
                    title={file.filename || file.name}
                >
                    {file.filename || file.name}
                </Typography>

                {/* Virtual Path or Subtext folder display */}
                <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mb: 1.5 }}>
                    {file.relativePath ? `Root${file.relativePath}` : (file.path ? `Root/${file.path}` : "Main Storage")}
                </Typography>

                {/* Highlighted text match snippet block */}
                <Box
                    sx={{
                        bgcolor: "#F8FAFC",
                        p: 1.5,
                        borderRadius: 3,
                        minHeight: 80,
                        maxHeight: 110,
                        overflow: "hidden",
                        mb: 2,
                        border: "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center"
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: "#64748B",
                            lineHeight: 1.6,
                            fontSize: "0.75rem",
                            // FIX: Checking against both fallback variables returned by your backend layout
                            fontStyle: (!file.snippet && !file.content && !file.extractedText) ? "italic" : "normal"
                        }}
                    >
                        {(() => {
                            // FIX: Prioritizes the context-sliced snippet returned by the backend first, then falls back
                            const rawText = file.snippet || file.content || file.extractedText || "";

                            // Fallback system response if zero text text exists inside database document
                            if (!rawText) {
                                return "Document indexed successfully. Content preview is processing or unavailable.";
                            }

                            // If there is text context but no keyword query input, safely chop it to fit the layout
                            if (!query || !query.trim()) {
                                return rawText.length > 160 ? rawText.substring(0, 160) + "..." : rawText;
                            }

                            const cleanQuery = query.trim();

                            try {
                                const parts = rawText.split(new RegExp(`(${escapeRegex(cleanQuery)})`, "gi"));
                                return parts.map((part, index) =>
                                    part.toLowerCase() === cleanQuery.toLowerCase() ? (
                                        <span
                                            key={index}
                                            style={{
                                                backgroundColor: "#FEF08A",
                                                color: "#854D0E",
                                                fontWeight: "700",
                                                padding: "2px 4px",
                                                borderRadius: "4px"
                                            }}
                                        >
                                            {part}
                                        </span>
                                    ) : (
                                        part
                                    )
                                );
                            } catch (e) {
                                return rawText.length > 160 ? rawText.substring(0, 160) + "..." : rawText;
                            }
                        })()}
                    </Typography>
                </Box>
            </Box>

            {/* Footer bar containing file info pill and delete actions */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip
                    label={(file.mimetype?.split("/")[1] || file.fileType || "File").toUpperCase()}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: "0.65rem", bgcolor: "#E2E8F0", color: "#475569" }}
                />
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                        {formatSize(file.size)}
                    </Typography>
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(file._id || file.id)}
                        sx={{ ml: 1 }}
                    >
                        <DeleteOutline sx={{ fontSize: 18 }} />
                    </IconButton>
                </Stack>
            </Stack>
        </Paper>
    );
}
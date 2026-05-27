import React, { useState } from "react";
import { Paper, Box, Stack, Typography, IconButton, Chip, Button, CircularProgress } from "@mui/material";
import {
    Description, Image, CodeOutlined, DeleteOutline, MoreVert, AutoAwesome
} from "@mui/icons-material";
import { summarizeTextLocally } from "../../services/aiSummarizer";

// Utility helper to safely escape string items for dynamic RegExp parsing
function escapeRegex(text = "") {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function SearchResultCard({ file, query, onDelete }) {
    const [summary, setSummary] = useState("");
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState("");

    // Helper to get the correct icon based on normalized file type
    const getFileIcon = () => {
        const type = (file.fileType || file.type || file.mimetype || "").toLowerCase();
        if (type.includes("image")) return <Image color="primary" sx={{ fontSize: 28 }} />;
        if (type.includes("code") || type.includes("javascript") || type.includes("typescript") || type.includes("json") || type.includes("xml") || type.includes("python")) {
            return <CodeOutlined color="secondary" sx={{ fontSize: 28 }} />;
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

    // Extract the raw text for AI processing
    const rawContentText = file.content || file.extractedText || file.snippet || "";

    // Trigger local client-side AI summarization
    const handleTriggerSummary = async () => {
        if (!rawContentText.trim()) return;
        setLoadingSummary(true);
        setSummaryError("");
        setSummary("");

        try {
            await summarizeTextLocally(rawContentText, (streamedChunk) => {
                setSummary(streamedChunk);
            });
        } catch (err) {
            setSummaryError("Local AI engine was unable to initialize on this hardware profile.");
        } finally {
            setLoadingSummary(false);
        }
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
                justifyContent: "space-between",
                position: "relative",
                boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.02)"
            }}
            elevation={0}
        >
            <Box>
                {/* Top bar: Icon and options menu indicator */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box sx={{ p: 1, bgcolor: "rgba(0, 0, 0, 0.02)", borderRadius: 2.5, display: "flex" }}>
                        {getFileIcon()}
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
                            fontStyle: !rawContentText ? "italic" : "normal"
                        }}
                    >
                        {(() => {
                            if (!rawContentText) {
                                return "Document indexed successfully. Content preview is processing or unavailable.";
                            }

                            if (!query || !query.trim()) {
                                return rawContentText.length > 160 ? rawContentText.substring(0, 160) + "..." : rawContentText;
                            }

                            const cleanQuery = query.trim();

                            try {
                                const parts = rawContentText.split(new RegExp(`(${escapeRegex(cleanQuery)})`, "gi"));
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
                                return rawContentText.length > 160 ? rawContentText.substring(0, 160) + "..." : rawContentText;
                            }
                        })()}
                    </Typography>
                </Box>

                {/* local privacy-first ai summarizer engine widget */}
                {rawContentText && (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            mb: 2,
                            bgcolor: 'rgba(0, 97, 255, 0.01)',
                            borderStyle: 'dashed',
                            borderColor: '#0061FF33'
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <AutoAwesome color="primary" sx={{ fontSize: 16 }} />
                                <Typography variant="caption" fontWeight={800} color="primary" sx={{ letterSpacing: '0.03em' }}>
                                    LOCAL AI
                                </Typography>
                            </Stack>

                            {!summary && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={loadingSummary ? <CircularProgress size={10} color="inherit" /> : <AutoAwesome sx={{ fontSize: 12 }} />}
                                    onClick={handleTriggerSummary}
                                    disabled={loadingSummary}
                                    sx={{ borderRadius: 2, fontSize: '0.65rem', py: 0.2, px: 1, textTransform: 'none', fontWeight: 700 }}
                                >
                                    {loadingSummary ? "Analyzing..." : "Summarize"}
                                </Button>
                            )}
                        </Stack>

                        {summaryError && (
                            <Typography variant="caption" color="error" display="block" sx={{ mt: 1, fontSize: '0.65rem' }}>
                                {summaryError}
                            </Typography>
                        )}

                        {summary && (
                            <Box sx={{ mt: 1.5, p: 1, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E2E8F0', maxHeight: 120, overflowY: 'auto' }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ whiteSpace: 'pre-line', lineHeight: 1.5, fontSize: '0.7rem', display: 'block' }}
                                >
                                    {summary}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                )}
            </Box>

            {/* Footer bar containing file info pill and delete actions */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip
                    label={(file.fileType || file.mimetype?.split("/")[1] || "File").toUpperCase()}
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
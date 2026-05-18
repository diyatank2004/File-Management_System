import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  FolderOpen,
  Download,
  Share,
  DeleteOutline,
  MoreVert,
} from "@mui/icons-material";

export default function FilePanePreview({ file, searchQuery, onDelete, isLoading = false }) {
  const [highlightedContent, setHighlightedContent] = useState("");

  useEffect(() => {
    if (!file) {
      setHighlightedContent("");
      return;
    }

    // Highlight search query in content
    const content = file.snippet || file.content || file.extractedText || "";
    if (!content || !searchQuery || !searchQuery.trim()) {
      setHighlightedContent(content);
      return;
    }

    try {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escapedQuery})`, "gi");
      const parts = content.split(regex);

      setHighlightedContent(
        parts.map((part, index) =>
          regex.test(part) ? (
            <span
              key={index}
              style={{
                backgroundColor: "#FEF08A",
                color: "#854D0E",
                fontWeight: "700",
                padding: "2px 4px",
                borderRadius: "4px",
              }}
            >
              {part}
            </span>
          ) : (
            part
          )
        )
      );
    } catch (e) {
      setHighlightedContent(content);
    }
  }, [file, searchQuery]);

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown";
    }
  };

  // Get file type color
  const getFileTypeColor = (mimetype) => {
    const type = mimetype?.toLowerCase() || "";
    if (type.includes("image")) return "info";
    if (type.includes("pdf")) return "error";
    if (type.includes("audio") || type.includes("music")) return "warning";
    if (type.includes("doc") || type.includes("word") || type.includes("text"))
      return "success";
    return "default";
  };

  if (!file) {
    return (
      <Paper
        variant="outlined"
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          borderRadius: 2,
          bgcolor: "#F8FAFC",
        }}
      >
        <FolderOpen sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          Select a document from the left pane to view its details and indexed content.
        </Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <Paper
        variant="outlined"
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          borderRadius: 2,
        }}
      >
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading preview...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Header Section with Metadata */}
      <Box
        sx={{
          p: 3,
          bgcolor: "#F8FAFC",
          borderBottom: "1px solid #E2E8F0",
          flexShrink: 0,
        }}
      >
        {/* Title and Actions Bar */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ wordBreak: "break-word", mb: 0.5 }}
            >
              {file.filename || file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {file.relativePath
                ? `Root${file.relativePath}`
                : file.path
                  ? `Root/${file.path}`
                  : "Main Storage"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Share">
              <IconButton size="small" color="primary" disabled>
                <Share sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton size="small" color="primary" disabled>
                <Download sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete && onDelete(file._id || file.id)}
              >
                <DeleteOutline sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Metadata Grid */}
        <Stack spacing={1.5}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {/* File Type */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Type
              </Typography>
              <Chip
                label={(file.mimetype?.split("/")[1] || file.fileType || "File").toUpperCase()}
                size="small"
                color={getFileTypeColor(file.mimetype)}
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>

            {/* File Size */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Size
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                {formatSize(file.size)}
              </Typography>
            </Box>

            {/* Last Modified */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Modified
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {formatDate(file.lastModified || file.createdAt)}
              </Typography>
            </Box>

            {/* Indexed Status */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Status
              </Typography>
              <Chip
                label="Indexed"
                size="small"
                color="success"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Content Preview Section */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 3, bgcolor: "#FFFFFF" }}>
        <Typography
          variant="caption"
          fontWeight={600}
          color="primary"
          display="block"
          sx={{ mb: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}
        >
          Extracted Content Preview
        </Typography>

        <Box
          sx={{
            p: 2,
            bgcolor: "#F8FAFC",
            borderRadius: 2,
            border: "1px solid #E2E8F0",
            minHeight: 150,
            maxHeight: "calc(100% - 40px)",
            overflowY: "auto",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            color: "#475569",
          }}
        >
          {!highlightedContent ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontStyle: "italic" }}
            >
              Document indexed successfully. Content preview is processing or unavailable.
            </Typography>
          ) : (
            <Typography
              variant="body2"
              component="div"
              sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {highlightedContent}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

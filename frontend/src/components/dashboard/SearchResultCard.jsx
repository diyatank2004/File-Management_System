import React from 'react';
import { Paper, Box, Typography, Stack, Chip, IconButton, Tooltip } from '@mui/material';
import {
    Description, Image, MusicNote, InsertDriveFile,
    MoreVert, DeleteOutline, FileDownload
} from '@mui/icons-material';

export default function SearchResultCard({ file, query = "", onDelete }) {
    const getFileIcon = (type) => {
        switch (type) {
            case 'image': return <Image sx={{ fontSize: 32, color: '#3B82F6' }} />;
            case 'pdf': return <Description sx={{ fontSize: 32, color: '#EF4444' }} />;
            case 'music': return <MusicNote sx={{ fontSize: 32, color: '#F59E0B' }} />;
            default: return <InsertDriveFile sx={{ fontSize: 32, color: '#64748B' }} />;
        }
    };

    const highlightMatch = (text, q) => {
        if (!q || !text) return text;
        const parts = text.split(new RegExp(`(${q})`, 'gi'));
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === q.toLowerCase() ?
                        <Box key={i} component="span" sx={{ bgcolor: '#FDE047', px: 0.2, borderRadius: 0.5, fontWeight: 700, color: 'black' }}>{part}</Box> :
                        part
                )}
            </>
        );
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: 4,
                border: '1px solid #E2E8F0',
                bgcolor: 'white',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                position: 'relative',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                    borderColor: '#3B82F6'
                }
            }}
        >
            {/* Top Row: Icon and Menu */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box sx={{
                    bgcolor: '#F8FAFC',
                    p: 1.5,
                    borderRadius: 3,
                    display: 'flex',
                    border: '1px solid #F1F5F9'
                }}>
                    {getFileIcon(file.fileType)}
                </Box>
                <IconButton size="small" sx={{ mt: -0.5, mr: -0.5 }}>
                    <MoreVert fontSize="small" />
                </IconButton>
            </Stack>

            {/* File Info */}
            <Box mb={2}>
                <Typography variant="subtitle1" fontWeight={800} noWrap title={file.filename}>
                    {file.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                    {file.relativePath || "Root Directory"} • {new Date(file.createdAt).toLocaleDateString()}
                </Typography>
            </Box>

            {/* Snippet Area */}
            <Box sx={{
                flex: 1,
                mb: 2,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                minHeight: '80px'
            }}>
                <Typography
                    variant="body2"
                    sx={{
                        color: '#475569',
                        lineHeight: 1.5,
                        fontSize: '0.85rem',
                        fontStyle: file.snippet ? 'normal' : 'italic'
                    }}
                >
                    {file.snippet ? (
                        highlightMatch(file.snippet, query)
                    ) : (
                        "No direct content match found in the extracted text."
                    )}
                </Typography>
            </Box>

            {/* Footer */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mt="auto" pt={2} borderTop="1px solid #F1F5F9">
                <Chip
                    label={file.fileType === 'pdf' ? 'pdf' : file.fileType}
                    size="small"
                    sx={{
                        height: 24,
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        bgcolor: '#F1F5F9',
                        color: '#64748B',
                        borderRadius: 1.5
                    }}
                />

                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                        {(file.size / 1024).toFixed(1)} KB
                    </Typography>
                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(file._id)}
                            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                        >
                            <DeleteOutline fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>
        </Paper>
    );
}

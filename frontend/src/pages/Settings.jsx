import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Stack, Button, MenuItem, Select, FormControl, InputLabel, Divider, IconButton, Tooltip } from '@mui/material';
import { Language, DeleteSweep, Info, History, PlayCircleFilled, DeleteOutline } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { getFiles, deleteFileMetadata, deleteAllFileMetadata } from '../services/api';

export default function Settings({ language, setLanguage, startGuide, token }) {
    const [msg, setMsg] = useState('');
    const [showAbout, setShowAbout] = useState(false);
    const [files, setFiles] = useState([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    const handleClear = (type) => {
        setMsg(`${type} cleared successfully.`);
        setTimeout(() => setMsg(''), 3000);
    };

    const refreshFiles = async () => {
        if (!token) return;
        setIsLoadingFiles(true);
        try {
            const data = await getFiles(token);
            const fetchedFiles = Array.isArray(data) ? data : data.files || [];
            setFiles(fetchedFiles);
        } catch (err) {
            console.error('Settings load files error:', err);
            setMsg('Unable to refresh uploaded files.');
        } finally {
            setIsLoadingFiles(false);
        }
    };

    useEffect(() => {
        refreshFiles();
    }, [token]);

    const clearCache = async () => {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        localStorage.removeItem('sfm_search_history');
        localStorage.removeItem('sfm_recent_queries');
        setMsg('Cache cleared successfully.');
        setTimeout(() => setMsg(''), 3000);
    };

    const clearAllFiles = async () => {
        if (!token) {
            setMsg('Unable to delete files: missing auth token.');
            return;
        }
        try {
            await deleteAllFileMetadata(token);
            setFiles([]);
            setMsg('All uploaded files have been deleted.');
        } catch (err) {
            console.error('Clear all files error:', err);
            setMsg('Failed to delete all files.');
        } finally {
            setTimeout(() => setMsg(''), 3000);
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!token) {
            setMsg('Unable to delete file: missing auth token.');
            return;
        }
        try {
            await deleteFileMetadata(token, fileId);
            setFiles((prev) => prev.filter((file) => file._id !== fileId));
            setMsg('File deleted successfully.');
        } catch (err) {
            console.error('Delete file error:', err);
            setMsg('Failed to delete file.');
        } finally {
            setTimeout(() => setMsg(''), 3000);
        }
    };

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4, position: 'relative' }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={6}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 4, color: 'white' }}>
                    <Language fontSize="large" />
                </Box>
                <Box>
                    <Typography variant="h3" fontWeight={900} letterSpacing="-2px">SETTINGS</Typography>
                    <Typography variant="body1" color="text.secondary">MANAGE YOUR PREFERENCES AND DATA</Typography>
                </Box>
            </Stack>

            {msg && (
                <Paper sx={{ p: 2, mb: 4, bgcolor: '#10B981', color: 'white', fontWeight: 700, borderRadius: 3 }} elevation={0}>
                    {msg}
                </Paper>
            )}

            <Grid container spacing={4}>
                <Grid item xs={12} lg={7}>
                    <Stack spacing={3}>
                        <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid #E2E8F0' }} elevation={0}>
                            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                                <Language color="primary" />
                                <Typography variant="h6" fontWeight={800}>Language & Localization</Typography>
                            </Stack>
                            <FormControl fullWidth>
                                <InputLabel>System Language</InputLabel>
                                <Select
                                    value={language}
                                    label="System Language"
                                    onChange={(e) => setLanguage(e.target.value)}
                                    sx={{ borderRadius: 3 }}
                                >
                                    <MenuItem value="English">English (Global)</MenuItem>
                                    <MenuItem value="Hindi">Hindi (India)</MenuItem>
                                    <MenuItem value="Marathi">Marathi (मराठी)</MenuItem>
                                    <MenuItem value="Spanish">Spanish</MenuItem>
                                    <MenuItem value="French">French</MenuItem>
                                </Select>
                            </FormControl>
                        </Paper>

                        <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid #E2E8F0' }} elevation={0}>
                            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                                <History color="primary" />
                                <Typography variant="h6" fontWeight={800}>Data Management</Typography>
                            </Stack>

                            <Stack spacing={2}>
                                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={700}>Clear Search History</Typography>
                                        <Typography variant="caption" color="text.secondary">Wipe all recent file name searches</Typography>
                                    </Box>
                                    <Button variant="outlined" color="error" startIcon={<DeleteSweep />} onClick={() => handleClear('Search history')} sx={{ borderRadius: 2 }}>
                                        Clear
                                    </Button>
                                </Box>

                                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={700}>Clear Smart Search History</Typography>
                                        <Typography variant="caption" color="text.secondary">Wipe all AI-driven content queries</Typography>
                                    </Box>
                                    <Button variant="outlined" color="error" startIcon={<DeleteSweep />} onClick={() => handleClear('Smart search history')} sx={{ borderRadius: 2 }}>
                                        Clear
                                    </Button>
                                </Box>

                                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={700}>Clear Cache</Typography>
                                        <Typography variant="caption" color="text.secondary">Remove local stored search cache and browser caches.</Typography>
                                    </Box>
                                    <Button variant="outlined" color="error" startIcon={<DeleteSweep />} onClick={clearCache} sx={{ borderRadius: 2 }}>
                                        Clear
                                    </Button>
                                </Box>

                                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={700}>Clear All Files</Typography>
                                        <Typography variant="caption" color="text.secondary">Delete all uploaded file metadata for your account.</Typography>
                                    </Box>
                                    <Button variant="outlined" color="error" startIcon={<DeleteSweep />} onClick={clearAllFiles} sx={{ borderRadius: 2 }}>
                                        Clear
                                    </Button>
                                </Box>
                            </Stack>
                        </Paper>

                        <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid #E2E8F0' }} elevation={0}>
                            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                                <DeleteOutline color="primary" />
                                <Typography variant="h6" fontWeight={800}>Manage Uploaded Files</Typography>
                            </Stack>

                            {isLoadingFiles ? (
                                <Typography variant="body2" color="text.secondary">Loading files...</Typography>
                            ) : files.length > 0 ? (
                                <Stack spacing={2}>
                                    {files.map((file) => (
                                        <Box key={file._id} sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700}>{file.filename}</Typography>
                                                <Typography variant="caption" color="text.secondary">{new Date(file.createdAt).toLocaleString()} • {(file.size / 1024).toFixed(1)} KB</Typography>
                                            </Box>
                                            <Button variant="outlined" color="error" onClick={() => handleDeleteFile(file._id)} sx={{ borderRadius: 2 }}>
                                                Delete
                                            </Button>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.secondary">No uploaded files available to manage.</Typography>
                            )}
                        </Paper>
                    </Stack>
                </Grid>

                <Grid item xs={12} lg={5}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4, borderRadius: 6,
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                            color: 'white', position: 'relative', overflow: 'hidden'
                        }}
                    >
                        <Stack spacing={4} alignItems="center">
                            <Stack direction="row" spacing={3} justifyContent="center" width="100%">
                                <Tooltip title="About Lexicon">
                                    <IconButton
                                        onClick={() => setShowAbout(!showAbout)}
                                        sx={{ bgcolor: 'rgba(0, 97, 255, 0.2)', color: '#0061FF', p: 3, '&:hover': { bgcolor: 'rgba(0, 97, 255, 0.3)' } }}
                                    >
                                        <Info fontSize="large" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Interactive Guide">
                                    <IconButton
                                        onClick={startGuide}
                                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', p: 3, '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.3)' } }}
                                    >
                                        <PlayCircleFilled fontSize="large" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>

                            <AnimatePresence>
                                {showAbout && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ width: '100%' }}
                                    >
                                        <Box>
                                            <Typography variant="h6" fontWeight={800} mb={2}>About Lexicon</Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.8, mb: 3, lineHeight: 1.6 }}>
                                                Lexicon is a neural content engine built for the next generation of file management. It uses intelligent content extraction and pattern recognition to make your data truly searchable.
                                            </Typography>
                                            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 3 }} />
                                            <Stack spacing={1}>
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography variant="caption" sx={{ opacity: 0.6 }}>Version</Typography>
                                                    <Typography variant="caption" fontWeight={700}>2.6.4-Stable</Typography>
                                                </Stack>
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography variant="caption" sx={{ opacity: 0.6 }}>Build</Typography>
                                                    <Typography variant="caption" fontWeight={700}>2026.05.13</Typography>
                                                </Stack>
                                            </Stack>
                                        </Box>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!showAbout && (
                                <Typography variant="caption" sx={{ opacity: 0.5, textAlign: 'center' }}>
                                    Click icons above for Info or Walkthrough Guide
                                </Typography>
                            )}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

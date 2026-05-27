import React, { useState } from 'react';
import { Box, Typography, Stack, LinearProgress, Paper, Grid } from '@mui/material';
import { Storage, CloudDone, WarningAmber } from '@mui/icons-material';

export default function ModernStorageHub({ totalSize = 0, t = {}, token, onDeleteFile }) {
    const [searchResults, setSearchResults] = useState([]);
    const [activeQuery, setActiveQuery] = useState("");

    // 1 GB limit for visualization
    const STORAGE_LIMIT = 1 * 1024 * 1024 * 1024;
    const usedPercentage = Math.min((totalSize / STORAGE_LIMIT) * 100, 100);

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const remainingSize = Math.max(STORAGE_LIMIT - totalSize, 0);



    return (
        <Stack spacing={4}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3, md: 4 },
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
                }}
            >
                <Box sx={{
                    position: 'absolute', top: -50, right: -50, width: 200, height: 200,
                    background: 'radial-gradient(circle, rgba(0, 97, 255, 0.2) 0%, transparent 70%)',
                    zIndex: 0
                }} />

                <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                            <Box sx={{ bgcolor: 'rgba(0, 97, 255, 0.2)', p: 1.5, borderRadius: 3 }}>
                                <Storage sx={{ color: '#0061FF' }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h6" fontWeight={800} noWrap>{t.storageHub}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>CLOUD ENGINE V2.6</Typography>
                            </Box>
                        </Stack>
                        <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, width: { xs: '100%', sm: 'auto' } }}>
                            <Typography variant="h4" fontWeight={900}>{usedPercentage.toFixed(1)}%</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>{t.used?.toUpperCase()}</Typography>
                        </Box>
                    </Stack>

                    <Box>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" mb={1.5} spacing={0.5}>
                            <Typography variant="body2" fontWeight={600}>{formatSize(totalSize)} {t.used}</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ opacity: 0.6 }}>{formatSize(remainingSize)} {t.available}</Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={usedPercentage}
                            sx={{
                                height: 12,
                                borderRadius: 3,
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    background: 'linear-gradient(90deg, #0061FF 0%, #60EFFF 100%)',
                                    boxShadow: '0 0 15px rgba(0, 97, 255, 0.5)'
                                }
                            }}
                        />
                    </Box>
                </Stack>
            </Paper>
        </Stack>
    );
}
import React from 'react';
import { Box, Typography, Stack, LinearProgress, Paper } from '@mui/material';
import { Storage, CloudDone, WarningAmber } from '@mui/icons-material';

export default function ModernStorageHub({ totalSize = 0, t = {} }) {
    const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB limit
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
        <Paper 
            elevation={0}
            sx={{ 
                p: 4, 
                borderRadius: 6, 
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
            }}
        >
            {/* Background Glows */}
            <Box sx={{ 
                position: 'absolute', top: -50, right: -50, width: 200, height: 200, 
                background: 'radial-gradient(circle, rgba(0, 97, 255, 0.2) 0%, transparent 70%)',
                zIndex: 0
            }} />

            <Stack spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ bgcolor: 'rgba(0, 97, 255, 0.2)', p: 1.5, borderRadius: 3 }}>
                            <Storage sx={{ color: '#0061FF' }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>{t.storageHub}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>CLOUD ENGINE V2.6</Typography>
                        </Box>
                    </Stack>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" fontWeight={900}>{usedPercentage.toFixed(1)}%</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>{t.used.toUpperCase()}</Typography>
                    </Box>
                </Stack>

                <Box>
                    <Stack direction="row" justifyContent="space-between" mb={1.5}>
                        <Typography variant="body2" fontWeight={600}>{formatSize(totalSize)} {t.used}</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ opacity: 0.6 }}>{formatSize(remainingSize)} {t.available}</Typography>
                    </Stack>
                    <LinearProgress 
                        variant="determinate" 
                        value={usedPercentage} 
                        sx={{ 
                            height: 12, 
                            borderRadius: 6, 
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 6,
                                background: 'linear-gradient(90deg, #0061FF 0%, #60EFFF 100%)',
                                boxShadow: '0 0 15px rgba(0, 97, 255, 0.5)'
                            }
                        }} 
                    />
                </Box>

                <Stack direction="row" spacing={3}>
                    <Box sx={{ flex: 1, p: 2, borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <CloudDone sx={{ fontSize: 20, mb: 1, color: '#10B981' }} />
                        <Typography variant="body2" fontWeight={700}>{t.sysStatus}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>{t.optimized}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 2, borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <WarningAmber sx={{ fontSize: 20, mb: 1, color: '#F59E0B' }} />
                        <Typography variant="body2" fontWeight={700}>{t.dataHealth}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>{t.noFragments}</Typography>
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    );
}

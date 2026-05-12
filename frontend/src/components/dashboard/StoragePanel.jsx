import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function StoragePanel({ totalSize = 0 }) {
    const STORAGE_LIMIT = 50 * 1024 * 1024 * 1024; // 50 GB in bytes
    const usedPercentage = Math.min((totalSize / STORAGE_LIMIT) * 100, 100);

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                <CircularProgress 
                    variant="determinate" 
                    value={usedPercentage} 
                    size={160} 
                    thickness={4} 
                    sx={{ color: '#0061FF', bgcolor: '#F1F5F9', borderRadius: '50%' }} 
                />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Typography variant="h5" fontWeight={800}>{formatSize(totalSize)}</Typography>
                    <Typography variant="caption" color="text.secondary">Used of 50 GB</Typography>
                </Box>
            </Box>
            <Typography variant="body2" color="primary" fontWeight={700} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Upgrade plan
            </Typography>
        </Box>
    );
}
import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function StoragePanel() {
    return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                <CircularProgress variant="determinate" value={75} size={160} thickness={4} sx={{ color: '#3a97f9' }} />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Typography variant="h5" fontWeight={800}>15 GB</Typography>
                    <Typography variant="caption" color="text.secondary">Used of 50 GB</Typography>
                </Box>
            </Box>
            <Typography variant="body2" color="primary" fontWeight={700} sx={{ cursor: 'pointer' }}>Upgrade plan</Typography>
        </Box>
    );
}
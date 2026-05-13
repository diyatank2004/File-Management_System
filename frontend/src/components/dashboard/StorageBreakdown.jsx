import React from 'react';
import { Box, Typography, Stack, LinearProgress, Paper } from '@mui/material';
import { Image, Description, MusicNote, FolderZip } from '@mui/icons-material';

export default function StorageBreakdown({ stats = { images: 0, docs: 0, music: 0 }, t = {} }) {
    const total = (stats.images || 0) + (stats.docs || 0) + (stats.music || 0) || 1;
    
    const items = [
        { label: t.images || 'Images', count: stats.images, icon: <Image fontSize="small" />, color: '#0061FF' },
        { label: t.docs || 'Documents', count: stats.docs, icon: <Description fontSize="small" />, color: '#60EFFF' },
        { label: t.music || 'Music', count: stats.music, icon: <MusicNote fontSize="small" />, color: '#F59E0B' },
        { label: 'Archives', count: 0, icon: <FolderZip fontSize="small" />, color: '#64748B' },
    ];

    return (
        <Paper sx={{ p: 3, borderRadius: 6, border: '1px solid #E2E8F0', bgcolor: 'white' }} elevation={0}>
            <Typography variant="h6" fontWeight={800} mb={3}>{t.categories || 'Quick Breakdown'}</Typography>
            <Stack spacing={2.5}>
                {items.map((item, idx) => (
                    <Box key={idx}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                                <Typography variant="body2" fontWeight={700}>{item.label}</Typography>
                            </Stack>
                            <Typography variant="caption" fontWeight={800} color="text.secondary">
                                {item.count} Files
                            </Typography>
                        </Stack>
                        <LinearProgress 
                            variant="determinate" 
                            value={(item.count / total) * 100} 
                            sx={{ 
                                height: 6, 
                                borderRadius: 3, 
                                bgcolor: '#F1F5F9',
                                '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 3 }
                            }} 
                        />
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}

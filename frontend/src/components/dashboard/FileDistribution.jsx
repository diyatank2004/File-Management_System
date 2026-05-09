import React from 'react';
import { Box, Typography, LinearProgress, Stack, Paper } from '@mui/material'; // Added Paper here

export default function FileDistribution({ typeStats = { pdf: 0, word: 0, ppt: 0, image: 0 } }) {
    // Calculate total to determine percentages
    const total = Object.values(typeStats).reduce((a, b) => a + b, 0) || 1;

    const data = [
        { label: 'PDFs', count: typeStats.pdf, color: '#ff4d4d' },
        { label: 'Word', count: typeStats.word, color: '#2b579a' },
        { label: 'PPTs', count: typeStats.ppt, color: '#d24726' },
        { label: 'Images', count: typeStats.image, color: '#4ade80' },
    ];

    return (
        <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e0e5f2' }} elevation={0}>
            <Typography variant="subtitle1" fontWeight={800} color="#1b2559" mb={2}>
                File Distribution
            </Typography>
            <Stack spacing={2}>
                {data.map((item) => (
                    <Box key={item.label}>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: '#1b2559' }}>
                                {item.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {item.count}
                            </Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={(item.count / total) * 100}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: '#f4f7fe',
                                '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 4 }
                            }}
                        />
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}
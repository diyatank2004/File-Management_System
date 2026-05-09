import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { Image, Description, MusicNote } from '@mui/icons-material';

// Add { stats } as a prop and set a default empty object
export default function CategoryCards({ stats = { images: 0, docs: 0, music: 0 } }) {
    const categories = [
        {
            title: 'All Images',
            count: `${stats.images || 0} Files`,
            icon: <Image />,
            color: '#e0e7ff',
            iconColor: '#6366f1'
        },
        {
            title: 'All Document',
            count: `${stats.docs || 0} Files`,
            icon: <Description />,
            color: '#e0f2fe',
            iconColor: '#0ea5e9'
        },
        {
            title: 'All Music',
            count: `${stats.music || 0} Files`,
            icon: <MusicNote />,
            color: '#ffedd5',
            iconColor: '#f59e0b'
        },
    ];

    return (
        <Grid container spacing={3}>
            {categories.map((cat, i) => (
                // Using Grid v2 style (removing 'item' prop as per your console warning)
                <Grid size={{ xs: 12, md: 4 }} key={i}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: cat.color, borderRadius: 4, textAlign: 'center' }}>
                        <Box sx={{ bgcolor: 'white', display: 'inline-flex', p: 1.5, borderRadius: 3, color: cat.iconColor, mb: 2 }}>
                            {cat.icon}
                        </Box>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#1b2559' }}>{cat.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{cat.count}</Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
}
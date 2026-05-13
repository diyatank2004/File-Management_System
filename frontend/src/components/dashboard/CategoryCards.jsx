import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { Image, Description, MusicNote } from '@mui/icons-material';

// Add { stats } as a prop and set a default empty object
export default function CategoryCards({ stats = { images: 0, docs: 0, music: 0 }, onCategoryClick, t = {} }) {
    const categories = [
        {
            id: 'image',
            title: t.images || 'Images',
            count: `${stats.images || 0} Files`,
            icon: <Image />,
            color: '#e0e7ff',
            iconColor: '#6366f1'
        },
        {
            id: 'doc',
            title: t.docs || 'Documents',
            count: `${stats.docs || 0} Files`,
            icon: <Description />,
            color: '#e0f2fe',
            iconColor: '#0ea5e9'
        },
        {
            id: 'music',
            title: t.music || 'Music',
            count: `${stats.music || 0} Files`,
            icon: <MusicNote />,
            color: '#ffedd5',
            iconColor: '#f59e0b'
        },
    ];

    return (
        <Grid container spacing={3}>
            {categories.map((cat, i) => (
                <Grid item xs={12} md={4} key={i}>
                    <Paper 
                        elevation={0} 
                        onClick={() => onCategoryClick?.(cat.id)}
                        sx={{ 
                            p: 3, 
                            bgcolor: cat.color, 
                            borderRadius: 4, 
                            textAlign: 'center',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                                cursor: 'pointer'
                            }
                        }}
                    >
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
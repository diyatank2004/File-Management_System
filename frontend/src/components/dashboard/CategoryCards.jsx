import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { Image, Description, Code, Slideshow, TableChart } from '@mui/icons-material';

// Add { stats } as a prop and set a default empty object
export default function CategoryCards({ stats = { images: 0, docs: 0, code: 0, spreadsheets: 0, presentations: 0 }, onCategoryClick, t = {} }) {
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
            id: 'presentation',
            title: t.presentation || 'Presentations',
            count: `${stats.presentations || 0} Files`,
            icon: <Slideshow />,
            color: '#fef3c7',
            iconColor: '#d97706'
        },
        {
            id: 'spreadsheet',
            title: t.spreadsheet || 'Spreadsheets',
            count: `${stats.spreadsheets || 0} Files`,
            icon: <TableChart />,
            color: '#ecfeff',
            iconColor: '#0891b2'
        },
        {
            id: 'code',
            title: t.code || 'Code',
            count: `${stats.code || 0} Files`,
            icon: <Code />,
            color: '#ede9fe',
            iconColor: '#7c3aed'
        },
    ];

    return (
        <Grid container spacing={2}>
            {categories.map((cat, i) => (
                <Grid item xs={6} sm={4} md={4} key={i}>
                    <Paper 
                        elevation={0} 
                        onClick={() => onCategoryClick?.(cat.id)}
                        sx={{ 
                            p: { xs: 1.75, sm: 2.5, md: 3 }, 
                            minHeight: { xs: 130, sm: 150 },
                            bgcolor: cat.color, 
                            borderRadius: 3, 
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                                cursor: 'pointer'
                            }
                        }}
                    >
                        <Box sx={{ bgcolor: 'white', display: 'inline-flex', p: { xs: 1.25, sm: 1.5 }, borderRadius: 3, color: cat.iconColor, mb: { xs: 1.25, sm: 2 } }}>
                            {cat.icon}
                        </Box>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#1b2559', fontSize: { xs: '0.95rem', sm: '1.15rem' } }}>
                            {cat.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {cat.count}
                        </Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
}

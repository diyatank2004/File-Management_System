import React from 'react';
import { Paper, Typography, Stack, Button, Box } from '@mui/material';
import { Add, ManageSearch, Settings, Share } from '@mui/icons-material';

export default function QuickActions({ onAction, t = {} }) {
    const actions = [
        { label: t.upload, icon: <Add />, color: '#0061FF', action: 'upload' },
        { label: t.deepSearch || 'Smart Search', icon: <ManageSearch />, color: '#10B981', action: 'search' },
        { label: t.settings, icon: <Settings />, color: '#6366F1', action: 'settings' },
        { label: 'Share', icon: <Share />, color: '#F59E0B', action: 'share' },
    ];

    return (
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 0, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: 'white' }} elevation={0}>
            <Typography variant="h6" fontWeight={800} mb={2}>{t.quickActions}</Typography>
            <Box
                sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }
                }}
            >
                {actions.map((act) => (
                    <Button
                        key={act.label}
                        variant="outlined"
                        startIcon={act.icon}
                        onClick={() => onAction && onAction(act.action)}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: '#E2E8F0',
                            color: '#475569',
                            width: '100%',
                            minWidth: 0,
                            py: 1,
                            '&:hover': {
                                bgcolor: act.color,
                                color: 'white',
                                borderColor: act.color,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s'
                            }
                        }}
                    >
                        {act.label}
                    </Button>
                ))}
            </Box>
        </Paper>
    );
}

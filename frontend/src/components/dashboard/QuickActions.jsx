import React from 'react';
import { Paper, Typography, Stack, Button, Box } from '@mui/material';
import { Add, ManageSearch, Settings, Share } from '@mui/icons-material';

export default function QuickActions({ onAction }) {
    const actions = [
        { label: 'Upload', icon: <Add />, color: '#0061FF', action: 'upload' },
        { label: 'Search', icon: <ManageSearch />, color: '#10B981', action: 'search' },
        { label: 'Settings', icon: <Settings />, color: '#6366F1', action: 'settings' },
        { label: 'Share', icon: <Share />, color: '#F59E0B', action: 'share' },
    ];

    return (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '1px solid #E2E8F0' }} elevation={0}>
            <Typography variant="h6" fontWeight={800} mb={2}>Quick Actions</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
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
                            flexGrow: 1,
                            minWidth: '100px',
                            mb: 1,
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
            </Stack>
        </Paper>
    );
}

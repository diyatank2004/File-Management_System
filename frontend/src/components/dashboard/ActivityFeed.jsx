import React from 'react';
import { Paper, Typography, Stack, Box, Avatar } from '@mui/material';
import { FileUpload, ManageSearch, PersonAdd, Security } from '@mui/icons-material';

export default function ActivityFeed() {
    const activities = [
        { id: 1, type: 'upload', text: 'You uploaded "Tax_2024.pdf"', time: '2 mins ago', icon: <FileUpload fontSize="small" />, color: '#0061FF' },
        { id: 2, type: 'search', text: 'Deep search for "Invoice"', time: '1 hour ago', icon: <ManageSearch fontSize="small" />, color: '#10B981' },
        { id: 3, type: 'security', text: 'Password was updated', time: 'Yesterday', icon: <Security fontSize="small" />, color: '#F43F5E' },
        { id: 4, type: 'user', text: 'Account verified', time: '2 days ago', icon: <PersonAdd fontSize="small" />, color: '#6366F1' },
    ];

    return (
        <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }} elevation={0}>
            <Typography variant="h6" fontWeight={800} mb={3}>Recent Activity</Typography>
            <Stack spacing={3}>
                {activities.map((act) => (
                    <Stack key={act.id} direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: `${act.color}15`, color: act.color, width: 36, height: 36 }}>
                            {act.icon}
                        </Avatar>
                        <Box>
                            <Typography variant="body2" fontWeight={600} color="#1E293B">
                                {act.text}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {act.time}
                            </Typography>
                        </Box>
                    </Stack>
                ))}
            </Stack>
        </Paper>
    );
}

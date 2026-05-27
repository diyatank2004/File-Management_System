import React from 'react';
import { Paper, Typography, Stack, Box, Avatar } from '@mui/material';
import { FileUpload, ManageSearch, PersonAdd, Security } from '@mui/icons-material';

export default function ActivityFeed({ files = [], t = {} }) {
    // Helper to format "time ago"
    const getTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return t.justNow || 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    // Transform files into activity items (sorted by newest)
    const activities = [...files]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((file, index) => ({
            id: file._id || index,
            type: 'upload',
            text: `You indexed "${file.filename}"`,
            time: getTimeAgo(file.createdAt),
            icon: <FileUpload fontSize="small" />,
            color: '#0061FF'
        }));

    // If no files, show placeholders or a message
    if (activities.length === 0) {
        return (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #E2E8F0' }} elevation={0}>
                <Typography variant="h6" fontWeight={800} mb={3}>{t.activity || 'Recent Activity'}</Typography>
                <Stack alignItems="center" justifyContent="center" py={4} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No recent activity detected.</Typography>
                </Stack>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #E2E8F0' }} elevation={0}>
            <Typography variant="h6" fontWeight={800} mb={3}>Recent Activity</Typography>
            <Stack spacing={2.25}>
                {activities.map((act) => (
                    <Stack key={act.id} direction="row" spacing={1.75} alignItems="flex-start" sx={{ py: 0.5 }}>
                        <Avatar sx={{ bgcolor: `${act.color}15`, color: act.color, width: 36, height: 36, mt: 0.1 }}>
                            {act.icon}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} color="#1E293B" sx={{ lineHeight: 1.35 }}>
                                {act.text}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                                {act.time}
                            </Typography>
                        </Box>
                    </Stack>
                ))}
            </Stack>
        </Paper>
    );
}

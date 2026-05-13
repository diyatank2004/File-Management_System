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
            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }} elevation={0}>
                <Typography variant="h6" fontWeight={800} mb={3}>{t.activity || 'Recent Activity'}</Typography>
                <Stack alignItems="center" justifyContent="center" py={4}>
                    <Typography variant="body2" color="text.secondary">No recent activity detected.</Typography>
                </Stack>
            </Paper>
        );
    }

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

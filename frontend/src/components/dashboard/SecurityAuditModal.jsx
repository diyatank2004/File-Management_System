import React from 'react';
import { 
    Dialog, DialogTitle, DialogContent, Stack, Typography, 
    IconButton, Box, List, ListItem, ListItemAvatar, 
    Avatar, ListItemText, Chip 
} from '@mui/material';
import { Close, Security, Shield, Warning, GppGood, ManageSearch } from '@mui/icons-material';

const mockLogs = [
    { id: 1, event: 'Neural Scan Complete', time: '2 mins ago', type: 'info', icon: <Security fontSize="small" /> },
    { id: 2, event: 'Deep Search Performed', time: '15 mins ago', type: 'info', icon: <ManageSearch fontSize="small" /> },
    { id: 3, event: 'Unauthorized Access Blocked', time: '1 hour ago', type: 'warning', icon: <Warning fontSize="small" /> },
    { id: 4, event: 'Encryption Keys Rotated', time: '3 hours ago', type: 'success', icon: <Shield fontSize="small" /> },
    { id: 5, event: 'System Integrity Verified', time: '5 hours ago', type: 'success', icon: <GppGood fontSize="small" /> },
];

export default function SecurityAuditModal({ open, onClose, t = {} }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900 }}>
                {t.security || 'Security Shield'} - Audit Log
                <IconButton onClick={onClose} size="small"><Close /></IconButton>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ py: 1 }}>
                    <Box sx={{ p: 2, bgcolor: '#F0F9FF', borderRadius: 4, border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', spacing: 2 }}>
                        <Shield sx={{ color: '#0061FF', mr: 2 }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800}>Quantum Protection Active</Typography>
                            <Typography variant="caption" color="text.secondary">All files are secured with AES-256-GCM encryption.</Typography>
                        </Box>
                    </Box>

                    <List sx={{ pt: 0 }}>
                        {mockLogs.map((log) => (
                            <ListItem key={log.id} sx={{ px: 0, py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ 
                                        bgcolor: log.type === 'warning' ? '#FEF2F2' : (log.type === 'success' ? '#ECFDF5' : '#F0F9FF'),
                                        color: log.type === 'warning' ? '#EF4444' : (log.type === 'success' ? '#10B981' : '#0061FF'),
                                        width: 40, height: 40
                                    }}>
                                        {log.icon}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={<Typography variant="body2" fontWeight={700}>{log.event}</Typography>}
                                    secondary={<Typography variant="caption" color="text.secondary">{log.time}</Typography>}
                                />
                                <Chip 
                                    label={log.type.toUpperCase()} 
                                    size="small" 
                                    sx={{ 
                                        fontSize: '0.6rem', fontWeight: 900,
                                        bgcolor: log.type === 'warning' ? '#FEF2F2' : (log.type === 'success' ? '#ECFDF5' : '#F0F9FF'),
                                        color: log.type === 'warning' ? '#EF4444' : (log.type === 'success' ? '#10B981' : '#0061FF'),
                                    }} 
                                />
                            </ListItem>
                        ))}
                    </List>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

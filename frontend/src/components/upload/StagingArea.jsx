import React from 'react';
import { 
    Box, Paper, Typography, Stack, List, ListItem, 
    ListItemIcon, ListItemText, LinearProgress, IconButton, Chip 
} from '@mui/material';
import { 
    InsertDriveFile, CheckCircle, Error, Pending, 
    CloudDone, Scanner, DataObject, Delete 
} from '@mui/icons-material';

export default function StagingArea({ stagingFiles, setStagingFiles, fileStatuses = {} }) {
    
    const removeFile = (index) => {
        const newFiles = [...stagingFiles];
        newFiles.splice(index, 1);
        setStagingFiles(newFiles);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'scanning': return <Scanner sx={{ color: '#0061FF', animation: 'spin 2s linear infinite' }} />;
            case 'indexing': return <DataObject sx={{ color: '#6366F1' }} />;
            case 'success': return <CloudDone sx={{ color: '#10B981' }} />;
            case 'error': return <Error sx={{ color: '#F43F5E' }} />;
            case 'duplicate': return <Pending sx={{ color: '#F59E0B' }} />;
            default: return <InsertDriveFile sx={{ color: '#94A3B8' }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scanning': return 'primary';
            case 'indexing': return 'secondary';
            case 'success': return 'success';
            case 'error': return 'error';
            case 'duplicate': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Paper sx={{ p: 4, borderRadius: 6, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }} elevation={0}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={800}>Files in Staging</Typography>
                <Chip label={`${stagingFiles.length} Total`} size="small" sx={{ fontWeight: 700 }} />
            </Stack>

            <List sx={{ width: '100%' }}>
                {stagingFiles.map((file, index) => {
                    const status = fileStatuses[file.name] || 'ready';
                    const isProcessing = status === 'scanning' || status === 'indexing';

                    return (
                        <ListItem
                            key={`${file.name}-${index}`}
                            sx={{
                                bgcolor: 'white',
                                mb: 1.5,
                                borderRadius: 3,
                                border: '1px solid #E2E8F0',
                                display: 'block',
                                p: 2
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={2} mb={isProcessing ? 1 : 0}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getStatusIcon(status)}
                                </ListItemIcon>
                                
                                <ListItemText
                                    primary={file.name}
                                    secondary={`${(file.size / 1024).toFixed(1)} KB`}
                                    primaryTypographyProps={{ fontWeight: 700, noWrap: true }}
                                />

                                <Box sx={{ flexGrow: 1 }} />

                                {status === 'ready' && (
                                    <IconButton size="small" onClick={() => removeFile(index)} color="error">
                                        <Delete fontSize="small" />
                                    </IconButton>
                                )}

                                {status !== 'ready' && (
                                    <Chip 
                                        label={status.toUpperCase()} 
                                        size="small" 
                                        color={getStatusColor(status)} 
                                        variant="outlined"
                                        sx={{ fontWeight: 800, fontSize: '0.6rem' }}
                                    />
                                )}
                            </Stack>

                            {isProcessing && (
                                <Box sx={{ width: '100%', mt: 1 }}>
                                    <LinearProgress 
                                        variant="indeterminate" 
                                        sx={{ height: 4, borderRadius: 2 }} 
                                        color={getStatusColor(status)}
                                    />
                                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic', color: 'text.secondary' }}>
                                        {status === 'scanning' ? 'Optical Character Recognition in progress...' : 'Building reverse index...'}
                                    </Typography>
                                </Box>
                            )}
                        </ListItem>
                    );
                })}
            </List>

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </Paper>
    );
}

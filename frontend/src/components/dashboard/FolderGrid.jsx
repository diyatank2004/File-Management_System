import React from 'react';
import { Grid, Paper, Stack, Typography, Box } from '@mui/material';
import { Folder } from '@mui/icons-material';

const folders = [
    { name: 'MyWork', size: '14 GB', files: '429 files' },
    { name: 'Graduation', size: '2.5 GB', files: '89 files' },
    { name: 'Company', size: '9 GB', files: '384 files' },
    { name: 'Photos', size: '5 GB', files: '275 files' },
];

export default function FolderGrid() {
    return (
        <Grid container spacing={2}>
            {folders.map((folder, i) => (
                <Grid item xs={6} sm={3} key={i}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e5f2', borderRadius: 4 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Folder sx={{ color: '#3a97f9', fontSize: 40 }} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} noWrap>{folder.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{folder.files}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
}
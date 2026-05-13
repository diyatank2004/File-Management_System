import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

export default function RecentFilesTable({ files }) {
    const hasSnippets = files.some(f => f.snippet);

    return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e5f2', borderRadius: 4 }}>
            <Table>
                <TableHead>
                    <TableRow sx={{ bgcolor: '#f4f7fe' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Name file</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Last Edit</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                        {hasSnippets && <TableCell sx={{ fontWeight: 700 }}>Content Snippet (OCR)</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {files.length > 0 ? (
                        files.map((file, i) => (
                            <TableRow key={i}>
                                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{file.filename || file.name}</TableCell>
                                <TableCell>{new Date(file.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                                <TableCell>{(file.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                                {hasSnippets && (
                                    <TableCell sx={{ maxWidth: 300 }}>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                display: 'block', 
                                                p: 1, 
                                                bgcolor: '#F0F9FF', 
                                                borderRadius: 2, 
                                                border: '1px solid #BAE6FD',
                                                fontStyle: 'italic'
                                            }}
                                        >
                                            {file.snippet || "No textual match found in content."}
                                        </Typography>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                                <Typography variant="body1" color="text.secondary" fontWeight={600}>
                                    No files found in this category.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
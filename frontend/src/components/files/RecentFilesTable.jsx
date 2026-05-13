import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

export default function RecentFilesTable({ files }) {
    return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e5f2', borderRadius: 4 }}>
            <Table>
                <TableHead>
                    <TableRow sx={{ bgcolor: '#f4f7fe' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Name file</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Last Edit</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {files.length > 0 ? (
                        files.map((file, i) => (
                            <TableRow key={i}>
                                <TableCell>{file.filename || file.name}</TableCell>
                                <TableCell>{new Date(file.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                                <TableCell>{(file.size / 1024 / 1024).toFixed(2)} MB</TableCell>
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
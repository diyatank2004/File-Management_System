import React, { useEffect, useMemo, useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, Stack, Typography, 
    IconButton, Box, TextField, Button, Divider, MenuItem 
} from '@mui/material';
import { 
    Close, ContentCopy, Email, WhatsApp, Telegram, 
    Link as LinkIcon, CheckCircle, OpenInNew 
} from '@mui/icons-material';

export default function ShareDialog({ open, onClose, files = [] }) {
    const [copied, setCopied] = useState(false);
    const [selectedFileId, setSelectedFileId] = useState('');

    const recentFiles = useMemo(() => {
        return [...files].sort((left, right) => {
            const leftTime = new Date(left.createdAt || 0).getTime();
            const rightTime = new Date(right.createdAt || 0).getTime();
            return rightTime - leftTime;
        });
    }, [files]);

    useEffect(() => {
        if (!open) {
            setCopied(false);
            return;
        }

        if (!recentFiles.length) {
            setSelectedFileId('');
            return;
        }

        const currentExists = recentFiles.some((file) => (file._id || file.id) === selectedFileId);
        if (!currentExists) {
            setSelectedFileId(recentFiles[0]._id || recentFiles[0].id || '');
        }
    }, [open, recentFiles, selectedFileId]);

    const selectedFile = recentFiles.find((file) => (file._id || file.id) === selectedFileId) || recentFiles[0];
    const shareId = selectedFile?._id || selectedFile?.id || 'demo';
    const shareUrl = useMemo(() => {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        url.searchParams.set('share', shareId);
        if (selectedFile?.filename || selectedFile?.name) {
            url.searchParams.set('name', selectedFile.filename || selectedFile.name);
        }
        return url.toString();
    }, [selectedFile, shareId]);

    const openShareUrl = () => {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOptions = useMemo(() => {
        const shareMessage = selectedFile
            ? `Check out ${selectedFile.filename || selectedFile.name || 'this file'}: ${shareUrl}`
            : `Check this file: ${shareUrl}`;

        return [
            { name: 'Email', icon: <Email />, color: '#EA4335', url: `mailto:?subject=${encodeURIComponent('Sharing File')}&body=${encodeURIComponent(shareMessage)}` },
            { name: 'WhatsApp', icon: <WhatsApp />, color: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(shareMessage)}` },
            { name: 'Telegram', icon: <Telegram />, color: '#0088CC', url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}` },
        ];
    }, [selectedFile, shareUrl]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 6, p: 1 } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900 }}>
                Share File
                <IconButton onClick={onClose} size="small"><Close /></IconButton>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3}>
                    {selectedFile && (
                        <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>READY TO SHARE</Typography>
                            <Typography variant="body2" fontWeight={800} noWrap>{selectedFile.filename}</Typography>
                        </Box>
                    )}

                    <Box>
                        <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ display: 'block', mb: 1 }}>SELECT FILE</Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={selectedFileId}
                            onChange={(event) => setSelectedFileId(event.target.value)}
                            disabled={!recentFiles.length}
                            helperText={recentFiles.length ? 'Recent uploads are shown first.' : 'No uploaded files available.'}
                        >
                            {recentFiles.map((file) => (
                                <MenuItem key={file._id || file.id} value={file._id || file.id}>
                                    {file.filename || file.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Box>
                        <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ display: 'block', mb: 1 }}>DIRECT SHARE</Typography>
                        <Stack direction="row" spacing={2} justifyContent="center">
                            {shareOptions.map((opt) => (
                                <IconButton 
                                    key={opt.name} 
                                    component="a"
                                    href={opt.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ 
                                        bgcolor: `${opt.color}15`, 
                                        color: opt.color, 
                                        p: 2,
                                        '&:hover': { bgcolor: `${opt.color}25` }
                                    }}
                                >
                                    {opt.icon}
                                </IconButton>
                            ))}
                        </Stack>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ display: 'block', mb: 1 }}>SHARE LINK</Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={shareUrl}
                            InputProps={{
                                readOnly: true,
                                endAdornment: (
                                    <Stack direction="row" spacing={0.5}>
                                        <IconButton onClick={openShareUrl} size="small" aria-label="Open share link">
                                            <OpenInNew fontSize="small" />
                                        </IconButton>
                                        <IconButton onClick={handleCopy} size="small" aria-label="Copy share link">
                                            {copied ? <CheckCircle color="success" /> : <ContentCopy />}
                                        </IconButton>
                                    </Stack>
                                ),
                                sx: { borderRadius: 3, bgcolor: '#F8FAFC', fontSize: '0.8rem' }
                            }}
                        />
                    </Box>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<OpenInNew />}
                        sx={{ borderRadius: 4, py: 1.5, fontWeight: 800 }}
                        onClick={openShareUrl}
                    >
                        Open Share Link
                    </Button>

                    <Button 
                        fullWidth 
                        variant="contained" 
                        startIcon={<LinkIcon />}
                        sx={{ borderRadius: 4, py: 1.5, fontWeight: 800 }}
                        onClick={onClose}
                    >
                        Done
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

import React, { useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, Stack, Typography, 
    IconButton, Box, TextField, Button, Divider, List, 
    ListItem, ListItemAvatar, Avatar, ListItemText, ListItemSecondaryAction 
} from '@mui/material';
import { 
    Close, ContentCopy, Email, WhatsApp, Telegram, 
    Link as LinkIcon, CheckCircle 
} from '@mui/icons-material';

export default function ShareDialog({ open, onClose, files = [] }) {
    const [copied, setCopied] = useState(false);
    const selectedFile = files[0]; // Share most recent for demo
    const shareUrl = selectedFile ? `https://lexicon.io/share/${selectedFile._id || 'demo'}` : 'https://lexicon.io/share';

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOptions = [
        { name: 'Email', icon: <Email />, color: '#EA4335', url: `mailto:?subject=Sharing File&body=Check this out: ${shareUrl}` },
        { name: 'WhatsApp', icon: <WhatsApp />, color: '#25D366', url: `https://wa.me/?text=Check this file on Lexicon: ${shareUrl}` },
        { name: 'Telegram', icon: <Telegram />, color: '#0088CC', url: `https://t.me/share/url?url=${shareUrl}` },
    ];

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
                        <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ display: 'block', mb: 1 }}>DIRECT SHARE</Typography>
                        <Stack direction="row" spacing={2} justifyContent="center">
                            {shareOptions.map((opt) => (
                                <IconButton 
                                    key={opt.name} 
                                    onClick={() => window.open(opt.url, '_blank')}
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
                                    <IconButton onClick={handleCopy} size="small">
                                        {copied ? <CheckCircle color="success" /> : <ContentCopy />}
                                    </IconButton>
                                ),
                                sx: { borderRadius: 3, bgcolor: '#F8FAFC', fontSize: '0.8rem' }
                            }}
                        />
                    </Box>

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

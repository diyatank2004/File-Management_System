import React from 'react';
import { Box, Typography, Stack, Paper, Button } from '@mui/material';
import { Security, GppGood, Shield } from '@mui/icons-material';

export default function SecurityCard({ t = {} }) {
    return (
        <Paper 
            elevation={0}
            sx={{ 
                p: 3, 
                borderRadius: 6, 
                background: 'linear-gradient(135deg, #0061FF 0%, #60EFFF 100%)',
                color: 'white',
                mt: 3
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', p: 1, borderRadius: 2 }}>
                    <Security fontSize="small" />
                </Box>
                <Typography variant="subtitle1" fontWeight={800}>{t.security || 'Security Shield'}</Typography>
            </Stack>
            
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 3 }}>
                Your data is encrypted with AES-256 and protected by Lexicon's smart firewall.
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', p: 1.5, borderRadius: 3, mb: 2 }}>
                <GppGood sx={{ color: '#10B981', fontSize: 18 }} />
                <Typography variant="caption" fontWeight={700}>End-to-End Encryption Active</Typography>
            </Stack>

            <Button 
                fullWidth 
                variant="contained" 
                sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main', 
                    fontWeight: 800, 
                    borderRadius: 3,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                }}
            >
                {t.viewAudit || 'View Audit Log'}
            </Button>
        </Paper>
    );
}

import React, { useState } from 'react';
import { Box, Typography, Stack, Paper, Button } from '@mui/material';
import { Security, GppGood, Shield } from '@mui/icons-material';
import { motion } from 'framer-motion';
import SecurityAuditModal from './SecurityAuditModal';

export default function SecurityCard({ t = {} }) {
    const [isAuditOpen, setIsAuditOpen] = useState(false);

    return (
        <Paper 
            elevation={0}
            sx={{ 
                p: 3, 
                borderRadius: 6, 
                background: 'linear-gradient(135deg, #0061FF 0%, #60EFFF 100%)',
                color: 'white',
                mt: 3,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Security Pulse */}
            <Box 
                component={motion.div}
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ repeat: Infinity, duration: 4 }}
                sx={{ 
                    position: 'absolute', top: -20, right: -20, 
                    width: 150, height: 150, borderRadius: '50%', 
                    bgcolor: 'white', zIndex: 0 
                }} 
            />

            <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box 
                        component={motion.div}
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 5 }}
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', p: 1, borderRadius: 2, display: 'flex' }}
                    >
                        <Security fontSize="small" />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={800}>{t.security || 'Security Shield'}</Typography>
                </Stack>
                
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Your neural data is protected by Lexicon's quantum-ready AES-256 firewall.
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', p: 1.5, borderRadius: 3 }}>
                    <GppGood sx={{ color: '#10B981', fontSize: 18 }} />
                    <Typography variant="caption" fontWeight={700}>System Integrity Verified</Typography>
                </Stack>

                <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => setIsAuditOpen(true)}
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
            </Stack>

            <SecurityAuditModal open={isAuditOpen} onClose={() => setIsAuditOpen(false)} t={t} />
        </Paper>
    );
}

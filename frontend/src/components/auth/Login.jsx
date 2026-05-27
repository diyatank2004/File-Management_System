import React, { useState } from 'react';
import {
    Box, TextField, Button, Typography, Stack,
    IconButton, InputAdornment, CircularProgress, Paper, Divider, Chip
} from '@mui/material';
import { Visibility, VisibilityOff, AutoGraph, LockOutlined, StorageOutlined, SearchOutlined } from '@mui/icons-material';
import { login, signup, storeSession } from '../../services/api';

export default function Login({ setAuthState }) {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // FORM STATE
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(""); // Clear error on input change
    };

    const validateForm = () => {
        const { email, password, name } = formData;

        // Email validation: must be @gmail.com
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(email)) {
            setError("Only Gmail addresses (@gmail.com) are allowed.");
            return false;
        }

        // Password validation: at least 8 chars, 1 upper, 1 lower, 1 number, 1 special char
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            setError("Password must be at least 8 chars, with uppercase, lowercase, number, and special char (@$!%*?&).");
            return false;
        }

        if (!isLogin && !name.trim()) {
            setError("Name is required for signup.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) return;

        setLoading(true);

        try {
            if (isLogin) {
                const data = await login({
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password
                });

                // Use storeSession utility for consistent state management
                storeSession(data.token, data.user);
                setAuthState({ token: data.token, user: data.user });
                setFormData({ name: '', email: '', password: '' });
            } else {
                const data = await signup({
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password
                });

                // Auto-login user after signup
                storeSession(data.token, data.user);
                setAuthState({ token: data.token, user: data.user });
                setFormData({ name: '', email: '', password: '' });
            }
        } catch (err) {
            const errorMsg = err.message || "An error occurred.";
            setError(errorMsg);
            console.error("Auth Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100dvh',
            width: '100%',
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3, md: 4 },
            background: 'radial-gradient(circle at top left, rgba(96,239,255,0.24), transparent 28%), radial-gradient(circle at bottom right, rgba(0,97,255,0.18), transparent 30%), linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 55%, #FFFFFF 100%)'
        }}>
            <Box sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
                maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.7), transparent)'
            }} />

            <Paper elevation={0} sx={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: 1200,
                overflow: 'hidden',
                borderRadius: { xs: 4, md: 6 },
                border: '1px solid rgba(148, 163, 184, 0.22)',
                boxShadow: '0 30px 80px rgba(15, 23, 42, 0.10)',
                backdropFilter: 'blur(18px)',
                background: 'rgba(255,255,255,0.88)'
            }}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
                    minHeight: { xs: 'auto', md: 720 }
                }}>
                    <Box sx={{
                        p: { xs: 3, sm: 4, md: 6 },
                        background: 'linear-gradient(145deg, #0F172A 0%, #1D4ED8 52%, #06B6D4 100%)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{
                            position: 'absolute',
                            right: -48,
                            top: -40,
                            width: 180,
                            height: 180,
                            borderRadius: '50%',
                            bgcolor: 'rgba(255,255,255,0.10)'
                        }} />
                        <Box sx={{
                            position: 'absolute',
                            left: -56,
                            bottom: -40,
                            width: 220,
                            height: 220,
                            borderRadius: '50%',
                            bgcolor: 'rgba(255,255,255,0.08)'
                        }} />

                        <Stack spacing={3} sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center' }}>
                                    <AutoGraph />
                                </Box>
                                <Typography variant="h6" fontWeight={900} letterSpacing={1.2}>
                                    LEXICON 2.6
                                </Typography>
                            </Box>

                            <Box sx={{ maxWidth: 520, pt: { xs: 0, md: 4 } }}>
                                <Typography
                                    variant="h2"
                                    fontWeight={900}
                                    sx={{
                                        fontSize: { xs: '2rem', sm: '2.4rem', md: '3.25rem' },
                                        lineHeight: 1.02,
                                        letterSpacing: '-0.04em'
                                    }}
                                >
                                    {isLogin ? 'Welcome back to your file workspace' : 'Build your smarter file dashboard'}
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 2, opacity: 0.92, fontWeight: 400, maxWidth: 500 }}>
                                    {isLogin
                                        ? 'Sign in to search, organize, and manage files with a clean, focused interface.'
                                        : 'Create an account to index your files, explore content, and keep everything organized in one place.'}
                                </Typography>
                            </Box>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 'auto' }}>
                                {[
                                    { icon: <LockOutlined fontSize="small" />, label: 'Secure access' },
                                    { icon: <SearchOutlined fontSize="small" />, label: 'Smart search' },
                                    { icon: <StorageOutlined fontSize="small" />, label: 'File storage' },
                                ].map((item) => (
                                    <Chip
                                        key={item.label}
                                        icon={item.icon}
                                        label={item.label}
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.14)',
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.16)',
                                            fontWeight: 700,
                                            '& .MuiChip-icon': { color: 'white' }
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Stack>
                    </Box>

                    <Box sx={{ p: { xs: 3, sm: 4, md: 6 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ width: '100%', maxWidth: 440 }}>
                            <Stack spacing={2} mb={4} alignItems="stretch">
                                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 2 }}>
                                    {isLogin ? 'Sign in' : 'Create account'}
                                </Typography>
                                <Typography variant="h3" fontWeight={900} color="#111827" sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, lineHeight: 1.05 }}>
                                    {isLogin ? 'Access your files' : 'Start your workspace'}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {isLogin
                                        ? 'Use your email and password to return to your dashboard.'
                                        : 'Create your account in a few steps and get started immediately.'}
                                </Typography>

                                <Stack direction="row" spacing={1} sx={{ bgcolor: '#F8FAFC', p: 0.75, borderRadius: 999, border: '1px solid #E2E8F0' }}>
                                    <Button
                                        fullWidth
                                        onClick={() => {
                                            setIsLogin(true);
                                            setError('');
                                            setFormData({ name: '', email: '', password: '' });
                                        }}
                                        variant={isLogin ? 'contained' : 'text'}
                                        sx={{ borderRadius: 999, py: 1.2, fontWeight: 800, boxShadow: 'none' }}
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        fullWidth
                                        onClick={() => {
                                            setIsLogin(false);
                                            setError('');
                                            setFormData({ name: '', email: '', password: '' });
                                        }}
                                        variant={!isLogin ? 'contained' : 'text'}
                                        sx={{ borderRadius: 999, py: 1.2, fontWeight: 800, boxShadow: 'none' }}
                                    >
                                        Sign Up
                                    </Button>
                                </Stack>
                            </Stack>

                            <Divider sx={{ mb: 3 }} />

                            {error && (
                                <Box sx={{ p: 2, bgcolor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 3, mb: 3 }}>
                                    <Typography variant="body2" color="error" fontWeight={600}>{error}</Typography>
                                </Box>
                            )}

                            <FormContent
                                type={isLogin ? 'Login' : 'Signup'}
                                formData={formData}
                                handleInputChange={handleInputChange}
                                handleSubmit={handleSubmit}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                loading={loading}
                            />
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

// Sub-component for Form Fields
function FormContent({ type, formData, handleInputChange, handleSubmit, showPassword, setShowPassword, loading }) {
    const isLogin = type === "Login";
    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
                    {!isLogin && (
                        <TextField
                            fullWidth label="Full Name" name="name"
                            variant="outlined" required
                            value={formData.name} onChange={handleInputChange}
                            disabled={loading}
                            placeholder="Your display name"
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#FFFFFF' }
                            }}
                        />
                    )}

                    <TextField
                        fullWidth label="Email Address" name="email"
                        variant="outlined" type="email" required
                        value={formData.email} onChange={handleInputChange}
                        disabled={loading}
                        placeholder="name@gmail.com"
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#FFFFFF' }
                        }}
                    />

                    <TextField
                        fullWidth label="Password" name="password"
                        variant="outlined" required
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password} onChange={handleInputChange}
                        disabled={loading}
                        placeholder="Enter your password"
                        helperText={isLogin ? 'Use your account password' : 'At least 8 chars with upper, lower, number, and special char'}
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#FFFFFF' },
                            '& .MuiFormHelperText-root': { mx: 0 }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading}>
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        fullWidth variant="contained" type="submit" disabled={loading}
                        sx={{
                            py: 1.7,
                            mt: 1,
                            bgcolor: 'primary.main',
                            borderRadius: 3,
                            fontWeight: 800,
                            textTransform: 'none',
                            boxShadow: '0 14px 30px rgba(0, 97, 255, 0.25)',
                            '&:hover': { bgcolor: '#0052d1', boxShadow: '0 18px 36px rgba(0, 97, 255, 0.30)' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? "SIGN IN" : "SIGN UP")}
                    </Button>

                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 1 }}>
                        Gmail accounts only. Protected by strong password rules.
                    </Typography>
            </Stack>
        </form>
    );
}
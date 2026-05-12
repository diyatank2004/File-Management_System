import React, { useState } from 'react';
import {
    Box, TextField, Button, Typography, Stack,
    IconButton, InputAdornment, Link, CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, AutoGraph, FolderZip } from '@mui/icons-material';
// CORRECT NAMES (Matching your api.js)
import { login, signup } from '../../services/api';
export default function Login({ setAuthState }) {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // FORM STATE
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        const { email, password } = formData;
        
        // Email validation: must be @gmail.com
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(email)) {
            alert("Only Gmail addresses (@gmail.com) are allowed.");
            return false;
        }

        // Password validation: at least 8 chars, 1 upper, 1 lower, 1 number, 1 special char
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            alert("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&).");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);

        try {
            if (isLogin) {
                // Use "login" instead of "loginUser"
                const data = await login({
                    email: formData.email,
                    password: formData.password
                });

                setAuthState({ token: data.token, user: data.user });
                localStorage.setItem('sfm_token', data.token); // Note: Your api.js uses sfm_token
                localStorage.setItem('sfm_user', JSON.stringify(data.user));
            } else {
                // Use "signup" instead of "signupUser"
                await signup(formData);
                alert("Account created! Please sign in.");
                setIsLogin(true);
            }
        } catch (err) {
            alert(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            height: '100vh', width: '100vw', display: 'flex',
            position: 'relative', overflow: 'hidden', bgcolor: '#FFFFFF'
        }}>

            {/* 1. THE STATIONARY FORMS LAYER */}
            <Box sx={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', zIndex: 1 }}>

                {/* Left Side: Signup Form Container */}
                <Box sx={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                    {!isLogin && (
                        <FormContent
                            type="Signup"
                            formData={formData}
                            handleInputChange={handleInputChange}
                            setIsLogin={setIsLogin}
                            handleSubmit={handleSubmit}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            loading={loading}
                        />
                    )}
                </Box>

                {/* Right Side: Login Form Container */}
                <Box sx={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                    {isLogin && (
                        <FormContent
                            type="Login"
                            formData={formData}
                            handleInputChange={handleInputChange}
                            setIsLogin={setIsLogin}
                            handleSubmit={handleSubmit}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            loading={loading}
                        />
                    )}
                </Box>
            </Box>

            {/* 2. THE SLIDING BLUE OVERLAY */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: isLogin ? '0%' : '50%',
                width: '50%',
                height: '100%',
                background: 'linear-gradient(135deg, #0061FF 0%, #60EFFF 100%)',
                zIndex: 10,
                transition: 'all 0.6s cubic-bezier(0.7, 0, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textAlign: 'center',
                p: 8
            }}>
                <Box sx={{ maxWidth: 450 }}>
                    <AutoGraph sx={{ fontSize: 60, mb: 3 }} />
                    <Typography variant="h2" fontWeight={900} mb={2} letterSpacing={-2}>
                        {isLogin ? "Hello, Friend!" : "Welcome Back!"}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 5, opacity: 0.8, fontWeight: 400 }}>
                        {isLogin
                            ? "Access your deep-indexed library and manage your files smarter."
                            : "Keep your workflow organized with Lexicon's AI-powered indexing."}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => setIsLogin(!isLogin)}
                        sx={{
                            color: 'white', borderColor: 'white', borderRadius: 10, px: 8,
                            py: 1.5, fontWeight: 700, borderWidth: 2,
                            '&:hover': { borderWidth: 2, bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        {isLogin ? "GO TO SIGN UP" : "GO TO SIGN IN"}
                    </Button>
                </Box>
            </Box>

        </Box>
    );
}

// Sub-component for Form Fields
function FormContent({ type, formData, handleInputChange, setIsLogin, handleSubmit, showPassword, setShowPassword, loading }) {
    const isLogin = type === "Login";
    return (
        <Box sx={{ width: '100%', maxWidth: '400px' }}>
            <Stack spacing={1} mb={6} alignItems="flex-start">
                <Box sx={{ bgcolor: '#0061FF', p: 1, borderRadius: 2, display: 'flex' }}>
                    <FolderZip sx={{ color: 'white' }} />
                </Box>
                <Typography variant="h3" fontWeight={900} color="#111827">
                    {isLogin ? "Sign In" : "Create Account"}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Secure, content-aware file management.
                </Typography>
            </Stack>

            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    {!isLogin && (
                        <TextField
                            fullWidth label="Full Name" name="name"
                            variant="standard" required
                            value={formData.name} onChange={handleInputChange}
                        />
                    )}

                    <TextField
                        fullWidth label="Email Address" name="email"
                        variant="standard" type="email" required
                        value={formData.email} onChange={handleInputChange}
                    />

                    <TextField
                        fullWidth label="Password" name="password"
                        variant="standard" required
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password} onChange={handleInputChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        fullWidth variant="contained" type="submit" disabled={loading}
                        sx={{ py: 2, bgcolor: '#0061FF', borderRadius: 2, fontWeight: 700, mt: 4 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? "SIGN IN" : "SIGN UP")}
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}
import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Container, CircularProgress, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Added onLogin and onSignup props to match your App.jsx requirements
const Auth = ({ onLogin, onSignup }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                // Pass only email and password for login
                await onLogin({
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password
                });
            } else {
                // Pass full object for signup
                await onSignup({
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Authentication failed");
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError("");
        setFormData({ name: "", email: "", password: "" });
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #E0F2F1 0%, #FFCCBC 100%)',
        }}>
            <Container maxWidth="sm">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isLogin ? 'login' : 'signup'}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Paper elevation={10} sx={{ p: 5, borderRadius: 4, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                            <Typography variant="h4" fontWeight="bold" gutterBottom color="teal">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </Typography>

                            {error && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                                {!isLogin && (
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        name="name"
                                        margin="normal"
                                        variant="standard"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                )}
                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    margin="normal"
                                    variant="standard"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type="password"
                                    margin="normal"
                                    variant="standard"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                />

                                <Button
                                    fullWidth
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    sx={{ mt: 4, py: 1.5, bgcolor: 'teal', '&:hover': { bgcolor: '#004d40' } }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? 'Sign In' : 'Join Now')}
                                </Button>

                                <Typography
                                    align="center"
                                    sx={{ mt: 3, cursor: loading ? 'default' : 'pointer', color: '#555', fontSize: '0.9rem' }}
                                    onClick={!loading ? toggleMode : undefined}
                                >
                                    {isLogin ? "Don't have an account? Sign Up" : "Already a member? Login"}
                                </Typography>
                            </Box>
                        </Paper>
                    </motion.div>
                </AnimatePresence>
            </Container>
        </Box>
    );
};

export default Auth;
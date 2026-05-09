import React, { useState, useEffect } from "react";
import {
  Box, Paper, TextField, Button, Typography,
  IconButton, InputAdornment, Checkbox, FormControlLabel,
  CircularProgress, Stack, Alert
} from "@mui/material";
import {
  Email, Lock, Person, Visibility, VisibilityOff,
  Facebook, Twitter, GitHub, LinkedIn, ArrowForward
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPanel({ onLogin, onSignup }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  // Cleanup effect
  useEffect(() => {
    return () => setLoading(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLocalError("");
    setLoading(true);

    const cleanData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    try {
      if (isLogin) {
        await onLogin({ email: cleanData.email, password: cleanData.password });
      } else {
        // Ensure name is provided for signup
        if (!cleanData.name) {
          throw new Error("Name is required for registration.");
        }
        await onSignup(cleanData);
      }

      // If code reaches here, auth was successful. 
      // We don't necessarily need setLoading(false) if the component unmounts,
      // but it's safer to have it in case the redirect takes time.
    } catch (err) {
      // FIX: Capture various error formats (Axios error vs standard Error)
      const errorMessage = err.response?.data?.message || err.message || "Connection refused.";
      setLocalError(errorMessage);
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (loading) return;
    setIsLogin(!isLogin);
    setLocalError("");
    setFormData({ name: "", email: "", password: "" });
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      bgcolor: '#f0f2f5',
      p: 2
    }}>
      <Paper
        elevation={24}
        sx={{
          display: "flex",
          width: { xs: "100%", md: "850px" },
          minHeight: "550px",
          borderRadius: 4,
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        {/* LEFT PANEL */}
        <Box
          sx={{
            flex: 1,
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #3a97f9 0%, #1b2559 100%)",
            color: "white",
            p: 4,
            textAlign: "center",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "toSignup" : "toLogin"}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              <Typography variant="h3" fontWeight={800} gutterBottom>
                {isLogin ? "New Here?" : "Welcome Back!"}
              </Typography>
              <Typography sx={{ mb: 4, opacity: 0.9 }}>
                {isLogin
                  ? "Sign up and start managing your files with our Intelligent Inverted Index."
                  : "To keep connected with us please login with your personal info."}
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={handleToggle}
                disabled={loading}
                startIcon={isLogin ? <Person /> : <ArrowForward />}
                sx={{
                  borderRadius: 10,
                  px: 4,
                  borderWidth: 2,
                  "&:hover": { borderWidth: 2, bgcolor: "rgba(255,255,255,0.1)" }
                }}
              >
                {isLogin ? "SIGN UP" : "LOG IN"}
              </Button>
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* RIGHT PANEL */}
        <Box sx={{ flex: 1.2, p: { xs: 3, md: 6 }, display: "flex", flexDirection: "column" }}>
          <Typography variant="h4" fontWeight={800} align="center" gutterBottom sx={{ color: '#1b2559' }}>
            {isLogin ? "Sign In" : "Create Account"}
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 2 }}>
            {[Facebook, Twitter, GitHub, LinkedIn].map((Icon, i) => (
              <IconButton key={i} disabled={loading} sx={{ border: "1px solid #edf2f7", color: "#718096" }}>
                <Icon fontSize="small" />
              </IconButton>
            ))}
          </Box>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            or use your email for {isLogin ? "login" : "registration"}
          </Typography>

          {localError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {localError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {!isLogin && (
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="filled"
                  required
                  disabled={loading}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  InputProps={{ disableUnderline: true, startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} /> }}
                  sx={{ '& .MuiFilledInput-root': { borderRadius: 3, bgcolor: '#f4f7fe' } }}
                />
              )}
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="filled"
                required
                disabled={loading}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                InputProps={{ disableUnderline: true, startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} /> }}
                sx={{ '& .MuiFilledInput-root': { borderRadius: 3, bgcolor: '#f4f7fe' } }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                variant="filled"
                required
                disabled={loading}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                InputProps={{
                  disableUnderline: true,
                  startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} disabled={loading} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiFilledInput-root': { borderRadius: 3, bgcolor: '#f4f7fe' } }}
              />

              {isLogin && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={<Checkbox size="small" defaultChecked disabled={loading} />}
                    label={<Typography variant="caption" fontWeight={600}>Remember Me</Typography>}
                  />
                  <Typography variant="caption" sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 700 }}>
                    Forgot Password?
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.8,
                  borderRadius: 10,
                  bgcolor: "#3a97f9",
                  fontWeight: 800,
                  boxShadow: '0px 10px 20px rgba(58, 151, 249, 0.3)',
                  "&:hover": { bgcolor: "#1b2559" }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? "SIGN IN" : "GET STARTED")}
              </Button>

              <Typography
                variant="body2"
                align="center"
                sx={{
                  mt: 2,
                  display: { md: 'none' },
                  cursor: loading ? 'default' : 'pointer',
                  color: 'primary.main',
                  fontWeight: 700
                }}
                onClick={handleToggle}
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </Typography>
            </Stack>
          </form>
        </Box>
      </Paper>
    </Box>
  );
}
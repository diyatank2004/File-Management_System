import React, { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import AppButton from "../common/AppButton";
import AppCard from "../common/AppCard";
import AppInput from "../common/AppInput";

export default function AuthPanel({ onLogin, onSignup, loading }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (tab === "login") {
      onLogin({ email: form.email, password: form.password });
      return;
    }

    onSignup({ name: form.name, email: form.email, password: form.password });
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <AppCard sx={{ width: "100%", maxWidth: 460, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h5">Welcome to File Management Pro</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Login or create an account to access your files.
        </Typography>

        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab value="login" label="Login" />
          <Tab value="signup" label="Sign Up" />
        </Tabs>

        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {tab === "signup" && (
            <AppInput
              label="Name"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
            />
          )}
          <AppInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
          />
          <AppInput
            label="Password"
            type="password"
            value={form.password}
            onChange={(event) => handleChange("password", event.target.value)}
          />
          <AppButton disabled={loading} onClick={handleSubmit}>
            {loading ? "Please wait..." : tab === "login" ? "Login" : "Create Account"}
          </AppButton>
        </Stack>
      </AppCard>
    </Box>
  );
}

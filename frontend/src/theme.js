import { createTheme } from "@mui/material/styles";

export function buildAppTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "light" ? "#2563eb" : "#7aa2ff"
      },
      secondary: {
        main: mode === "light" ? "#14b8a6" : "#5eead4"
      },
      background: {
        default: mode === "light" ? "#f5f7fb" : "#0f172a",
        paper: mode === "light" ? "#ffffff" : "#111827"
      }
    },
    shape: {
      borderRadius: 12
    },
    typography: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      h5: {
        fontWeight: 700
      },
      h6: {
        fontWeight: 700
      }
    }
  });
}

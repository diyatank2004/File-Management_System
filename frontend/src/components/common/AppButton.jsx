import React from "react";
import Button from "@mui/material/Button";

export default function AppButton({ children, ...props }) {
  return (
    <Button variant="contained" disableElevation {...props}>
      {children}
    </Button>
  );
}

import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export default function AppCard({ children, contentSx, ...props }) {
  return (
    <Card elevation={0} {...props}>
      <CardContent sx={contentSx}>{children}</CardContent>
    </Card>
  );
}

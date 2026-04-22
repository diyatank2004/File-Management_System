import React from "react";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Stack from "@mui/material/Stack";
import AppInput from "../common/AppInput";

export default function SearchFilterBar({
  nameQuery,
  onNameQueryChange,
  typeFilter,
  onTypeFilterChange,
  dateFilter,
  onDateFilterChange,
  viewMode,
  onViewModeChange
}) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="center">
      <Box sx={{ flex: 1, width: "100%" }}>
        <AppInput
          placeholder="Search by filename or file content"
          value={nameQuery}
          onChange={(event) => onNameQueryChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            )
          }}
        />
      </Box>
      <Box sx={{ width: { xs: "100%", md: 170 } }}>
        <AppInput select label="Type" value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value)}>
          <MenuItem value="all">All Types</MenuItem>
          <MenuItem value="pdf">PDF</MenuItem>
          <MenuItem value="image">Image</MenuItem>
          <MenuItem value="document">Document</MenuItem>
          <MenuItem value="spreadsheet">Spreadsheet</MenuItem>
          <MenuItem value="presentation">Presentation</MenuItem>
          <MenuItem value="code">Code</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </AppInput>
      </Box>
      <Box sx={{ width: { xs: "100%", md: 170 } }}>
        <AppInput select label="Date" value={dateFilter} onChange={(event) => onDateFilterChange(event.target.value)}>
          <MenuItem value="all">All Time</MenuItem>
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="week">This Week</MenuItem>
          <MenuItem value="month">This Month</MenuItem>
          <MenuItem value="year">This Year</MenuItem>
        </AppInput>
      </Box>
      <Stack direction="row" spacing={0.5}>
        <IconButton color={viewMode === "grid" ? "primary" : "default"} onClick={() => onViewModeChange("grid")}>
          <GridViewRoundedIcon />
        </IconButton>
        <IconButton color={viewMode === "list" ? "primary" : "default"} onClick={() => onViewModeChange("list")}>
          <TableRowsRoundedIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}

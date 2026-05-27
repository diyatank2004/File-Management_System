import React from "react";
import {
    Paper, TextField, InputAdornment, IconButton, Stack,
    MenuItem, Select, FormControl, InputLabel, Button
} from "@mui/material";
import { Search, Clear, FilterList } from "@mui/icons-material";

export default function FileSearchHeader({
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterDate,
    setFilterDate,
    onClear
}) {
    return (
        <Paper sx={{ p: 3, borderRadius: 4, border: "1px solid #E2E8F0" }} elevation={0}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">

                {/* Search Input Field */}
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type a phrase or keyword to search inside your documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: searchQuery && (
                            <InputAdornment position="end">
                                <IconButton onClick={onClear} size="small">
                                    <Clear />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />

                {/* Filter by File Type */}
                <FormControl sx={{ minWidth: 160, width: { xs: "100%", md: "auto" } }}>
                    <InputLabel id="type-select-label">File Type</InputLabel>
                    <Select
                        labelId="type-select-label"
                        value={filterType}
                        label="File Type"
                        onChange={(e) => setFilterType(e.target.value)}
                        sx={{ borderRadius: 3 }}
                    >
                        <MenuItem value="all">All Types</MenuItem>
                        <MenuItem value="image">Images</MenuItem>
                        <MenuItem value="doc">Documents (PDF/Docx/Txt)</MenuItem>
                        <MenuItem value="spreadsheet">Spreadsheets (XLS/XLSX/CSV)</MenuItem>
                        <MenuItem value="presentation">Presentations (PPT/PPTX)</MenuItem>
                        <MenuItem value="code">Code Files</MenuItem>
                    </Select>
                </FormControl>

                {/* Filter by Date */}
                <FormControl sx={{ minWidth: 160, width: { xs: "100%", md: "auto" } }}>
                    <InputLabel id="date-select-label">Timeframe</InputLabel>
                    <Select
                        labelId="date-select-label"
                        value={filterDate}
                        label="Timeframe"
                        onChange={(e) => setFilterDate(e.target.value)}
                        sx={{ borderRadius: 3 }}
                    >
                        <MenuItem value="all">Anytime</MenuItem>
                        <MenuItem value="today">Past 24 Hours</MenuItem>
                        <MenuItem value="week">Past Week</MenuItem>
                        <MenuItem value="month">Past Month</MenuItem>
                    </Select>
                </FormControl>

            </Stack>
        </Paper>
    );
}
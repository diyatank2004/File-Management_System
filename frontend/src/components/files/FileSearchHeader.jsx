import React from 'react';
import { 
    Box, TextField, InputAdornment, Select, MenuItem, 
    FormControl, IconButton, Stack, Typography 
} from '@mui/material';
import { 
    Search, FilterList, CalendarToday, 
    GridView, ViewList, Close 
} from '@mui/icons-material';

export default function FileSearchHeader({ 
    searchQuery, setSearchQuery, 
    filterType, setFilterType, 
    filterDate, setFilterDate, 
    viewMode, setViewMode,
    onClear
}) {
    return (
        <Box 
            sx={{ 
                mb: 4, 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center', 
                gap: 2,
                p: 2,
                bgcolor: 'white',
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                border: '1px solid #E2E8F0'
            }}
        >
            {/* Search Input */}
            <TextField
                fullWidth
                placeholder="Search inside files (OCR)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ 
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 50,
                        bgcolor: '#F1F5F9',
                        '& fieldset': { border: 'none' },
                        height: 48
                    }
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search sx={{ color: '#64748B', ml: 1 }} />
                        </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={onClear}>
                                <Close fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />

            <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                {/* Type Filter */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        displayEmpty
                        sx={{ 
                            borderRadius: 3, 
                            bgcolor: 'white',
                            height: 40,
                            fontWeight: 700,
                            fontSize: '0.85rem'
                        }}
                    >
                        <MenuItem value="all">All Types</MenuItem>
                        <MenuItem value="image">Images</MenuItem>
                        <MenuItem value="pdf">PDF Documents</MenuItem>
                        <MenuItem value="music">Audio Files</MenuItem>
                    </Select>
                </FormControl>

                {/* Date Filter */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        displayEmpty
                        sx={{ 
                            borderRadius: 3, 
                            bgcolor: 'white',
                            height: 40,
                            fontWeight: 700,
                            fontSize: '0.85rem'
                        }}
                    >
                        <MenuItem value="all">All Time</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="week">Last 7 Days</MenuItem>
                        <MenuItem value="month">Last 30 Days</MenuItem>
                    </Select>
                </FormControl>

                {/* View Mode Toggle */}
                <Stack 
                    direction="row" 
                    spacing={0.5} 
                    sx={{ 
                        bgcolor: '#F1F5F9', 
                        p: 0.5, 
                        borderRadius: 3,
                        border: '1px solid #E2E8F0'
                    }}
                >
                    <IconButton 
                        size="small" 
                        onClick={() => setViewMode('grid')}
                        sx={{ 
                            borderRadius: 2,
                            bgcolor: viewMode === 'grid' ? 'white' : 'transparent',
                            boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            color: viewMode === 'grid' ? 'primary.main' : 'text.secondary'
                        }}
                    >
                        <GridView fontSize="small" />
                    </IconButton>
                    <IconButton 
                        size="small" 
                        onClick={() => setViewMode('list')}
                        sx={{ 
                            borderRadius: 2,
                            bgcolor: viewMode === 'list' ? 'white' : 'transparent',
                            boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            color: viewMode === 'list' ? 'primary.main' : 'text.secondary'
                        }}
                    >
                        <ViewList fontSize="small" />
                    </IconButton>
                </Stack>
            </Stack>
        </Box>
    );
}

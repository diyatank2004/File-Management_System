import React, { useState } from 'react';
import { TextField, IconButton, InputAdornment, Paper, Typography, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { searchFiles as apiSearch } from '../../services/api';

export default function SearchBar({ label, searchType = 'filename', token, onSearchResults }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setLoading(true);
    try {
      const data = await apiSearch(token, trimmedQuery, searchType);
      // Backend returns { files: [...] } or { results: [...] }. 
      // We check both to be safe.
      const results = data.files || data.results || [];
      onSearchResults(results, trimmedQuery);
    } catch (err) {
      console.error('Search error:', err);
      onSearchResults([], '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} elevation={0}>
      <Typography variant="h6" gutterBottom fontWeight={700}>{label}</Typography>
      <TextField
        fullWidth
        placeholder={`Search by ${searchType}...`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleSearch} disabled={loading} color="primary">
                {loading ? <CircularProgress size={24} /> : <SearchIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
      />
    </Paper>
  );
}
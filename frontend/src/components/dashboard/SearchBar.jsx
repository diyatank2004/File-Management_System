import React, { useState } from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { searchFiles as apiSearch } from '../../services/api';

/**
 * Updated SearchBar component
 * Props:
 *   label: string – displayed above the input.
 *   searchType: 'filename' | 'content' – determines the backend search mode.
 *   token: auth token for API calls.
 *   onSearchResults: function – callback to send (results, query) to the parent.
 */
export default function SearchBar({ label, searchType = 'filename', token, onSearchResults }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setLoading(true);
    try {
      // Execute the API call
      const data = await apiSearch(token, trimmedQuery, searchType);

      // Lift the state up to the parent (ModernStorageHub)
      // Passing trimmedQuery is essential for the yellow highlighting in the Card
      if (onSearchResults) {
        onSearchResults(data.results || [], trimmedQuery);
      }
    } catch (err) {
      console.error('Search error:', err);
      // Clear results on error so the UI stays consistent
      if (onSearchResults) {
        onSearchResults([], '');
      }
    } finally {
      setLoading(false);
    }
  };

  const onKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
      elevation={0}
    >
      <Typography variant="h6" gutterBottom fontWeight={700}>
        {label}
      </Typography>
      <TextField
        fullWidth
        placeholder={`Enter ${searchType === 'filename' ? 'file name' : 'content'}...`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={onKeyPress}
        variant="outlined"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleSearch}
                disabled={loading}
                aria-label="search"
                color="primary"
              >
                {loading ? <CircularProgress size={24} /> : <SearchIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3
          }
        }}
      />
      {/* 
          Internal List removed. 
          Results are now handled by ModernStorageHub.jsx 
          using the SearchResultCard.jsx component.
      */}
    </Paper>
  );
}
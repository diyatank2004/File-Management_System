import React, { useState } from 'react';
import { TextField, IconButton, InputAdornment, List, ListItem, ListItemText, Paper, Typography, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { searchFiles as apiSearch } from '../../services/api';

/**
 * SearchBar component used in the Dashboard.
 * Props:
 *   label: string – displayed above the input (e.g. "Search Files" or "Smart Content Based Search").
 *   searchType: 'filename' | 'content' – determines the backend search mode.
 *   token: auth token for API calls.
 */
export default function SearchBar({ label, searchType = 'filename', token }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await apiSearch(token, query.trim(), searchType);
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} elevation={0}>
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
              <IconButton onClick={handleSearch} disabled={loading} aria-label="search">
                {loading ? <CircularProgress size={20} /> : <SearchIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {results.length > 0 && (
        <List sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
          {results.map((file) => (
            <ListItem key={file.id} divider>
              <ListItemText
                primary={file.filename}
                secondary={`Type: ${file.fileType || 'unknown'} • Size: ${file.size} bytes`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

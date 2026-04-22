import React from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import HighlightedText from "../common/HighlightedText";
import FileTypeIcon from "./FileTypeIcon";
import { formatBytes } from "../../utils/fileHelpers";

export default function FileList({ files, searchQuery, onRequestDelete }) {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Modified</TableCell>
            <TableCell>Size</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {file.path}
                </Typography>
                {file.snippet && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.4 }}>
                    <HighlightedText text={file.snippet} query={searchQuery} component="span" />
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FileTypeIcon type={file.type} />
                  <Chip label={file.type} size="small" variant="outlined" />
                </Stack>
              </TableCell>
              <TableCell>{new Date(file.lastModified).toLocaleDateString()}</TableCell>
              <TableCell>{formatBytes(file.size)}</TableCell>
              <TableCell align="right">
                <IconButton size="small" color="error" onClick={() => onRequestDelete(file)}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

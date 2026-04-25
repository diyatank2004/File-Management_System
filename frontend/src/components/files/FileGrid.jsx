import React from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import AppCard from "../common/AppCard";
import HighlightedText from "../common/HighlightedText";
import FileTypeIcon from "./FileTypeIcon";
import { formatBytes } from "../../utils/fileHelpers";

export default function FileGrid({
  files,
  searchQuery,
  onRequestDelete
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 1.5
      }}
    >
      {files.map((file) => (
        <motion.div key={file.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <AppCard sx={{ height: "100%", border: "1px solid", borderColor: "divider" }} contentSx={{ p: 2.2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <FileTypeIcon type={file.type} />
              <IconButton size="small">
                <MoreHorizRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Typography variant="subtitle2" noWrap title={file.name}>
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {file.path}
            </Typography>
            {file.snippet && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1, minHeight: 36, lineHeight: 1.4 }}
              >
                <HighlightedText text={file.snippet} query={searchQuery} component="span" />
              </Typography>
            )}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5}>
              <Chip size="small" label={file.type} variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                {formatBytes(file.size)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="flex-end" mt={0.6}>
              <IconButton size="small" color="error" onClick={() => onRequestDelete(file)}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </AppCard>
        </motion.div>
      ))}
    </Box>
  );
}

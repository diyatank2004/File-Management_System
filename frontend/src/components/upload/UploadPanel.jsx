import React from "react";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppButton from "../common/AppButton";

export default function UploadPanel({
  pendingFiles,
  uploadProgress,
  isUploading,
  onFilesSelected,
  onStartUpload
}) {
  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer.files || []);
    if (dropped.length) {
      onFilesSelected(dropped);
    }
  };

  const handleInputChange = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length) {
      onFilesSelected(selected);
    }
    event.target.value = "";
  };

  return (
    <Stack spacing={2}>
      <Box
        className="upload-dropzone"
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        <CloudUploadOutlinedIcon sx={{ fontSize: 36, color: "primary.main" }} />
        <Typography variant="h6" sx={{ mt: 1 }}>
          Drag and drop files here
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or choose files/folders from your device to index searchable content
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
          <AppButton component="label">
            Choose Files
            <input hidden type="file" multiple onChange={handleInputChange} />
          </AppButton>
          <AppButton component="label" color="secondary" variant="outlined">
            Choose Folder
            <input hidden type="file" multiple webkitdirectory="" directory="" onChange={handleInputChange} />
          </AppButton>
        </Stack>
      </Box>

      {pendingFiles.length > 0 && (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <List dense>
            {pendingFiles.map((file) => (
              <ListItem key={file.id} divider>
                <ListItemText
                  primary={file.file.name}
                  secondary={
                    file.previewUrl
                      ? "Preview available"
                      : "No visual preview for this type"
                  }
                />
                {file.previewUrl && (
                  <Box
                    component="img"
                    src={file.previewUrl}
                    alt={file.file.name}
                    sx={{ width: 48, height: 48, borderRadius: 1, objectFit: "cover" }}
                  />
                )}
              </ListItem>
            ))}
          </List>
          {isUploading && <LinearProgress variant="determinate" value={uploadProgress} />}
        </Box>
      )}

      <AppButton disabled={!pendingFiles.length || isUploading} onClick={onStartUpload}>
        {isUploading ? `Uploading ${uploadProgress}%` : "Start Upload"}
      </AppButton>
    </Stack>
  );
}

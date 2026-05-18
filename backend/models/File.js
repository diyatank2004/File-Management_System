// backend/models/File.js
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  fileType: { type: String, required: true },
  mimetype: { type: String, default: "application/octet-stream" }, // Added for frontend compatibility
  size: { type: Number, required: true },
  content: { type: String, default: "" }, // Stores your extracted OCR text
  relativePath: { type: String, default: "" },
  fileHash: { type: String, default: "" }, // For duplicate detection
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

// --- ADD THIS CRITICAL LINE TO ENABLE NATIVE TEXT SEARCHING ---
fileSchema.index({ content: "text", filename: "text" });

const File = mongoose.model("File", fileSchema);
export default File;
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true
    },
    fileType: {
      type: String,
      required: true,
      trim: true
      // General categories: 'image', 'pdf', 'music', 'other'
    },
    mimetype: {
      type: String,
      default: ""
      // Specific MIME type for backend scanning (e.g., 'application/pdf')
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    content: {
      type: String,
      default: ""
      // Stores extracted text for Reverse Indexing
    },
    relativePath: {
      type: String,
      default: ""
    },
    pdfDataUrl: {
      type: String,
      default: ""
    },
    hasPdfBinary: {
      type: Boolean,
      default: false
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    fileHash: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// --- SEARCH OPTIMIZATION ---
// This index allows MongoDB to search inside 'content' and 'filename' 
// simultaneously during Content Search.
fileSchema.index({ filename: "text", content: "text" });

export default mongoose.model("File", fileSchema);
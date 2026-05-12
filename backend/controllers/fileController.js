import File from "../models/File.js";
import * as pdf from 'pdf-parse';
import Tesseract from "tesseract.js";

const MAX_STORAGE_LIMIT = 1073741824;

// --- HELPER FUNCTIONS ---

function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeContent(content) {
  if (typeof content !== "string") return "";
  return content.slice(0, 200000);
}

function normalizePath(path) {
  if (typeof path !== "string") return "";
  return path.trim().slice(0, 500);
}

function createSnippet(content, query) {
  if (!query || typeof content !== "string" || !content.length) return "";
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);
  if (index === -1) return "";

  const start = Math.max(0, index - 120);
  const end = Math.min(content.length, index + query.length + 220);
  const snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "... " : ""}${snippet}${end < content.length ? " ..." : ""}`;
}

// --- CONTROLLERS ---

/**
 * GET FILES
 */
export async function getFiles(req, res, next) {
  try {
    const query = String(req.query.q || "").trim();
    const userId = req.user.id;
    const filter = { uploadedBy: userId };
    const includeContent = query.length >= 3;

    if (query) {
      const regex = new RegExp(escapeRegex(query), "i");
      filter.$or = includeContent
        ? [{ filename: regex }, { relativePath: regex }, { content: regex }]
        : [{ filename: regex }, { relativePath: regex }];
    }

    const projection = "filename fileType size createdAt content relativePath hasPdfBinary mimetype";
    const files = await File.find(filter, projection).sort({ createdAt: -1 }).lean();

    const normalizedFiles = files.map((file) => {
      const item = { ...file };
      if (query && includeContent && item.content) {
        item.snippet = createSnippet(item.content, query);
      }
      if (!includeContent) {
        delete item.content;
      }
      return item;
    });

    return res.status(200).json({
      files: normalizedFiles,
      search: { query, matched: normalizedFiles.length }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * SCAN & UPLOAD
 */// Ensure you have these imports at the top of your controller:
// import Tesseract from "tesseract.js";
// import pdf from "pdf-parse"; 

export async function uploadAndIndex(req, res, next) {
  try {
    // 1. Validate File Presence
    if (!req.file) {
      return res.status(400).json({ message: "No file provided for scanning" });
    }

    if (currentTotalSize + newFileSize > MAX_STORAGE_LIMIT) {
      return res.status(400).json({ message: "Storage limit reached!" });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const relativePath = req.body.relativePath || "";
    let extractedText = "";

    // 2. ENGINE: OCR / Text Extraction
    try {
      if (mimetype === "application/pdf") {
        // Safe check for pdf-parse import style
        const pdfParser = pdf.default ? pdf.default : pdf;
        const data = await pdfParser(buffer);
        extractedText = data.text;
      } else if (mimetype.startsWith("image/")) {
        // Tesseract works best with buffers in this specific call format
        const { data: { text } } = await Tesseract.recognize(buffer, "eng");
        extractedText = text;
      }
    } catch (engineErr) {
      console.error("Extraction Engine Failed:", engineErr);
      return res.status(500).json({ message: "Extraction Engine failed to read file content" });
    }

    // 3. CONTENT CLEANING
    // If normalizeContent isn't defined, we'll do a basic trim/clean here
    const normalizedContent = extractedText ? extractedText.trim().replace(/\s+/g, ' ') : "";

    // 4. SMART DUPLICATE CHECK
    // We check for the same user + same filename + same size to be safe
    const duplicate = await File.findOne({
      uploadedBy: req.user.id,
      filename: originalname,
      size: size
    }).select("_id").lean();

    if (duplicate) {
      return res.status(409).json({ message: "This file has already been indexed." });
    }

    // 5. FILE TYPE CATEGORIZATION
    let fileType = "other";
    if (mimetype.startsWith("image/")) fileType = "image";
    else if (mimetype === "application/pdf") fileType = "pdf";
    else if (mimetype.startsWith("audio/")) fileType = "music";

    // 6. DATABASE COMMIT
    const file = await File.create({
      filename: originalname,
      fileType,
      mimetype,
      size,
      content: normalizedContent,
      // Helper to ensure path starts with a slash
      relativePath: relativePath.startsWith('/') ? relativePath : `/${relativePath}`,
      uploadedBy: req.user.id,
      hasPdfBinary: mimetype === "application/pdf"
    });

    return res.status(201).json({
      message: "File successfully reverse-indexed",
      file: {
        id: file._id,
        filename: file.filename,
        fileType: file.fileType,
        size: file.size
      }
    });

  } catch (error) {
    console.error("LEXICON_CORE_ERROR:", error);
    // Use res.status here to ensure the frontend gets a clean JSON error
    return res.status(500).json({ message: "OCR/Indexing Engine Error", details: error.message });
  }
}

/**
 * UTILITY CONTROLLERS
 */
export async function getFileById(req, res, next) {
  try {
    const { id } = req.params;
    const file = await File.findOne({ _id: id, uploadedBy: req.user.id }).lean();
    if (!file) return res.status(404).json({ message: "File not found" });
    return res.status(200).json({ file });
  } catch (error) {
    next(error);
  }
}

export async function deleteFileMetadata(req, res, next) {
  try {
    const { id } = req.params;
    const file = await File.findOne({ _id: id, uploadedBy: req.user.id });
    if (!file) return res.status(404).json({ message: "File not found" });
    await file.deleteOne();
    return res.status(200).json({ message: "File deleted" });
  } catch (error) {
    next(error);
  }
}

export async function deleteAllFileMetadata(req, res, next) {
  try {
    const result = await File.deleteMany({ uploadedBy: req.user.id });
    return res.status(200).json({
      message: "All files cleared",
      deletedCount: result.deletedCount || 0
    });
  } catch (error) {
    next(error);
  }
}
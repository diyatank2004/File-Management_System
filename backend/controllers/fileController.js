import File from "../models/File.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import Tesseract from "tesseract.js";
import crypto from "crypto";

// Load libraries using createRequire
const pdfParseModule = require('pdf-parse');
// FIX: Defensive check to handle different export styles (CommonJS vs ES Module)
const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule.default;
const officeParser = require('officeparser');

const MAX_STORAGE_LIMIT = 1073741824; // 1GB limit

// --- HELPER FUNCTIONS ---

function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createSnippet(content, query) {
  if (!query || typeof content !== "string" || !content.length) return "";
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);

  if (index === -1) return content.slice(0, 400) + "...";

  const start = Math.max(0, index - 150);
  const end = Math.min(content.length, index + query.length + 150);
  const snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "... " : ""}${snippet}${end < content.length ? " ..." : ""}`;
}

// --- CONTROLLERS ---

/**
 * GET FILES - OCR-Enabled Search and Filtering
 */
/**
 * GET FILES - OCR-Enabled Search and Filtering
 */
export async function getFiles(req, res, next) {
  try {
    // FIX: Destructure 'query' directly from req.query so it is defined!
    const { query, mode, type, dateRange } = req.query;
    const filter = { uploadedBy: req.user.id };

    // Only add fileType to filter if it's NOT "all", "both", or "content"
    if (type && type !== "all" && type !== "both" && type !== "content") {
      filter.fileType = type;
    }

    // Handle date range filtering safely
    const activeDateRange = dateRange || 'all';
    if (activeDateRange !== "all") {
      const now = new Date();
      let startDate;
      if (activeDateRange === "today") {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (activeDateRange === "week") {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (activeDateRange === "month") {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      }
      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    // Now 'query' is defined and safe to check!
    if (query && query.trim() !== "") {
      const safeQuery = escapeRegex(query);
      const regex = new RegExp(safeQuery, "i");

      if (mode === "content") {
        filter.content = { $regex: safeQuery, $options: "i" };
      } else if (mode === "filename") {
        filter.$or = [{ filename: regex }, { relativePath: regex }];
      } else {
        // Mode "both"
        filter.$or = [
          { filename: regex },
          { relativePath: regex },
          { content: { $regex: safeQuery, $options: "i" } }
        ];
      }
    }

    const projection = "filename fileType size createdAt content relativePath mimetype _id";
    const files = await File.find(filter, projection).sort({ createdAt: -1 }).lean();

    const normalizedFiles = files.map((file) => {
      const item = { ...file };
      if (query && item.content) {
        item.snippet = createSnippet(item.content, query);
      }
      if (mode !== "content" && !query) {
        delete item.content;
      }
      return item;
    });

    return res.status(200).json({
      files: normalizedFiles,
      search: { query: query || "", matched: normalizedFiles.length, mode }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * SCAN & UPLOAD - OCR Content Extraction & Reverse Indexing
 */
export async function uploadAndIndex(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ message: "No file provided for scanning" });
  }

  const { buffer, originalname, mimetype, size } = req.file;
  const relativePath = req.body.relativePath || "";
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  try {
    // 1. SMART DUPLICATE CHECK
    const duplicate = await File.findOne({
      uploadedBy: req.user.id,
      $or: [
        { fileHash: fileHash },
        { filename: originalname, size: size }
      ]
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        message: duplicate.fileHash === fileHash
          ? "This exact content has already been indexed."
          : "A file with this name and size already exists.",
        duplicateOf: duplicate.filename
      });
    }

    // 2. STORAGE LIMIT CHECK
    const userFiles = await File.find({ uploadedBy: req.user.id }).select("size").lean();
    const currentTotalSize = userFiles.reduce((acc, f) => acc + (f.size || 0), 0);

    if (currentTotalSize + size > MAX_STORAGE_LIMIT) {
      return res.status(400).json({
        message: "Storage limit reached (1GB cap).",
        used: (currentTotalSize / 1024 / 1024).toFixed(2),
        limit: 1024
      });
    }

    // 3. OCR ENGINE: EXTRACTION PHASE
    let extractedText = "";
    const isPdf = mimetype === "application/pdf" || originalname.toLowerCase().endsWith(".pdf");
    const isImage = mimetype.startsWith("image/");
    const isText = mimetype.startsWith("text/") || originalname.toLowerCase().endsWith(".txt");
    const isOffice = mimetype.includes("officedocument") || originalname.match(/\.(docx?|xlsx?|pptx?)$/i);

    try {
      if (isPdf) {
        const data = await pdfParse(buffer);
        extractedText = data.text || "";
      } else if (isImage) {
        const { data: { text } } = await Tesseract.recognize(buffer, "eng+hin+mar+fra+spa");
        extractedText = text || "";
      } else if (isText) {
        extractedText = buffer.toString('utf8');
      } else if (isOffice) {
        const result = await officeParser.parseOffice(buffer);
        extractedText = typeof result === "string" ? result : (result?.text || "");
      }
    } catch (engineErr) {
      console.warn(`[OCR_ENGINE] Extraction failed for ${originalname}:`, engineErr.message);
    }

    // 4. DATABASE COMMIT
    const file = await File.create({
      filename: originalname,
      fileType: isPdf ? "pdf" : (isImage ? "image" : (mimetype.startsWith("audio") ? "music" : "other")),
      mimetype,
      size,
      content: extractedText.trim().replace(/\s+/g, ' ').slice(0, 200000),
      relativePath: relativePath.startsWith('/') ? relativePath : `/${relativePath}`,
      uploadedBy: req.user.id,
      fileHash: fileHash
    });

    return res.status(201).json({
      message: "File successfully indexed",
      file: { id: file._id, filename: file.filename, type: file.fileType }
    });

  } catch (error) {
    next(error);
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
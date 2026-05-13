import File from "../models/File.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import Tesseract from "tesseract.js";
import crypto from "crypto";

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
  if (index === -1) return content.slice(0, 400) + "...";

  // EXPANDED: More context for the premium look
  const start = Math.max(0, index - 200);
  const end = Math.min(content.length, index + query.length + 400);
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
    const mode = req.query.mode || "both"; // modes: 'filename', 'content', 'both'
    const type = req.query.type || "all";
    const dateRange = req.query.date || "all";
    const userId = req.user.id;
    
    const filter = { uploadedBy: userId };
    const includeContent = query.length >= 3;

    // 1. Apply Type Filter
    if (type !== "all") {
      filter.fileType = type;
    }

    // 2. Apply Date Filter
    if (dateRange !== "all") {
      const now = new Date();
      let startDate;
      if (dateRange === "today") {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (dateRange === "week") {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (dateRange === "month") {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      }
      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    // 3. Apply Search Query
    if (query) {
      const regex = new RegExp(escapeRegex(query), "i");
      console.log(`[LEXICON_SEARCH] Mode: ${mode}, Query: ${query}`);
      
      if (mode === "content") {
        filter.content = regex;
      } else if (mode === "filename") {
        filter.$or = [{ filename: regex }, { relativePath: regex }];
      } else {
        filter.$or = includeContent
          ? [{ filename: regex }, { relativePath: regex }, { content: regex }]
          : [{ filename: regex }, { relativePath: regex }];
      }
    }

    console.log(`[LEXICON_SEARCH] Final Filter:`, JSON.stringify(filter));
    const projection = "filename fileType size createdAt content relativePath hasPdfBinary mimetype";
    const files = await File.find(filter, projection).sort({ createdAt: -1 }).lean();
    console.log(`[LEXICON_SEARCH] Matches found: ${files.length}`);

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
 */
export async function uploadAndIndex(req, res, next) {
  const fileName = req.file ? req.file.originalname : "unknown";
  console.log(`[LEXICON_ENGINE] Starting process for: ${fileName}`);

  try {
    // 1. Validate File Presence
    if (!req.file) {
      return res.status(400).json({ message: "No file provided for scanning" });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const relativePath = req.body.relativePath || "";

    // 2. GENERATE CONTENT HASH
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

    // 3. SMART DUPLICATE CHECK (Name OR Content Hash)
    const duplicate = await File.findOne({
      uploadedBy: req.user.id,
      $or: [
        { filename: originalname, size: size },
        { fileHash: fileHash }
      ]
    }).select("_id filename fileHash").lean();

    if (duplicate) {
      console.log(`[LEXICON_ENGINE] Duplicate detected: ${originalname} (Hash matched: ${duplicate.fileHash === fileHash}). Skipping...`);
      return res.status(409).json({ 
        message: "This file or identical content has already been indexed.",
        duplicateOf: duplicate.filename 
      });
    }

    // 4. Storage Limit Check
    const files = await File.find({ uploadedBy: req.user.id }).select("size").lean();
    const currentTotalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
    
    if (currentTotalSize + size > MAX_STORAGE_LIMIT) {
      return res.status(400).json({ message: "Storage limit reached (1GB cap for free tier)." });
    }

    let extractedText = "";

    // 4. ENGINE: OCR / Text Extraction
    console.log(`[LEXICON_ENGINE] Extraction phase for mimetype: ${mimetype}`);
    try {
      const isPdf = mimetype === "application/pdf" || mimetype === "application/x-pdf" || originalname.toLowerCase().endsWith(".pdf");
      const isText = mimetype === "text/plain" || originalname.toLowerCase().endsWith(".txt");
      const isImage = mimetype.startsWith("image/");

      if (isPdf) {
        console.log(`[LEXICON_ENGINE] PDF Digital Stream detected. Parsing with v2 engine...`);
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();
        extractedText = result.text || "";
        console.log(`[LEXICON_ENGINE] PDF Extraction Completed. Length: ${extractedText.length}`);
      } else if (isText) {
        console.log(`[LEXICON_ENGINE] Plain Text detected. Reading...`);
        extractedText = buffer.toString('utf8');
      } else if (isImage) {
        console.log(`[LEXICON_ENGINE] Image detected. Starting Neural OCR...`);
        const { data: { text } } = await Tesseract.recognize(buffer, "eng");
        extractedText = text;
        console.log(`[LEXICON_ENGINE] Image OCR Completed. Length: ${extractedText.length}`);
      }
    } catch (engineErr) {
      console.error(`[LEXICON_ENGINE] Engine Failure for ${originalname}:`, engineErr.message);
      // We still want to save the file even if OCR fails, but we'll log it
      extractedText = ""; 
    }

    // 5. CONTENT CLEANING
    const normalizedContent = extractedText ? extractedText.trim().replace(/\s+/g, ' ') : "";

    // 6. FILE TYPE CATEGORIZATION
    let fileType = "other";
    if (mimetype.startsWith("image/")) fileType = "image";
    else if (mimetype === "application/pdf") fileType = "pdf";
    else if (mimetype.startsWith("audio/")) fileType = "music";
    console.log(`[LEXICON_ENGINE] File type determined: ${fileType}`);

    // 7. DATABASE COMMIT
    console.log(`[LEXICON_ENGINE] Committing to storage: ${originalname}`);
    const file = await File.create({
      filename: originalname,
      fileType,
      mimetype,
      size,
      content: normalizedContent,
      relativePath: relativePath.startsWith('/') ? relativePath : `/${relativePath}`,
      uploadedBy: req.user.id,
      hasPdfBinary: mimetype === "application/pdf",
      fileHash: fileHash
    });

    console.log(`[LEXICON_ENGINE] Completed: ${originalname}`);
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
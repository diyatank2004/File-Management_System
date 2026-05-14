import File from "../models/File.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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

function extractTextFromPdfBuffer(buffer) {
  try {
    const raw = buffer.toString('latin1');
    const textChunks = [];

    // Extract text stored in PDF string objects: (text content)
    const stringRegex = /\(([^()\n\r]*)\)/g;
    let match;
    while ((match = stringRegex.exec(raw)) !== null) {
      let chunk = match[1];
      chunk = chunk.replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\')
        .replace(/\s+/g, ' ')
        .trim();
      if (chunk.length > 1 && /[A-Za-z0-9]/.test(chunk)) {
        textChunks.push(chunk);
      }
    }

    // Also attempt to decode simple hex strings as fallback text content
    const hexRegex = /<([0-9A-Fa-f\s]{4,})>/g;
    while ((match = hexRegex.exec(raw)) !== null) {
      const hexString = match[1].replace(/\s+/g, '');
      if (hexString.length % 2 !== 0) continue;
      const bytes = Buffer.from(hexString, 'hex');
      const chunk = bytes.toString('utf8').replace(/[\x00-\x08\x0E-\x1F]/g, ' ').replace(/\s+/g, ' ').trim();
      if (chunk.length > 1 && /[A-Za-z0-9]/.test(chunk)) {
        textChunks.push(chunk);
      }
    }

    return textChunks.join(' ').trim();
  } catch (err) {
    console.warn('[LEXICON_OCR_ENGINE] PDF fallback extraction failed:', err.message);
    return "";
  }
}

function createSnippet(content, query) {
  if (!query || typeof content !== "string" || !content.length) return "";
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);
  if (index === -1) return content.slice(0, 400) + "...";

  // EXPANDED: More context for better preview (300 chars before and after)
  const start = Math.max(0, index - 150);
  const end = Math.min(content.length, index + query.length + 150);
  const snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "... " : ""}${snippet}${end < content.length ? " ..." : ""}`;
}

// --- CONTROLLERS ---

/**
 * GET FILES - OCR-Enabled Search and Filtering
 */
export async function getFiles(req, res, next) {
  try {
    const query = String(req.query.q || "").trim();
    const mode = req.query.mode || "both"; // modes: 'filename', 'content', 'both'
    const type = req.query.type || "all";
    const dateRange = req.query.date || "all";
    const userId = req.user.id;

    const filter = { uploadedBy: userId };
    const includeContent = query.length > 0;

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

    // 3. Apply Search Query (OCR-Based Content Search)
    if (query) {
      const regex = new RegExp(escapeRegex(query), "i");
      console.log(`[LEXICON_OCR_SEARCH] Mode: ${mode}, Query: "${query}", User: ${userId}`);

      if (mode === "content") {
        // Strict content-only search (searches extracted OCR text)
        filter.content = regex;
        console.log(`[LEXICON_OCR_SEARCH] Content-only mode enabled`);
      } else if (mode === "filename") {
        // Filename and path search only
        filter.$or = [{ filename: regex }, { relativePath: regex }];
        console.log(`[LEXICON_OCR_SEARCH] Filename-only mode enabled`);
      } else {
        // Both mode: search filename, path, and OCR content
        filter.$or = includeContent
          ? [{ filename: regex }, { relativePath: regex }, { content: regex }]
          : [{ filename: regex }, { relativePath: regex }];
        console.log(`[LEXICON_OCR_SEARCH] Both mode enabled (filename + OCR content)`);
      }
    }

    console.log(`[LEXICON_OCR_SEARCH] Final Filter:`, JSON.stringify(filter));
    const projection = "filename fileType size createdAt content relativePath hasPdfBinary mimetype _id";
    const files = await File.find(filter, projection).sort({ createdAt: -1 }).lean();
    console.log(`[LEXICON_OCR_SEARCH] Matches found: ${files.length}, Query: "${query}"`);

    const normalizedFiles = files.map((file) => {
      const item = { ...file };
      if (query && includeContent && item.content) {
        // Generate context snippet from OCR content for matched files
        item.snippet = createSnippet(item.content, query);
      }
      if (!includeContent) {
        delete item.content;
      }
      return item;
    });

    return res.status(200).json({
      files: normalizedFiles,
      search: { query, matched: normalizedFiles.length, mode }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * SCAN & UPLOAD - OCR Content Extraction
 */
export async function uploadAndIndex(req, res, next) {
  const fileName = req.file ? req.file.originalname : "unknown";
  console.log(`[LEXICON_OCR_ENGINE] Starting file indexing process: ${fileName}`);

  try {
    // 1. Validate File Presence
    if (!req.file) {
      return res.status(400).json({ message: "No file provided for scanning" });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const relativePath = req.body.relativePath || "";

    // 2. GENERATE CONTENT HASH
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
    console.log(`[LEXICON_OCR_ENGINE] File hash generated: ${fileHash}`);

    // 3. SMART DUPLICATE CHECK (Name+Size OR Content Hash)
    const duplicate = await File.findOne({
      uploadedBy: req.user.id,
      $or: [
        { filename: originalname, size: size },
        { fileHash: fileHash }
      ]
    }).select("_id filename fileHash").lean();

    if (duplicate) {
      const isDuplicateByContent = duplicate.fileHash === fileHash;
      console.log(`[LEXICON_OCR_ENGINE] ⚠ Duplicate detected: ${originalname} ${isDuplicateByContent ? "(Content hash match)" : "(Name+size match)"}`);
      return res.status(409).json({
        message: isDuplicateByContent
          ? "This file's content has already been indexed (identical content detected)."
          : "A file with this name and size has already been indexed.",
        duplicateOf: duplicate.filename,
        duplicateType: isDuplicateByContent ? "content" : "metadata"
      });
    }

    // 4. Storage Limit Check
    const files = await File.find({ uploadedBy: req.user.id }).select("size").lean();
    const currentTotalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

    if (currentTotalSize + size > MAX_STORAGE_LIMIT) {
      const usedMB = (currentTotalSize / 1024 / 1024).toFixed(2);
      const newSize = ((currentTotalSize + size) / 1024 / 1024).toFixed(2);
      console.log(`[LEXICON_OCR_ENGINE] ✗ Storage limit exceeded: ${usedMB}MB -> ${newSize}MB (limit: 1024MB)`);
      return res.status(400).json({
        message: "Storage limit reached (1GB cap for free tier).",
        used: usedMB,
        wouldBe: newSize,
        limit: 1024
      });
    }

    // 4. ENGINE: OCR / Text Extraction (Applies to All File Types)
    console.log(`[LEXICON_OCR_ENGINE] Extraction phase for mimetype: ${mimetype}`);
    let extractedText = "";
    try {
      const isPdf = mimetype === "application/pdf" || mimetype === "application/x-pdf" || originalname.toLowerCase().endsWith(".pdf");
      const isText = mimetype === "text/plain" || originalname.toLowerCase().endsWith(".txt") || originalname.toLowerCase().endsWith(".csv");
      const isImage = mimetype.startsWith("image/");
      const isOfficeDoc = mimetype.includes("officedocument") || mimetype.includes("msword") || mimetype.includes("ms-excel") || mimetype.includes("ms-powerpoint") || mimetype === "application/vnd.ms-powerpoint" || mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || originalname.match(/\.(docx?|xlsx?|pptx?)$/i);

      if (isPdf) {
        console.log(`[LEXICON_OCR_ENGINE] PDF detected - Extracting text with pdf-parse...`);
        const pdfParse = require('pdf-parse');
        const result = await pdfParse(buffer);
        extractedText = result.text || "";

        if (!extractedText.trim()) {
          console.log('[LEXICON_OCR_ENGINE] PDF parse returned no text; using pagerender fallback...');
          const fallback = await pdfParse(buffer, {
            pagerender: (pageData) => pageData.getTextContent().then((textContent) =>
              textContent.items.map((item) => item.str).join(' ')
            )
          });
          extractedText = fallback.text || extractTextFromPdfBuffer(buffer);
        }

        console.log(`[LEXICON_OCR_ENGINE] ✓ PDF OCR Success - Extracted ${extractedText.length} characters`);
      } else if (isText) {
        console.log(`[LEXICON_OCR_ENGINE] Plain Text detected - Reading file content...`);
        extractedText = buffer.toString('utf8');
        console.log(`[LEXICON_OCR_ENGINE] ✓ Text Read Success - ${extractedText.length} characters`);
      } else if (isImage) {
        console.log(`[LEXICON_OCR_ENGINE] Image detected - Running Tesseract Neural OCR...`);
        try {
          const { data: { text } } = await Tesseract.recognize(buffer, "eng");
          extractedText = text || "";
          console.log(`[LEXICON_OCR_ENGINE] ✓ Image OCR Success - Extracted ${extractedText.length} characters`);
        } catch (tesseractErr) {
          console.warn(`[LEXICON_OCR_ENGINE] ⚠ Tesseract OCR failed, storing image without text: ${tesseractErr.message}`);
          extractedText = "";
        }
      } else if (isOfficeDoc) {
        console.log(`[LEXICON_OCR_ENGINE] Office Document detected - Parsing with officeparser...`);
        const officeParser = require('officeparser');
        const parseOffice = officeParser.parseOffice || officeParser.parseFile || officeParser;
        try {
          const result = await parseOffice(buffer);
          extractedText = typeof result === "string" ? result : (result?.text || result?.content || "");
          extractedText = extractedText || "";
          console.log(`[LEXICON_OCR_ENGINE] ✓ Office Doc Parse Success - Extracted ${extractedText.length} characters`);
        } catch (opErr) {
          console.warn(`[LEXICON_OCR_ENGINE] ⚠ Office parser failed: ${opErr.message}`);
          extractedText = "";
        }
      } else {
        console.log(`[LEXICON_OCR_ENGINE] No extraction path available for mimetype: ${mimetype}`);
      }
    } catch (engineErr) {
      console.error(`[LEXICON_OCR_ENGINE] ✗ Engine Failure for ${originalname}:`, engineErr.message);
      extractedText = "";
    }

    // 5. CONTENT CLEANING & NORMALIZATION
    const normalizedContent = extractedText ? extractedText.trim().replace(/\s+/g, ' ').slice(0, 200000) : "";
    console.log(`[LEXICON_OCR_ENGINE] Content normalized - Final size: ${normalizedContent.length} characters`);

    // 6. FILE TYPE CATEGORIZATION
    let fileType = "other";
    if (mimetype.startsWith("image/")) {
      fileType = "image";
    } else if (isPdf) {
      fileType = "pdf";
    } else if (mimetype.startsWith("audio/")) {
      fileType = "music";
    }
    console.log(`[LEXICON_OCR_ENGINE] File type categorized: ${fileType}`);

    // 7. DATABASE COMMIT
    console.log(`[LEXICON_OCR_ENGINE] Committing to database: ${originalname}`);
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

    console.log(`[LEXICON_OCR_ENGINE] ✓ SUCCESS - File indexed: ${originalname} (ID: ${file._id})`);
    return res.status(201).json({
      message: "File successfully indexed with OCR content extraction",
      file: {
        id: file._id,
        filename: file.filename,
        fileType: file.fileType,
        size: file.size,
        contentLength: normalizedContent.length
      }
    });

  } catch (error) {
    console.error("[LEXICON_OCR_ENGINE] ✗ CRITICAL ERROR:", error);
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
import File from "../models/File.js";
import crypto from "crypto";

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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

// FAST STREAMING PARSER: Extracts plain text directly from compressed page streams in milliseconds
async function fastStreamPdfParser(buffer) {
  return new Promise((resolve) => {
    try {
      const rawString = buffer.toString("latin1");
      let extractedWords = "";

      // Target FlateDecode content stream wrappers inside the PDF data structures
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let match;
      let streamCount = 0;

      while ((match = streamRegex.exec(rawString)) !== null) {
        streamCount++;
        // Caps reading processing limit to the first 450 deep content streams to protect memory heap
        if (streamCount > 450) break;

        const chunkBytes = Buffer.from(match[1], "latin1");
        try {
          // Decompress binary chunks natively using optimized C++ Node bindings
          const decompressed = zlib.inflateSync(chunkBytes);
          const textLayer = decompressed.toString("utf8");

          // Extract plain character strings enclosed in standard PDF layout operators: (Text) Tj
          const matches = textLayer.match(/\(([^)]*)\)\s*(?:Tj|TJ)/g);
          if (matches) {
            for (let i = 0; i < matches.length; i++) {
              const cleanStr = matches[i].replace(/^[\s\(]+|[\s\)]+(?:Tj|TJ)$/g, "").trim();
              if (cleanStr.length > 1) {
                extractedWords += cleanStr + " ";
              }
            }
          }
        } catch (e) {
          // Skip non-text visual asset streams gracefully
          continue;
        }
      }

      // Filter non-ASCII characters and clean duplicate whitespaces
      let cleanOutput = extractedWords.replace(/[^\x20-\x7E\s]/g, "").replace(/\s+/g, " ").trim();

      // Safety backup mapping if PDF has customized character layout tables
      if (cleanOutput.length < 50) {
        cleanOutput = rawString
          .replace(/\/[\w\d]+|<<[\s\S]*?>>|endobj|obj|xref|trailer|startxref/g, "")
          .replace(/[^\x20-\x7E\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      resolve(cleanOutput.slice(0, 150000));
    } catch (err) {
      console.error("[STREAM_PARSER_ERROR] Parsing failed, falling back to basic slice:", err.message);
      resolve(buffer.toString("utf8").slice(0, 20000));
    }
  });
}

// --- CONTROLLERS ---

/**
 * GET FILES - High Performance Search 
 */
export async function getFiles(req, res, next) {
  try {
    const { query, mode, type, dateRange, date } = req.query;
    const filter = {};

    if (req.user && req.user.id) {
      filter.uploadedBy = req.user.id;
    } else if (req.user && req.user._id) {
      filter.uploadedBy = req.user._id;
    }

    if (type && type !== "all" && type !== "both" && type !== "content") {
      filter.fileType = type;
    }

    const activeDateRange = dateRange || date || 'all';
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

    // --- NATIVE INDEX SAFE FILTER BLOCK ---
    let useRegexFallback = false;
    const safeQuery = escapeRegex(query.trim());
    const regex = new RegExp(safeQuery, "i");

    if (query && query.trim() !== "") {
      if (mode === "content") {
        // Step 1: Query natively using ONLY the text index to avoid planner conflicts
        filter.$text = { $search: query.trim() };
        useRegexFallback = true;
      } else if (mode === "filename") {
        filter.$or = [{ filename: regex }, { relativePath: regex }];
      } else {
        // mode is "both"
        filter.$or = [
          { filename: regex },
          { relativePath: regex },
          { $text: { $search: query.trim() } }
        ];
        useRegexFallback = true;
      }
    }

    console.log("[LEXICON_DB_DEBUG] Executing Filter Object:", JSON.stringify(filter, null, 2));

    let files;
    // Step 2: Try the text index execution query plan safely
    files = await File.find(filter, "filename fileType size createdAt lastModified content relativePath mimetype _id").sort({ createdAt: -1 }).lean();

    // Step 3: FALLBACK SAFETY NET
    // If the full-text search yielded 0 results, but the user typed a partial word, run a regex backup scan
    if (useRegexFallback && files.length === 0 && query.trim().length > 1) {
      console.log(`[LEXICON_SEARCH_FALLBACK] No token matches found for "${query.trim()}". Trying fallback substring scan...`);

      const fallbackFilter = { uploadedBy: filter.uploadedBy };

      if (mode === "content") {
        fallbackFilter.content = { $regex: regex };
      } else {
        fallbackFilter.$or = [
          { filename: regex },
          { relativePath: regex },
          { content: { $regex: regex } }
        ];
      }

      files = await File.find(fallbackFilter, "filename fileType size createdAt lastModified content relativePath mimetype _id").sort({ createdAt: -1 }).lean();
    }
    const normalizedFiles = files.map((file) => {
      const item = { ...file };

      if (query && item.content) {
        item.snippet = createSnippet(item.content, query);
      } else {
        item.snippet = "";
      }

      // For the split-pane preview, we might need the full content
      // but in list view we'll use the snippet. Don't delete content immediately.
      // The frontend will use snippet for list, content for preview.

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
 * SCAN & UPLOAD - Instant Binary OCR Indexing
 */
/**
 * SCAN & UPLOAD - Lean Client-Driven Indexing (Zero Backend Processing Load)
 */
export async function uploadAndIndex(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ message: "No file provided for scanning" });
  }

  const { buffer, originalname, mimetype, size } = req.file;
  const relativePath = req.body.relativePath || "";
  const clientExtractedText = req.body.extractedText || "";

  // 🔍 ADD THIS DEBUG LOG HERE:
  console.log(`[LEXICON_UPLOAD_DEBUG] Received text length from client: ${clientExtractedText.length} chars.`);
  console.log(`[LEXICON_UPLOAD_DEBUG] First 100 characters: "${clientExtractedText.slice(0, 100)}"`);
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  try {
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

    const userFiles = await File.find({ uploadedBy: req.user.id }).select("size").lean();
    const currentTotalSize = userFiles.reduce((acc, f) => acc + (f.size || 0), 0);

    if (currentTotalSize + size > MAX_STORAGE_LIMIT) {
      return res.status(400).json({
        message: "Storage limit reached (1GB cap).",
        used: (currentTotalSize / 1024 / 1024).toFixed(2),
        limit: 1024
      });
    }

    const isPdf = mimetype === "application/pdf" || originalname.toLowerCase().endsWith(".pdf");
    const isImage = mimetype.startsWith("image/");

    // No processing overhead! Just save what the user sent
    const file = await File.create({
      filename: originalname,
      fileType: isPdf ? "pdf" : (isImage ? "image" : (mimetype.startsWith("audio") ? "music" : "other")),
      mimetype,
      size,
      content: clientExtractedText.replace(/\s+/g, ' ').trim(), // Clean spaces out of string
      relativePath: relativePath.startsWith('/') ? relativePath : `/${relativePath}`,
      uploadedBy: req.user.id,
      fileHash: fileHash
    });

    console.log(`[LEXICON_BACKEND] Indexed metadata entry for ${originalname} without processing overhead.`);

    return res.status(201).json({
      message: "File successfully indexed",
      file: { id: file._id, filename: file.filename, type: file.fileType }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * FETCH SINGLE FILE CONTENT
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
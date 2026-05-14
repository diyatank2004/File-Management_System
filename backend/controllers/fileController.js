import File from "../models/File.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import Tesseract from "tesseract.js";
import crypto from "crypto";

// Load libraries
const pdfParseModule = require('pdf-parse');
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
 * GET FILES - Search with filtering
 */
export async function getFiles(req, res, next) {
  try {
    const query = String(req.query.q || "").trim();
    const mode = req.query.mode || "both";
    const type = req.query.type || "all";
    const dateRange = req.query.date || "all";
    const userId = req.user.id;

    const filter = { uploadedBy: userId };

    if (type !== "all") filter.fileType = type;

    if (dateRange !== "all") {
      const now = new Date();
      let startDate;
      if (dateRange === "today") startDate = new Date(now.setHours(0, 0, 0, 0));
      else if (dateRange === "week") startDate = new Date(now.setDate(now.getDate() - 7));
      else if (dateRange === "month") startDate = new Date(now.setMonth(now.getMonth() - 1));
      if (startDate) filter.createdAt = { $gte: startDate };
    }

    if (query) {
      const regex = new RegExp(escapeRegex(query), "i");
      if (mode === "content") filter.content = regex;
      else if (mode === "filename") filter.$or = [{ filename: regex }, { relativePath: regex }];
      else filter.$or = [{ filename: regex }, { relativePath: regex }, { content: regex }];
    }

    const projection = "filename fileType size createdAt content relativePath mimetype _id fileHash";
    const files = await File.find(filter, projection).sort({ createdAt: -1 }).lean();

    const normalizedFiles = files.map((file) => {
      const item = { ...file };
      if (query && item.content) {
        item.snippet = createSnippet(item.content, query);
      }
      return item;
    });

    return res.status(200).json({ files: normalizedFiles });
  } catch (error) { next(error); }
}

/**
 * SCAN & UPLOAD - Supporting Folders & SHA-256 Content Hash
 *//**
* SCAN & UPLOAD - OCR Content Extraction & Reverse Indexing
*/
export async function uploadAndIndex(req, res, next) {
  if (!req.file) return res.status(400).json({ message: "No file provided" });

  const { buffer, originalname, mimetype, size } = req.file;
  // Get relativePath from the request body (sent by the frontend during folder upload)
  const relativePath = req.body.relativePath || "";

  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  try {
    // 1. SMART DUPLICATE CHECK: Blocking by Content Hash (Primary) or Name+Size (Secondary)
    const duplicate = await File.findOne({
      uploadedBy: req.user.id,
      $or: [
        { fileHash: fileHash },
        { filename: originalname, size: size }
      ]
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        message: "Duplicate content or file already indexed",
        duplicateOf: duplicate.filename
      });
    }

    let extractedText = "";
    const isPdf = mimetype === "application/pdf" || originalname.endsWith(".pdf");
    const isImage = mimetype.startsWith("image/");

    // 2. EXTRACTION PHASE (Keep your existing logic here)
    if (isPdf) {
      const data = await pdfParse(buffer);
      extractedText = data.text || "";
      if (!extractedText.trim()) {
        const { data: { text } } = await Tesseract.recognize(buffer, "eng");
        extractedText = text || "";
      }
    } else if (isImage) {
      const { data: { text } } = await Tesseract.recognize(buffer, "eng");
      extractedText = text || "";
    } else {
      extractedText = buffer.toString('utf8');
    }

    // 3. REVERSE INDEX COMMIT
    const file = await File.create({
      filename: originalname,
      fileType: isPdf ? "pdf" : (isImage ? "image" : "other"),
      content: extractedText.trim().replace(/\s+/g, ' ').slice(0, 200000),
      uploadedBy: req.user.id,
      fileHash: fileHash,
      // Store the relative path to preserve folder structure
      relativePath: relativePath.startsWith('/') ? relativePath : `/${relativePath}`
    });

    return res.status(201).json({ message: "Smart Indexing Complete", file });
  } catch (error) { next(error); }
}

export async function deleteFileMetadata(req, res, next) {
  try {
    await File.deleteOne({ _id: req.params.id, uploadedBy: req.user.id });
    return res.status(200).json({ message: "File deleted" });
  } catch (error) { next(error); }
}
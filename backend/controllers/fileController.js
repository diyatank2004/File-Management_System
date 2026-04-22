import File from "../models/File.js";

function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeContent(content) {
  if (typeof content !== "string") {
    return "";
  }

  // Keep payloads bounded to avoid over-sized MongoDB documents.
  return content.slice(0, 200000);
}

function normalizePath(path) {
  if (typeof path !== "string") {
    return "";
  }

  return path.trim().slice(0, 500);
}

function createSnippet(content, query) {
  if (!query || typeof content !== "string" || !content.length) {
    return "";
  }

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);

  if (index === -1) {
    return "";
  }

  const start = Math.max(0, index - 120);
  const end = Math.min(content.length, index + query.length + 220);
  const snippet = content.slice(start, end).replace(/\s+/g, " ").trim();

  if (!snippet) {
    return "";
  }

  return `${start > 0 ? "... " : ""}${snippet}${end < content.length ? " ..." : ""}`;
}

export async function getFiles(req, res, next) {
  try {
    const query = String(req.query.q || "").trim();
    const filter = { uploadedBy: req.user.id };
    const includeContent = query.length >= 3;

    if (query) {
      const regex = new RegExp(escapeRegex(query), "i");
      filter.$or = includeContent
        ? [{ filename: regex }, { relativePath: regex }, { content: regex }]
        : [{ filename: regex }, { relativePath: regex }];
    }

    const projection = query
      ? "filename fileType size createdAt content relativePath"
      : "filename fileType size createdAt relativePath";

    const files = await File.find(filter, projection).sort({ createdAt: -1 }).lean();
    const normalizedFiles = files.map((file) => {
      const item = { ...file };
      if (query && includeContent) {
        item.snippet = createSnippet(item.content, query);
      }
      if (!includeContent) {
        delete item.content;
      }
      return item;
    });

    return res.status(200).json({
      files: normalizedFiles,
      search: {
        query,
        matched: normalizedFiles.length
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function addFileMetadata(req, res, next) {
  try {
    const { filename, fileType, size, content, relativePath } = req.body;

    if (!filename || !fileType || size === undefined) {
      return res.status(400).json({ message: "filename, fileType and size are required" });
    }

    const file = await File.create({
      filename,
      fileType,
      size,
      content: normalizeContent(content),
      relativePath: normalizePath(relativePath),
      uploadedBy: req.user.id
    });

    return res.status(201).json({
      message: "File metadata saved",
      file
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteFileMetadata(req, res, next) {
  try {
    const { id } = req.params;

    const file = await File.findOne({ _id: id, uploadedBy: req.user.id });
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    await file.deleteOne();
    return res.status(200).json({ message: "File metadata deleted" });
  } catch (error) {
    next(error);
  }
}

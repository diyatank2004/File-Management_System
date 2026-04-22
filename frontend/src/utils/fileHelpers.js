const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const DOC_EXTENSIONS = ["doc", "docx", "txt", "md"];
const SHEET_EXTENSIONS = ["xls", "xlsx", "csv"];
const PRESENTATION_EXTENSIONS = ["ppt", "pptx"];
const CODE_EXTENSIONS = ["js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "cs", "go", "rs", "sql", "html", "css", "json", "xml"];

export function getExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function classifyFileType(filename) {
  const ext = getExtension(filename);

  if (ext === "pdf") {
    return "pdf";
  }
  if (IMAGE_EXTENSIONS.includes(ext)) {
    return "image";
  }
  if (DOC_EXTENSIONS.includes(ext)) {
    return "document";
  }
  if (SHEET_EXTENSIONS.includes(ext)) {
    return "spreadsheet";
  }
  if (PRESENTATION_EXTENSIONS.includes(ext)) {
    return "presentation";
  }
  if (CODE_EXTENSIONS.includes(ext)) {
    return "code";
  }
  return "other";
}

export function formatBytes(size = 0) {
  if (size === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const value = size / 1024 ** i;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

export function matchesDateFilter(dateValue, filter) {
  if (!dateValue || filter === "all") {
    return true;
  }

  const now = new Date();
  const date = new Date(dateValue);
  const diffMs = now.getTime() - date.getTime();
  const oneDay = 1000 * 60 * 60 * 24;

  if (filter === "today") {
    return now.toDateString() === date.toDateString();
  }
  if (filter === "week") {
    return diffMs <= oneDay * 7;
  }
  if (filter === "month") {
    return diffMs <= oneDay * 31;
  }
  if (filter === "year") {
    return now.getFullYear() === date.getFullYear();
  }

  return true;
}

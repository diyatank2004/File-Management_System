import JSZip from "jszip";
import mammoth from "mammoth";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getFileExtension } from "./indexing";

GlobalWorkerOptions.workerSrc = workerSrc;

export async function parseDocx(arrayBuffer) {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function parseOfficeXml(arrayBuffer, primaryXmlPath) {
  const zip = new JSZip();
  await zip.loadAsync(arrayBuffer);

  let extractedText = "";

  const xmlFile = zip.file(primaryXmlPath);
  if (xmlFile) {
    const xmlContent = await xmlFile.async("string");
    extractedText += xmlContent.replace(/<[^>]+>/g, " ").replace(/\s\s+/g, " ");
  }

  return extractedText;
}

export async function parsePptx(arrayBuffer) {
  const zip = new JSZip();
  await zip.loadAsync(arrayBuffer);

  let allText = "";

  for (let i = 1; i <= 20; i += 1) {
    const slidePath = `ppt/slides/slide${i}.xml`;
    const xmlFile = zip.file(slidePath);
    if (xmlFile) {
      const xmlContent = await xmlFile.async("string");
      allText += xmlContent.replace(/<[^>]+>/g, " ").replace(/\s\s+/g, " ") + " ";
    }
  }

  const notes = zip.file("ppt/notesMasters/noteMaster1.xml");
  if (notes) {
    const notesContent = await notes.async("string");
    allText += notesContent.replace(/<[^>]+>/g, " ").replace(/\s\s+/g, " ");
  }

  return allText.trim();
}

export async function parsePdf(arrayBuffer) {
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    fullText += `${pageText} [PAGE BREAK] `;
  }

  return fullText;
}

export async function extractTextFromFile(file) {
  const ext = getFileExtension(file.name);

  if (!["pdf", "docx", "xlsx", "pptx"].includes(ext)) {
    return file.text();
  }

  const arrayBuffer = await file.arrayBuffer();

  try {
    switch (ext) {
      case "pdf":
        return await parsePdf(arrayBuffer);
      case "docx":
        return await parseDocx(arrayBuffer);
      case "xlsx":
        return await parseOfficeXml(arrayBuffer, "xl/sharedStrings.xml");
      case "pptx":
        return await parsePptx(arrayBuffer);
      default:
        return file.text();
    }
  } catch (error) {
    console.error(`Error parsing ${file.name} (${ext}):`, error);
    return `[File could not be parsed: ${file.name}. Error: ${error.message}]`;
  }
}

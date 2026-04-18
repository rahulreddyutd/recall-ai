export function chunkText(text, chunkSize = 500, overlap = 100) {
  const words = text.split(/\s+/);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

export function similarityScore(query, chunk) {
  const queryWords = new Set(
    query.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  );
  const chunkWords = chunk.toLowerCase().split(/\s+/);
  let score = 0;
  for (const word of chunkWords) {
    if (queryWords.has(word)) score++;
  }
  return score / Math.max(queryWords.size, 1);
}

export function retrieveRelevantChunks(query, documents, topN = 6) {
  const allChunks = [];
  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      allChunks.push({
        text: chunk,
        source: doc.name,
        score: similarityScore(query, chunk),
      });
    }
  }
  return allChunks
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

async function extractFromPDF(file) {
  try {
    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    if (!pdfjsLib) throw new Error("PDF.js not loaded");

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }

    if (!fullText.trim()) {
      return `[${file.name} appears to be a scanned PDF with no extractable text. Please convert it using OCR at smallpdf.com first.]`;
    }

    return fullText;
  } catch (e) {
    return `[Could not read PDF: ${file.name}. Error: ${e.message}]`;
  }
}

async function extractFromDOCX(file) {
  try {
    const mammoth = window.mammoth;
    if (!mammoth) throw new Error("Mammoth.js not loaded");

    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (!result.value.trim()) {
      return `[${file.name} appears to be empty or unreadable.]`;
    }

    return result.value;
  } catch (e) {
    return `[Could not read DOCX: ${file.name}. Error: ${e.message}]`;
  }
}

export async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return extractFromPDF(file);
  }

  if (name.endsWith(".docx")) {
    return extractFromDOCX(file);
  }

  if (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".csv") ||
    name.endsWith(".json") ||
    name.endsWith(".rtf")
  ) {
    try {
      return await file.text();
    } catch {
      return `[Could not read ${file.name}]`;
    }
  }

  try {
    return await file.text();
  } catch {
    return `[Unsupported file format: ${file.name}]`;
  }
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(name) {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "PDF";
  if (["doc", "docx"].includes(ext)) return "DOC";
  if (["txt", "md"].includes(ext)) return "TXT";
  if (ext === "csv") return "CSV";
  if (ext === "json") return "JSON";
  return "FILE";
}

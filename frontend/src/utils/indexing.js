export const MAX_FILE_SIZE = 1024 * 1024 * 50;

export const SUPPORTED_EXTENSIONS = [
  ".txt",
  ".md",
  ".json",
  ".html",
  ".css",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".xml",
  ".java",
  ".py",
  ".c",
  ".cpp",
  ".h",
  ".cs",
  ".go",
  ".rs",
  ".sql",
  ".pdf",
  ".docx",
  ".xlsx",
  ".pptx"
];

export const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "to",
  "in",
  "on",
  "at",
  "a",
  "an",
  "is",
  "it",
  "its",
  "of",
  "from",
  "as",
  "by",
  "be",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "that",
  "this",
  "but",
  "or",
  "not",
  "we",
  "you",
  "they",
  "i",
  "me",
  "my",
  "he",
  "she",
  "him",
  "her",
  "them",
  "their",
  "which",
  "who",
  "what",
  "when",
  "where",
  "why",
  "how",
  "do",
  "does",
  "did",
  "will",
  "would",
  "can",
  "could",
  "should"
]);

export function getFileExtension(filename) {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
}

export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[\r\n]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && word.length < 50 && !STOP_WORDS.has(word));
}

export function isSupportedFile(file) {
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return false;
  }

  const ext = getFileExtension(file.name);
  return SUPPORTED_EXTENSIONS.includes(`.${ext}`);
}

export function buildInvertedIndex(files) {
  const startTime = performance.now();
  const newIndex = {};

  files.forEach((file, fileIndex) => {
    const tokens = tokenize(file.content);
    tokens.forEach((word, position) => {
      if (word.length < 3) {
        return;
      }

      if (!newIndex[word]) {
        newIndex[word] = {};
      }
      if (!newIndex[word][fileIndex]) {
        newIndex[word][fileIndex] = [];
      }
      newIndex[word][fileIndex].push(position);
    });
  });

  const endTime = performance.now();
  return {
    invertedIndex: newIndex,
    scanTime: ((endTime - startTime) / 1000).toFixed(3)
  };
}

export function createHighlightedSnippet(content, query) {
  if (typeof content !== "string") {
    return "";
  }

  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let index = lowerContent.indexOf(lowerQuery);

  if (index === -1) {
    const tokens = tokenize(query);
    for (const token of tokens) {
      index = lowerContent.indexOf(token);
      if (index !== -1) {
        break;
      }
    }
  }

  let snippet = content;

  if (index !== -1) {
    let start = content.lastIndexOf("\n\n", index - 1) + 2;
    if (start < 0) {
      start = 0;
    }
    start = Math.max(0, start, index - 200);

    let end = content.indexOf("\n\n", index + lowerQuery.length);
    if (end === -1) {
      end = content.length;
    }
    end = Math.min(content.length, end, index + lowerQuery.length + 400);

    snippet = content.substring(start, end).trim();
    if (start > 0) {
      snippet = `... ${snippet}`;
    }
    if (end < content.length) {
      snippet = `${snippet} ...`;
    }
  }

  const tokensToHighlight = [safeQuery, ...tokenize(query)].filter((w) => w.length > 0).join("|");

  if (tokensToHighlight.length === 0) {
    return snippet;
  }

  const highlightRegex = new RegExp(`(${tokensToHighlight})`, "gi");
  const highlightedText = snippet.replace(highlightRegex, (match) => `<span class=\"term-highlight\">${match}</span>`);

  return `<p class=\"snippet-highlight\">${highlightedText}</p>`;
}

export function performSearch(files, invertedIndex, query) {
  const trimmedQuery = query.trim();
  const originalTokens = trimmedQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const searchTokens = tokenize(trimmedQuery);

  if (originalTokens.length === 0) {
    return { searchResults: [], searchMessage: null };
  }

  const totalFiles = files.length;
  const FREQUENCY_THRESHOLD = 0.8;
  let restrictedWord = null;

  for (const token of searchTokens) {
    const fileCount = invertedIndex[token] ? Object.keys(invertedIndex[token]).length : 0;
    if (totalFiles > 0 && fileCount / totalFiles >= FREQUENCY_THRESHOLD) {
      restrictedWord = token;
      break;
    }
  }

  if (restrictedWord) {
    return {
      searchResults: [],
      searchMessage: `The term "${restrictedWord}" occurs in over 80% of all documents. Please search for another, more specific word.`
    };
  }

  const phraseMatchIndices = new Set();
  const lowerQuery = trimmedQuery.toLowerCase();

  if (lowerQuery.length > 0) {
    files.forEach((file, fileIndex) => {
      if (file.content.toLowerCase().includes(lowerQuery)) {
        phraseMatchIndices.add(fileIndex);
      }
    });
  }

  let tokenMatchIndices = new Set();
  let firstToken = true;

  if (searchTokens.length > 0) {
    searchTokens.forEach((token) => {
      if (invertedIndex[token]) {
        const currentFileIndices = new Set(Object.keys(invertedIndex[token]).map(Number));

        if (firstToken) {
          tokenMatchIndices = currentFileIndices;
          firstToken = false;
        } else {
          tokenMatchIndices = new Set(
            [...tokenMatchIndices].filter((index) => currentFileIndices.has(index))
          );
        }
      } else {
        tokenMatchIndices.clear();
      }
    });
  }

  const matchedFileIndices = new Set([...phraseMatchIndices, ...tokenMatchIndices]);

  if (matchedFileIndices.size === 0) {
    return {
      searchResults: [],
      searchMessage: `No documents containing the exact phrase/keywords "${trimmedQuery}" were found.`
    };
  }

  const searchResults = Array.from(matchedFileIndices)
    .map((fileIndex) => {
      const file = files[fileIndex];
      return {
        name: file.name,
        path: file.path,
        snippet: createHighlightedSnippet(file.content, trimmedQuery)
      };
    })
    .sort(() => 0);

  return { searchResults, searchMessage: null };
}

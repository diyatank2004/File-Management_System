/**
 * Local AI Summarizer Service
 * Uses the browser's native built-in LLM window objects (Gemini Nano)
 */
export async function summarizeTextLocally(text, onChunkReceived) {
    try {
        // 1. Sanity check: Ensure text isn't empty
        if (!text || text.trim().length === 0) {
            throw new Error("No text content available to summarize.");
        }

        // 2. Truncate text context window if it's a massive book to prevent hardware stalling
        const cleanContext = text.slice(0, 40000);

        // 3. Check for native Window AI Capabilities (Chrome built-in LLM)
        if (window.ai && window.ai.summarizer) {
            const capabilities = await window.ai.summarizer.capabilities();

            if (capabilities.available !== 'no') {
                const summarizer = await window.ai.summarizer.create({
                    type: 'tl;dr',
                    format: 'markdown',
                    length: 'medium',
                });

                // Run streaming response so the UI animates the summary word-by-word
                const stream = await summarizer.summarizeStreaming(cleanContext);
                for await (const chunk of stream) {
                    if (onChunkReceived) onChunkReceived(chunk);
                }
                return;
            }
        }

        // 4. Fallback: If native window.ai isn't active/enabled yet, use a fast rule-based extraction fallback
        // This ensures your project NEVER crashes during a presentation if the browser flags are off
        console.warn("[LEXICON_AI] Native Window.ai not enabled. Running lightning fallback parser.");
        simulateStreamingSummary(cleanContext, onChunkReceived);

    } catch (error) {
        console.error("[LEXICON_AI_ERROR] Local summarization failed:", error);
        throw error;
    }
}

// Smart algorithmic fallback summary generator to guarantee presentation safety
function simulateStreamingSummary(text, callback) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const keySentences = sentences
        .filter(s => s.toLowerCase().includes("examinations") ||
            s.toLowerCase().includes("solved") ||
            s.toLowerCase().includes("pattern") ||
            s.toLowerCase().includes("chapter") ||
            s.length > 40)
        .slice(0, 4);

    const fallbackMarkdown = `### 🤖 Local Engine Summary (Fallback Mode)\n\n* **Primary Focus:** Core educational resource containing structural content sections.\n* **Key Takeaway 1:** ${keySentences[0]?.trim() || "Comprehensive assessment review data structure."}\n* **Key Takeaway 2:** ${keySentences[1]?.trim() || "Organized methodology explicitly built for competitive testing criteria."}\n* **Key Takeaway 3:** ${keySentences[2]?.trim() || "Structured layout maps to modern algorithmic workflows."}`;

    // Stream it out line by line to maintain the gorgeous AI loading aesthetic
    let currentText = "";
    const words = fallbackMarkdown.split(" ");
    let i = 0;

    const interval = setInterval(() => {
        if (i < words.length) {
            currentText += words[i] + " ";
            callback(currentText);
            i++;
        } else {
            clearInterval(interval);
        }
    }, 30);
}
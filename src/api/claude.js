import { retrieveRelevantChunks } from "../utils/documents";

export async function askRecall({ question, documents, conversationHistory }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sk-ant-...") {
    throw new Error(
      "No API key found. Copy .env.example to .env and add your VITE_ANTHROPIC_API_KEY."
    );
  }

  if (!documents || documents.length === 0) {
    throw new Error(
      "No documents uploaded yet. Upload at least one file to get started."
    );
  }

  const relevantChunks = retrieveRelevantChunks(question, documents, 6);

  const context =
    relevantChunks.length > 0
      ? relevantChunks
          .map((c) => `[Source: ${c.source}]\n${c.text}`)
          .join("\n\n---\n\n")
      : documents
          .flatMap((d) => d.chunks.slice(0, 2))
          .join("\n\n---\n\n");

  const systemPrompt = `You are Recall AI — a personal knowledge assistant that answers questions exclusively from the user's uploaded documents.

Your knowledge base contains the following relevant excerpts from the user's documents:

---
${context}
---

Rules:
1. Answer ONLY based on the content in the knowledge base above
2. Always cite which document your answer comes from using "According to [filename]..." or "From [filename]..."
3. If the answer spans multiple documents, cite all of them
4. If the information is not in the documents, say clearly: "I could not find information about this in your uploaded documents. Try uploading more relevant files."
5. Be conversational and helpful — you have full memory of this conversation
6. When asked follow-up questions, use both the conversation history and the documents to give contextual answers
7. Keep answers concise but complete — do not pad with unnecessary text
8. If you find conflicting information across documents, mention it

You remember everything from this conversation. Use prior context when answering follow-up questions.`;

  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user", content: question },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Anthropic API error ${response.status}`
    );
  }

  const data = await response.json();
  const answer = data.content.map((b) => b.text || "").join("").trim();

  const citedSources = relevantChunks
    .filter((c) => answer.includes(c.source))
    .map((c) => c.source);

  const uniqueSources = [...new Set(citedSources)];

  return {
    answer,
    sources:
      uniqueSources.length > 0
        ? uniqueSources
        : relevantChunks.slice(0, 2).map((c) => c.source),
  };
}

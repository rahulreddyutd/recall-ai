# Recall AI

I built Recall AI because I kept running into the same problem. I had information everywhere — notes in Notion, PDFs on my desktop, research docs in Google Drive — and whenever I needed something specific I would spend 20 minutes hunting through all of it. The information existed. Finding it was the problem.

ChatGPT could not help because it does not know my content. Search does not work well across different file types. So I built something that does.

Recall AI lets you upload your own documents and have a real conversation with them. Ask anything in plain English and it finds the answer from your files, tells you exactly which document it came from, and remembers the full conversation so follow up questions work naturally.

---

## What it does

You drop your files into the left panel — PDFs, DOCX, TXT, Markdown, CSV, JSON — and the app reads and indexes them instantly. Then you ask questions in the chat on the right.

Every answer comes with a source citation showing which file the information came from. If the answer spans multiple documents it cites all of them. If the information is not in your files it tells you that directly rather than making something up.

The conversation memory is the part I am most proud of. Most RAG tools treat every question as independent. Recall AI passes the full conversation history to Claude on every request so you can ask follow up questions naturally — "what did you mean by that" or "can you expand on the second point" — and it understands the context.

---

## Getting started

You need Node 18+ and an Anthropic API key from console.anthropic.com.

    git clone https://github.com/rahulreddyutd/recall-ai.git
    cd recall-ai
    npm install
    cp .env.example .env

Open .env and add your key:

    VITE_ANTHROPIC_API_KEY=add_your_key_here

Start it:

    npm run dev

Open http://localhost:3001, upload any document, and start asking questions.

---

## File types supported

- TXT and Markdown — read directly, work perfectly
- PDF — text-based PDFs work fully. Scanned PDFs are image-based and cannot be read without OCR. If your PDF is scanned, convert it at smallpdf.com first then upload the text version.
- DOCX — supported via Mammoth.js
- CSV and JSON — read as plain text

---

## Project layout

    src/
      api/claude.js          RAG pipeline and Claude API integration
      components/
        TopBar.jsx            header with document count
        UploadPanel.jsx       drag and drop file upload with chunking
        ChatPanel.jsx         chat interface with markdown rendering
      utils/documents.js      text extraction, chunking, similarity search
      App.jsx                 root component with localStorage persistence
      index.css               dark design system

---

## How the RAG pipeline works

When you upload a file the app splits the text into overlapping chunks of around 400 words with 80 word overlap. This overlap is important — it means a sentence that falls at the boundary of two chunks still gets captured in at least one of them.

When you ask a question the app scores every chunk against your query using keyword frequency. The top 6 most relevant chunks get passed to Claude as context along with the full conversation history. Claude then answers using only that context and cites the source file.

This is a lightweight implementation of Retrieval-Augmented Generation without a vector database — it runs entirely in the browser with no backend. For large document collections a proper vector database like Pinecone or Weaviate would give better retrieval accuracy, which is a natural next step for a production version.

---

## Persistence

Everything is saved to localStorage automatically. Your uploaded documents and full conversation history survive page refreshes without needing to re-upload anything. To clear everything use the Remove button on individual files or the Clear chat button in the conversation panel.

---

## Deploying

The quickest path to a live URL is Vercel:

1. Push to GitHub
2. Go to vercel.com and import the repo
3. Add VITE_ANTHROPIC_API_KEY under Environment Variables
4. Deploy

Same note as always — the API key is in the client bundle which is fine for personal use and internal tools. For anything public facing, move the Claude API call to a backend and call that from the frontend instead.

---

## What I would build next

The current retrieval is keyword based which works well for most queries but misses semantic relationships. For example searching for "revenue" would not surface a chunk that only mentions "income" even though they mean the same thing. Proper vector embeddings would fix this.

Other things on the list: support for longer documents by increasing chunk count, a proper OCR pipeline for scanned PDFs, the ability to highlight which part of a document the answer came from, and a web clipper so you can add content directly from the browser without downloading files first.

---

## License

MIT — use it however you want.

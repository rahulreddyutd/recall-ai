import { useState, useRef } from "react";
import { extractTextFromFile, chunkText, formatFileSize, getFileIcon } from "../utils/documents";

export default function UploadPanel({ documents, onDocumentsChange }) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  async function processFiles(files) {
    setProcessing(true);
    const newDocs = [];
    for (const file of files) {
      const existing = documents.find((d) => d.name === file.name);
      if (existing) continue;
      const text = await extractTextFromFile(file);
      const chunks = chunkText(text, 400, 80);
      newDocs.push({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        text,
        chunks,
        uploadedAt: new Date().toLocaleTimeString(),
      });
    }
    onDocumentsChange([...documents, ...newDocs]);
    setProcessing(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }

  function handleFileInput(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
  }

  function removeDocument(id) {
    onDocumentsChange(documents.filter((d) => d.id !== id));
  }

  return (
    <aside className="upload-panel">
      <div className="panel-section-title">Knowledge base</div>

      <div
        className={`drop-zone ${dragging ? "dragging" : ""} ${processing ? "processing" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.pdf,.doc,.docx,.rtf,.csv,.json"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
        {processing ? (
          <>
            <div className="drop-spinner" />
            <p className="drop-text">Processing files...</p>
          </>
        ) : (
          <>
            <div className="drop-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="drop-text">Drop files here</p>
            <p className="drop-subtext">PDF, DOCX, TXT, MD, CSV, JSON</p>
          </>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="empty-docs">
          <p>No documents yet. Upload files to start chatting with your knowledge base.</p>
        </div>
      ) : (
        <div className="doc-list">
          {documents.map((doc) => (
            <div key={doc.id} className="doc-item">
              <div className="doc-icon">{getFileIcon(doc.name)}</div>
              <div className="doc-info">
                <span className="doc-name" title={doc.name}>{doc.name}</span>
                <span className="doc-meta">{formatFileSize(doc.size)} · {doc.chunks.length} chunks · {doc.uploadedAt}</span>
              </div>
              <button className="doc-remove" onClick={() => removeDocument(doc.id)} title="Remove">×</button>
            </div>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="kb-stats">
          <span>{documents.length} {documents.length === 1 ? "file" : "files"}</span>
          <span>·</span>
          <span>{documents.reduce((a, d) => a + d.chunks.length, 0)} chunks indexed</span>
        </div>
      )}
    </aside>
  );
}

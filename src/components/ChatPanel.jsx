import { useState, useRef, useEffect } from "react";
import { askRecall } from "../api/claude";

function formatInline(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function formatMessage(text) {
  const lines = text.split("\n");
  let html = "";
  let inUl = false;
  let inOl = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (olMatch) {
      if (inUl) { html += "</ul>"; inUl = false; }
      if (!inOl) { html += "<ol>"; inOl = true; }
      html += `<li>${formatInline(olMatch[2])}</li>`;
    } else if (ulMatch) {
      if (inOl) { html += "</ol>"; inOl = false; }
      if (!inUl) { html += "<ul>"; inUl = true; }
      html += `<li>${formatInline(ulMatch[1])}</li>`;
    } else {
      if (inUl) { html += "</ul>"; inUl = false; }
      if (inOl) { html += "</ol>"; inOl = false; }
      if (trimmed.startsWith("## ")) {
        html += `<h3>${formatInline(trimmed.slice(3))}</h3>`;
      } else if (trimmed.startsWith("### ")) {
        html += `<h4>${formatInline(trimmed.slice(4))}</h4>`;
      } else if (trimmed === "") {
        html += "<br/>";
      } else {
        html += `<p>${formatInline(trimmed)}</p>`;
      }
    }
  }
  if (inUl) html += "</ul>";
  if (inOl) html += "</ol>";
  return html;
}

const SUGGESTED_QUESTIONS = [
  "What are the main themes in my documents?",
  "Summarize the key points from my files",
  "What decisions or action items are mentioned?",
  "Find any dates or deadlines mentioned",
];

export default function ChatPanel({ documents, messages, onMessagesChange }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function buildHistory() {
    return messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));
  }

  async function handleSend(question) {
    const q = (question || input).trim();
    if (!q || loading) return;
    setInput("");
    setError(null);
    const userMsg = { id: Date.now(), role: "user", content: q };
    onMessagesChange((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const { answer, sources } = await askRecall({
        question: q,
        documents,
        conversationHistory: buildHistory(),
      });
      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: answer,
        sources,
      };
      onMessagesChange((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setError(e.message);
      onMessagesChange((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearConversation() {
    onMessagesChange([]);
    setError(null);
  }

  return (
    <main className="chat-panel">
      <div className="chat-header">
        <span className="chat-title">Conversation</span>
        {messages.length > 0 && (
          <button className="clear-btn" onClick={clearConversation}>Clear chat</button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            {documents.length === 0 ? (
              <>
                <div className="empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <h3 className="empty-title">Upload documents to get started</h3>
                <p className="empty-desc">Drop your PDFs, DOCX, or TXT files in the panel on the left. Then ask anything and Recall AI will find the answer from your own content.</p>
              </>
            ) : (
              <>
                <div className="empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <h3 className="empty-title">Ask anything from your documents</h3>
                <p className="empty-desc">Your knowledge base is ready. Ask a question and Recall AI will find the answer with source citations.</p>
                <div className="suggested-questions">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button key={i} className="suggested-btn" onClick={() => handleSend(q)}>{q}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-bubble">
              {msg.role === "assistant" ? (
                <div className="message-content" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              ) : (
                <p className="message-content">{msg.content}</p>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <div className="message-sources">
                  <span className="sources-label">Sources:</span>
                  {msg.sources.map((s, i) => (
                    <span key={i} className="source-chip">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-bubble loading-bubble">
              <div className="typing-indicator"><span /><span /><span /></div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner"><span>⚠</span> {error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        {messages.length > 0 && (
          <div className="memory-indicator">
            <span className="memory-dot" />
            Conversation memory active — {messages.filter(m => m.role === "user").length} {messages.filter(m => m.role === "user").length === 1 ? "question" : "questions"} remembered
          </div>
        )}
        <div className="input-row">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={documents.length === 0 ? "Upload documents first..." : "Ask anything from your documents..."}
            disabled={documents.length === 0 || loading}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading || documents.length === 0}
          >
            {loading ? (
              <div className="send-spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
        <p className="input-hint">Press Enter to send · Shift+Enter for new line · Full conversation memory enabled</p>
      </div>
    </main>
  );
}

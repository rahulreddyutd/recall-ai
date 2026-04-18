import { useState, useEffect } from "react";
import TopBar from "./components/TopBar";
import UploadPanel from "./components/UploadPanel";
import ChatPanel from "./components/ChatPanel";
import "./index.css";

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn("localStorage full — could not save:", key);
  }
}

export default function App() {
  const [documents, setDocuments] = useState(() =>
    loadFromStorage("recall_documents", [])
  );
  const [messages, setMessages] = useState(() =>
    loadFromStorage("recall_messages", [])
  );

  useEffect(() => {
    saveToStorage("recall_documents", documents);
  }, [documents]);

  useEffect(() => {
    saveToStorage("recall_messages", messages);
  }, [messages]);

  return (
    <div className="app">
      <TopBar docCount={documents.length} />
      <div className="main">
        <UploadPanel documents={documents} onDocumentsChange={setDocuments} />
        <ChatPanel
          documents={documents}
          messages={messages}
          onMessagesChange={setMessages}
        />
      </div>
    </div>
  );
}

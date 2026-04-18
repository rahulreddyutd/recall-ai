export default function TopBar({ docCount }) {
  return (
    <header className="topbar">
      <div className="logo">
        <div className="logo-mark">R</div>
        <span className="logo-name">Recall AI</span>
        <span className="logo-tag">Personal Knowledge Assistant</span>
      </div>
      <div className="topbar-right">
        {docCount > 0 && (
          <span className="doc-count-badge">
            {docCount} {docCount === 1 ? "document" : "documents"} loaded
          </span>
        )}
      </div>
    </header>
  );
}


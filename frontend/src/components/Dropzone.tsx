import { useCallback, useRef, useState } from "react";

interface Props {
  file: File | null;
  error: string | null;
  onChange: (file: File | null) => void;
}

const ACCEPT_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function Dropzone({ file, error, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = useCallback((candidate: File | undefined | null) => {
    if (!candidate) return;
    if (!ACCEPT_MIME.includes(candidate.type)) {
      onChange(null);
      alert("Please attach a photo (JPEG/PNG/WebP) or a PDF of the letter.");
      return;
    }
    if (candidate.size > 12 * 1024 * 1024) {
      onChange(null);
      alert("That file is too large (max 12 MB before we compress it).");
      return;
    }
    onChange(candidate);
  }, [onChange]);

  return (
    <div
      className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      aria-label="Upload a photo or PDF of the rejection letter"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MIME.join(",")}
        hidden
        onChange={(e) => accept(e.target.files?.[0])}
      />
      <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 16V4m0 0l-4 4m4-4l4 4M5 20h14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p>{file ? file.name : "Tap to choose — a photo of the letter is fine"}</p>
      <span className="dropzone-hint">
        {file
          ? `Ready: ${(file.size / 1024 / 1024).toFixed(1)} MB (compressed before upload)`
          : "JPEG, PNG, WebP or PDF · photos are downscaled automatically"}
      </span>
      {error && <span className="dropzone-error">{error}</span>}
    </div>
  );
}
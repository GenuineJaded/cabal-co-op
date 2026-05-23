import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

type Door = "writing" | "music" | "art";

interface Props {
  door: Door;
  onClose: () => void;
  onCreated: () => void;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Something did not hold. Try again.";
}

export default function NewArtifactForm({ door, onClose, onCreated }: Props) {
  const [nama, setNama] = useState("");
  const [body, setBody] = useState("");
  const [artifactLabel, setArtifactLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showUploadPause, setShowUploadPause] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = trpc.artifact.uploadFile.useMutation();
  const createArtifact = trpc.artifact.create.useMutation();
  const labelWasChanged = artifactLabel.trim() !== "";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setError("File exceeds 5MB — consider another route for larger work.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError(null);
    setPendingFile(f);
    setShowUploadPause(true);
  };

  const confirmUpload = () => {
    if (!pendingFile) return;
    setShowUploadPause(false);
    setFile(pendingFile);
    setFilePreview(URL.createObjectURL(pendingFile));
    setPendingFile(null);
  };

  const declineUpload = () => {
    setShowUploadPause(false);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!body.trim() && !file) return;
    setSubmitting(true);
    setError(null);
    try {
      let fileUrl: string | undefined;
      let fileKey: string | undefined;

      if (file) {
        const base64 = await fileToBase64(file);
        const result = await uploadFile.mutateAsync({
          filename: file.name,
          contentType: file.type,
          base64,
        });
        fileUrl = result.url;
        fileKey = result.key;
      }

      await createArtifact.mutateAsync({
        nama: nama.trim() || undefined,
        body: body.trim() || undefined,
        type: door,
        fileUrl,
        fileKey,
      });

      onCreated();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "oklch(0.04 0.01 280 / 0.88)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-[min(66vw,980px)] max-w-full mx-4 animate-fade-in-up"
        style={{
          background: "oklch(0.07 0.01 280)",
          border: "1px solid oklch(0.48 0.14 295 / 0.4)",
          padding: "2.25rem",
        }}
      >
        <div className="mb-6 flex justify-center">
          <div
            className={`${labelWasChanged ? "" : "animate-blink"} inline-block`}
            style={{
              border: "1px solid oklch(0.58 0.16 295 / 0.75)",
              borderRadius: "1px",
              padding: "0.25rem 0.7rem",
              fontSize: "0.65rem",
              letterSpacing: "0.22em",
            }}
          >
            <input
              value={artifactLabel}
              onChange={(e) => setArtifactLabel(e.target.value)}
              onFocus={(e) => {
                if (!labelWasChanged) e.target.placeholder = "";
              }}
              onBlur={(e) => {
                if (!labelWasChanged) e.target.placeholder = "Artifact";
              }}
              placeholder="Artifact"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "oklch(0.80 0.14 295)",
                fontSize: "0.65rem",
                letterSpacing: "0.22em",
                width: `${Math.max(8, (artifactLabel || "Artifact").length + 1)}ch`,
                textAlign: "center",
              }}
            />
          </div>
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="w-full resize-none outline-none leading-relaxed"
          style={{
            background: "none",
            border: "none",
            borderBottom: "1px solid oklch(0.18 0.05 295 / 0.4)",
            color: "oklch(0.82 0.05 295)",
            fontWeight: 300,
            fontSize: "0.95rem",
            lineHeight: 1.85,
            caretColor: "oklch(0.65 0.18 295)",
            marginBottom: "1.75rem",
            paddingBottom: "0.75rem",
          }}
        />

        {filePreview && file && (
          <div className="mb-6">
            {file.type.startsWith("image/") ? (
              <img
                src={filePreview}
                alt=""
                className="max-w-full rounded-sm"
                style={{ maxHeight: "280px", objectFit: "contain" }}
              />
            ) : file.type.startsWith("video/") ? (
              <video
                src={filePreview}
                controls
                className="max-w-full rounded-sm"
                style={{ maxHeight: "280px" }}
              />
            ) : file.type.startsWith("audio/") ? (
              <audio
                src={filePreview}
                controls
                className="w-full"
                style={{ filter: "invert(0.85) hue-rotate(220deg)" }}
              />
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  border: "1px solid oklch(0.28 0.08 295 / 0.5)",
                  borderRadius: "2px",
                  padding: "0.3rem 0.7rem",
                  color: "oklch(0.60 0.14 295)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                }}
              >
                <span style={{ opacity: 0.6 }}>⊕</span>
                {file.name}
              </span>
            )}
          </div>
        )}

        {error && (
          <div
            className="mb-4 text-xs"
            style={{ color: "oklch(0.62 0.14 25)", letterSpacing: "0.08em" }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 mt-2">
          <div
            className="flex-1 flex items-center gap-3"
            style={{ marginLeft: "-0.6rem" }}
          >
            <span
              className="text-[0.7rem] tracking-[0.25em] lowercase"
              style={{
                color: "oklch(0.56 0.14 295 / 0.9)",
                whiteSpace: "nowrap",
                border: "1px solid oklch(0.50 0.16 295 / 0.45)",
                padding: "0.2rem 0.55rem",
                borderRadius: "1px",
              }}
            >
              Nāma
            </span>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              maxLength={128}
              className="flex-1 outline-none text-xs tracking-widest"
              style={{
                background: "none",
                border: "none",
                borderBottom: "1px dotted oklch(0.55 0.18 295 / 0.7)",
                color: "oklch(0.65 0.14 295)",
                padding: "0.25rem 0",
                letterSpacing: "0.18em",
              }}
            />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="attach"
            style={{
              background: "none",
              border: "none",
              color: "oklch(0.42 0.10 295)",
              padding: "0.2rem",
              fontSize: "1.1rem",
              lineHeight: 1,
            }}
          >
            ⊕
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            onClick={handleSubmit}
            disabled={submitting || (!body.trim() && !file)}
            className="text-xs tracking-widest transition-all duration-300"
            style={{
              background: "none",
              border: "1px solid oklch(0.38 0.12 295 / 0.6)",
              color:
                submitting || (!body.trim() && !file)
                  ? "oklch(0.30 0.07 295)"
                  : "oklch(0.65 0.18 295)",
              padding: "0.45rem 1.25rem",
              borderRadius: "1px",
              letterSpacing: "0.18em",
            }}
          >
            {submitting ? "…" : "plant"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4"
          style={{
            background: "none",
            border: "none",
            color: "oklch(0.62 0.16 295)",
            fontSize: "1.1rem",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {showUploadPause && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: "oklch(0.04 0.01 280 / 0.92)" }}
        >
          <div
            className="text-center max-w-sm px-8 animate-fade-in-up"
            style={{ color: "oklch(0.48 0.12 295)" }}
          >
            <p
              className="text-sm leading-relaxed mb-8"
              style={{ fontWeight: 300, lineHeight: 1.9 }}
            >
              Although you are permitted to store and share your work here,
              recognize that you cannot remove it.
              <br />
              <br />
              And containers fill.
              <br />
              <br />
              If there is another viable route for sharing your creation,
              perhaps use that instead.
            </p>
            <div className="flex gap-6 justify-center">
              <button
                onClick={confirmUpload}
                className="text-xs tracking-widest"
                style={{
                  background: "none",
                  border: "none",
                  color: "oklch(0.55 0.14 295)",
                  letterSpacing: "0.2em",
                }}
              >
                continue
              </button>
              <button
                onClick={declineUpload}
                className="text-xs tracking-widest"
                style={{
                  background: "none",
                  border: "none",
                  color: "oklch(0.35 0.08 295)",
                  letterSpacing: "0.2em",
                }}
              >
                release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

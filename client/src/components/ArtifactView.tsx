import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import IntimateCollaborate from "./IntimateCollaborate";
import { FileAttachment, FractalHeart } from "./media";
import QuipModal from "./QuipModal";

type Artifact = {
  id: number;
  nama: string | null;
  body: string | null;
  fileUrl: string | null;
  type: "writing" | "music" | "art";
  purpleShade: number;
  createdAt: Date;
};

interface Props {
  artifact: Artifact;
  sessionId: string;
  onClose: () => void;
  onChanged: () => void;
}

export default function ArtifactView({
  artifact,
  sessionId,
  onClose,
  onChanged,
}: Props) {
  const [showQuip, setShowQuip] = useState(false);
  const [showIntimate, setShowIntimate] = useState(false);
  const viewMutation = trpc.artifact.view.useMutation();
  const recorded = useRef(false);

  const { data: quips, refetch: refetchQuips } = trpc.quip.list.useQuery({
    artifactId: artifact.id,
  });

  // Opening the view is the act of attention — credit one view (+6h).
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    viewMutation.mutate({ id: artifact.id });
  }, [artifact.id, viewMutation]);

  const shade = artifact.purpleShade;

  return (
    <>
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
            maxHeight: "84vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* label — the artifact's nāma, read-only */}
          <div className="mb-6 flex justify-center">
            <div
              style={{
                border: "1px solid oklch(0.50 0.16 295 / 0.55)",
                borderRadius: "1px",
                padding: "0.25rem 0.7rem",
                fontSize: "0.65rem",
                letterSpacing: "0.22em",
                color: "oklch(0.74 0.12 295)",
              }}
            >
              {artifact.nama?.trim() ? artifact.nama : "Artifact"}
            </div>
          </div>

          {/* scrollable content: the full post, then the quips beneath it */}
          <div className="overflow-y-auto pr-1" style={{ flex: 1 }}>
            {artifact.body && (
              <p
                className="leading-relaxed"
                style={{
                  color: "oklch(0.82 0.05 295)",
                  fontWeight: 300,
                  whiteSpace: "pre-wrap",
                  fontSize: "1rem",
                  lineHeight: 1.85,
                }}
              >
                {artifact.body}
              </p>
            )}

            {artifact.fileUrl && (
              <div className="mt-5">
                <FileAttachment url={artifact.fileUrl} />
              </div>
            )}

            {quips && quips.length > 0 && (
              <div
                className="mt-8 space-y-5"
                style={{
                  borderTop: "1px solid oklch(0.18 0.05 295 / 0.35)",
                  paddingTop: "1.5rem",
                }}
              >
                {quips.map((q) => (
                  <div key={q.id}>
                    {q.nama?.trim() && (
                      <p
                        className="text-[0.6rem] tracking-[0.22em] mb-1"
                        style={{ color: "oklch(0.42 0.10 295)" }}
                      >
                        {q.nama}
                      </p>
                    )}
                    {q.body && (
                      <p
                        className="leading-relaxed"
                        style={{
                          color: "oklch(0.70 0.05 295)",
                          fontWeight: 300,
                          whiteSpace: "pre-wrap",
                          fontSize: "0.92rem",
                          lineHeight: 1.8,
                        }}
                      >
                        {q.body}
                      </p>
                    )}
                    {q.fileUrl && (
                      <div className="mt-2">
                        <FileAttachment url={q.fileUrl} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* actions — quip, and the frayed-thread heart */}
          <div className="mt-6 flex items-center justify-end gap-5">
            <button
              onClick={() => setShowIntimate(true)}
              className="animate-pulse-fractal"
              style={{
                background: "none",
                border: "none",
                padding: "0.1rem",
                lineHeight: 1,
              }}
              aria-label=""
            >
              <FractalHeart shade={shade} />
            </button>
            <button
              onClick={() => setShowQuip(true)}
              className="text-xs tracking-widest transition-all duration-300"
              style={{
                background: "none",
                border: "1px solid oklch(0.55 0.18 295 / 0.45)",
                color: "oklch(0.65 0.16 295)",
                padding: "0.35rem 1rem",
                borderRadius: "2px",
                letterSpacing: "0.2em",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "oklch(0.72 0.22 295 / 0.75)";
                el.style.color = "oklch(0.78 0.18 295)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "oklch(0.55 0.18 295 / 0.45)";
                el.style.color = "oklch(0.65 0.16 295)";
              }}
            >
              quip
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
      </div>

      {showQuip && (
        <QuipModal
          artifact={artifact}
          onClose={() => setShowQuip(false)}
          onQuipped={() => {
            setShowQuip(false);
            refetchQuips();
            onChanged();
          }}
        />
      )}

      {showIntimate && (
        <IntimateCollaborate
          artifactId={artifact.id}
          sessionId={sessionId}
          onClose={() => setShowIntimate(false)}
        />
      )}
    </>
  );
}

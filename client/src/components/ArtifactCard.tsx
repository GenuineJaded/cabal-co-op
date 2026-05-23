import { useEffect, useRef, useState } from "react";
import { shadeClass, shadeColor } from "@/lib/shades";
import { trpc } from "@/lib/trpc";
import IntimateCollaborate from "./IntimateCollaborate";
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
  onQuipped: () => void;
}

export default function ArtifactCard({ artifact, sessionId, onQuipped }: Props) {
  const [showQuip, setShowQuip] = useState(false);
  const [showIntimate, setShowIntimate] = useState(false);
  const [viewed, setViewed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewMutation = trpc.artifact.view.useMutation();

  useEffect(() => {
    if (viewed) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewed) {
          setViewed(true);
          viewMutation.mutate({ id: artifact.id });
        }
      },
      { threshold: 0.5 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [artifact.id, viewed, viewMutation]);

  const shade = artifact.purpleShade;

  return (
    <>
      <div
        ref={cardRef}
        className={`relative border animate-fade-in-up ${shadeClass(shade)}`}
        style={{
          borderWidth: "1px",
          borderRadius: "2px",
          padding: "1.85rem",
          minHeight: "260px",
          width: "min(68vw, 980px)",
          maxWidth: "100%",
          background: "oklch(0.07 0.01 280 / 0.85)",
          backdropFilter: "blur(4px)",
          transition: "border-color 2s ease, box-shadow 2s ease",
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <p
            className="text-[0.65rem] tracking-[0.24em]"
            style={{ color: "oklch(0.42 0.10 295)" }}
          >
            {artifact.nama?.trim() ? artifact.nama : "Artifact"}
          </p>

          <button
            onClick={() => setShowIntimate(true)}
            className="animate-pulse-fractal"
            style={{
              background: "none",
              border: "none",
              padding: "0.1rem",
              lineHeight: 1,
              marginTop: "-0.15rem",
            }}
            aria-label=""
          >
            <FractalHeart shade={shade} />
          </button>
        </div>

        {artifact.body && (
          <p
            className="leading-relaxed mb-4"
            style={{
              color: "oklch(0.78 0.04 295)",
              fontWeight: 300,
              whiteSpace: "pre-wrap",
              cursor: "pointer",
              fontSize: "0.98rem",
              lineHeight: 1.82,
              maxHeight: "11.5rem",
              overflow: "hidden",
            }}
            onClick={() => setShowQuip(true)}
          >
            {artifact.body}
          </p>
        )}

        {artifact.fileUrl && (
          <div className="mb-4">
            <FileAttachment url={artifact.fileUrl} />
          </div>
        )}

        <div className="mt-6 flex items-end justify-end gap-4">
          <button
            onClick={() => setShowQuip(true)}
            className="text-xs tracking-widest transition-all duration-300"
            style={{
              background: "none",
              border: "1px solid oklch(0.55 0.18 295 / 0.45)",
              color: "oklch(0.45 0.12 295)",
              padding: "0.2rem 0.7rem",
              borderRadius: "2px",
              letterSpacing: "0.2em",
              boxShadow: "0 0 6px oklch(0.55 0.18 295 / 0.08)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "oklch(0.72 0.22 295 / 0.75)";
              el.style.color = "oklch(0.65 0.18 295)";
              el.style.boxShadow = "0 0 12px oklch(0.55 0.18 295 / 0.22)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "oklch(0.55 0.18 295 / 0.45)";
              el.style.color = "oklch(0.45 0.12 295)";
              el.style.boxShadow = "0 0 6px oklch(0.55 0.18 295 / 0.08)";
            }}
          >
            quip
          </button>
        </div>
      </div>

      {showQuip && (
        <QuipModal
          artifact={artifact}
          onClose={() => setShowQuip(false)}
          onQuipped={() => {
            setShowQuip(false);
            onQuipped();
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

function FileAttachment({ url }: { url: string }) {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];
  const videoExts = ["mp4", "webm", "ogg", "mov"];
  const audioExts = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];

  if (imageExts.includes(ext)) {
    return (
      <img
        src={url}
        alt=""
        className="max-w-full rounded-sm"
        style={{ maxHeight: "300px", objectFit: "contain" }}
      />
    );
  }

  if (videoExts.includes(ext)) {
    return (
      <video
        src={url}
        controls
        className="max-w-full rounded-sm"
        style={{ maxHeight: "300px" }}
      />
    );
  }

  if (audioExts.includes(ext)) {
    return (
      <audio
        src={url}
        controls
        className="w-full"
        style={{ filter: "invert(0.85) hue-rotate(220deg)" }}
      />
    );
  }

  const filename = url.split("/").pop()?.split("?")[0] ?? "attachment";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        border: "1px solid oklch(0.22 0.06 295 / 0.45)",
        borderRadius: "2px",
        padding: "0.3rem 0.6rem",
        color: "oklch(0.55 0.12 295)",
        fontSize: "0.7rem",
        letterSpacing: "0.1em",
        textDecoration: "none",
      }}
    >
      <span style={{ opacity: 0.6 }}>⊕</span>
      {filename}
    </a>
  );
}

function FractalHeart({ shade }: { shade: number }) {
  const color = shadeColor(shade);
  return (
    <svg
      width="16"
      height="14"
      viewBox="0 0 16 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.55 }}
    >
      <path
        d="M8 13C8 13 1 8.5 1 4.5C1 2.567 2.567 1 4.5 1C5.7 1 6.8 1.6 7.5 2.5L8 3L8.5 2.5C9.2 1.6 10.3 1 11.5 1C13.433 1 15 2.567 15 4.5C15 8.5 8 13 8 13Z"
        stroke={color}
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M8 9.5C8 9.5 4.5 7.2 4.5 5.5C4.5 4.672 5.172 4 6 4C6.6 4 7.1 4.3 7.4 4.75L8 5.5L8.6 4.75C8.9 4.3 9.4 4 10 4C10.828 4 11.5 4.672 11.5 5.5C11.5 7.2 8 9.5 8 9.5Z"
        stroke={color}
        strokeWidth="0.6"
        fill={color}
        fillOpacity="0.15"
      />
    </svg>
  );
}

import { useState } from "react";
import { shadeClass } from "@/lib/shades";
import ArtifactView from "./ArtifactView";
import { FileAttachment } from "./media";

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
  const [showView, setShowView] = useState(false);
  const shade = artifact.purpleShade;

  return (
    <>
      {/* A preview. Clicking it opens the view — which is what credits a view. */}
      <div
        onClick={() => setShowView(true)}
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
          cursor: "pointer",
          transition: "border-color 2s ease, box-shadow 2s ease",
        }}
      >
        <div className="mb-5">
          <p
            className="text-[0.65rem] tracking-[0.24em]"
            style={{ color: "oklch(0.42 0.10 295)" }}
          >
            {artifact.nama?.trim() ? artifact.nama : "Artifact"}
          </p>
        </div>

        {artifact.body && (
          <p
            className="leading-relaxed mb-4"
            style={{
              color: "oklch(0.78 0.04 295)",
              fontWeight: 300,
              whiteSpace: "pre-wrap",
              fontSize: "0.98rem",
              lineHeight: 1.82,
              maxHeight: "11.5rem",
              overflow: "hidden",
            }}
          >
            {artifact.body}
          </p>
        )}

        {artifact.fileUrl && (
          <div className="mb-4">
            <FileAttachment url={artifact.fileUrl} />
          </div>
        )}
      </div>

      {showView && (
        <ArtifactView
          artifact={artifact}
          sessionId={sessionId}
          onClose={() => setShowView(false)}
          onChanged={onQuipped}
        />
      )}
    </>
  );
}

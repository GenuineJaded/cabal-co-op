import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import ArtifactCard from "@/components/ArtifactCard";
import NewArtifactForm from "@/components/NewArtifactForm";
import { getSessionId } from "@/lib/shades";
import { trpc } from "@/lib/trpc";

type Door = "writing" | "music" | "art";
const DOORS: Door[] = ["writing", "art", "music"];
const DOOR_TONES: Record<Door, string> = {
  writing: "oklch(0.70 0.08 286)",
  art: "oklch(0.76 0.12 312)",
  music: "oklch(0.68 0.09 268)",
};

export default function Forum() {
  const [, navigate] = useLocation();
  const params = useParams<{ door?: string }>();
  const door = (params.door as Door) || "writing";
  const [showNewForm, setShowNewForm] = useState(false);
  const sessionId = getSessionId();

  const { data: artifacts, refetch } = trpc.artifact.list.useQuery({
    type: door,
  });

  useEffect(() => {
    const interval = setInterval(() => refetch(), 90_000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "oklch(0.04 0.01 280)",
        color: "oklch(0.74 0.04 295)",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-6 pb-12 pt-8 sm:px-8 lg:px-12">
        <div className="flex items-start justify-between gap-6 pb-8">
          <button
            onClick={() => setShowNewForm(true)}
            className="text-xs tracking-widest"
            style={{
              background: "none",
              border: "1px solid oklch(0.55 0.18 295 / 0.55)",
              color: "oklch(0.55 0.18 295)",
              padding: "0.55rem 1.15rem",
              borderRadius: "2px",
              letterSpacing: "0.2em",
              boxShadow: "0 0 8px oklch(0.55 0.18 295 / 0.10)",
              transition: "all 0.25s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.boxShadow = "0 0 16px oklch(0.55 0.18 295 / 0.28)";
              el.style.borderColor = "oklch(0.72 0.22 295 / 0.80)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.boxShadow = "0 0 8px oklch(0.55 0.18 295 / 0.10)";
              el.style.borderColor = "oklch(0.55 0.18 295 / 0.55)";
            }}
          >
            Craft an Artifact
          </button>

          <nav className="flex items-center">
            {DOORS.map((candidate, idx) => {
              const active = candidate === door;
              return (
                <div key={candidate} className="flex items-center">
                  <button
                    onClick={() => navigate(`/field/${candidate}`)}
                    className="text-xs tracking-[0.28em] lowercase"
                    style={{
                      background: "none",
                      border: "none",
                      color: active
                        ? DOOR_TONES[candidate]
                        : "oklch(0.32 0.06 295)",
                      padding: "0 1rem",
                      textShadow: active
                        ? `0 0 18px ${DOOR_TONES[candidate].replace(")", " / 0.18)")}`
                        : "none",
                      transition: "color 0.25s ease, text-shadow 0.25s ease",
                    }}
                  >
                    {candidate}
                  </button>
                  {idx < DOORS.length - 1 && (
                    <div
                      style={{
                        width: "1px",
                        height: "12px",
                        background: "oklch(0.18 0.05 295 / 0.6)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-8">
            {artifacts?.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                sessionId={sessionId}
                onQuipped={refetch}
              />
            ))}
          </div>
        </div>
      </div>

      {showNewForm && (
        <NewArtifactForm
          door={door}
          onClose={() => setShowNewForm(false)}
          onCreated={() => {
            setShowNewForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "oklch(0.04 0.01 280)" }}
    >
      <div className="text-center">
        <p
          className="text-xs tracking-widest mb-8"
          style={{ letterSpacing: "0.25em", color: "oklch(0.35 0.08 295)" }}
        >
          404
        </p>
        <p
          className="text-xs tracking-widest mb-8"
          style={{
            letterSpacing: "0.15em",
            fontWeight: 300,
            color: "oklch(0.28 0.06 295)",
          }}
        >
          nothing is held here
        </p>
        <button
          onClick={() => setLocation("/")}
          className="text-xs tracking-widest"
          style={{
            background: "none",
            border: "1px solid oklch(0.28 0.06 295 / 0.5)",
            color: "oklch(0.35 0.08 295)",
            padding: "0.3rem 0.9rem",
            borderRadius: "2px",
            letterSpacing: "0.2em",
          }}
        >
          return
        </button>
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();
  const [entered, setEntered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const readablePurple = {
    textShadow: "0 0 18px oklch(0.38 0.14 295 / 0.72)",
  };

  const handleEnter = () => {
    setEntered(true);
    setTimeout(() => navigate("/field"), 700);
  };

  const stripes = Array.from({ length: 8 }, (_, i) => ({
    left: `${-16 + i * 14}%`,
    delay: `${(i * 1.17) % 11}s`,
    width: `${3.8 + (i % 3) * 1.1}%`,
    drift: `${10 + (i % 4) * 2.4}s`,
    opacity: 0.11 + (i % 3) * 0.03,
  }));

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
      style={{ background: "oklch(0.02 0 0)" }}
    >
      <div
        className="absolute inset-0 animate-breathe-field"
        style={{
          background:
            "radial-gradient(ellipse 78% 62% at 50% 48%, oklch(0.09 0.01 280 / 0.58) 0%, oklch(0.03 0 0 / 0.16) 46%, transparent 74%)",
        }}
      />

      <div
        className="absolute inset-0 animate-breathe-bg"
        style={{
          background:
            "radial-gradient(ellipse 92% 70% at 50% 50%, oklch(0.14 0.01 280 / 0.12) 0%, oklch(0.06 0 0 / 0.06) 42%, transparent 72%)",
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stripes.map((s, i) => (
          <div
            key={i}
            className="absolute top-[-24%] h-[150%] animate-stretch-stripe"
            style={{
              left: s.left,
              width: s.width,
              background:
                "linear-gradient(to bottom, transparent 0%, oklch(1 0 0 / 0.02) 10%, oklch(1 0 0 / 0.16) 34%, oklch(1 0 0 / 0.25) 50%, oklch(1 0 0 / 0.16) 66%, oklch(1 0 0 / 0.02) 90%, transparent 100%)",
              transform: "skewX(-19deg)",
              animationDelay: s.delay,
              animationDuration: s.drift,
              opacity: s.opacity,
              borderRadius: "999px",
              filter: "blur(0.6px)",
              mixBlendMode: "screen",
            }}
          />
        ))}
      </div>

      <div
        className="relative z-10 text-center px-7 max-w-xl mx-auto animate-fade-in-up"
        style={{
          animationDelay: "0.3s",
          opacity: entered ? 0 : 1,
          transition: "opacity 0.6s ease",
        }}
      >
        <p
          className="text-lg leading-loose tracking-wide mb-2"
          style={{
            color: "oklch(0.93 0.11 295)",
            fontWeight: 420,
            ...readablePurple,
          }}
        >
          You are here.
        </p>

        <p
          className="text-base leading-loose tracking-widest mb-8"
          style={{
            color: "oklch(0.88 0.10 295)",
            fontWeight: 340,
            ...readablePurple,
          }}
        >
          Nothing begins until you move.
        </p>

        <p
          className="text-base leading-loose mb-3"
          style={{
            color: "oklch(0.90 0.12 295)",
            fontWeight: 340,
            ...readablePurple,
          }}
        >
          Three doors.
          <br />
          <span style={{ color: "oklch(0.82 0.09 295)", fontSize: "0.94rem" }}>
            The labels are inherited. Insufficient. Used anyway.
          </span>
          <br />
          <span style={{ color: "oklch(0.82 0.09 295)", fontSize: "0.94rem" }}>
            Your choice of door is part of what you leave.
          </span>
        </p>

        <p
          className="text-base tracking-widest mb-10"
          style={{
            color: "oklch(0.90 0.12 295)",
            letterSpacing: "0.3em",
            ...readablePurple,
          }}
        >
          writing · music · art
        </p>

        <p
          className="text-sm leading-relaxed mb-12"
          style={{
            color: "oklch(0.84 0.09 295)",
            fontWeight: 340,
            lineHeight: 1.8,
            ...readablePurple,
          }}
        >
          Held while in contact. Released in absence.
          <br />
          Propping is permitted. The cost is visible.
          <br />
          What stays, stays because someone is still here with it.
        </p>

        <button
          onClick={handleEnter}
          className="group animate-patha-vibrate"
          aria-label="Enter the field"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.34 0.13 295 / 0.34), oklch(0.16 0.08 295 / 0.28))",
            border: "1px solid oklch(0.78 0.20 295 / 0.88)",
            borderRadius: "2px",
            padding: "0.72rem 2.35rem",
            minWidth: "10.5rem",
            cursor: "pointer",
            transition:
              "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, transform 0.3s ease",
            boxShadow:
              "0 0 24px oklch(0.55 0.18 295 / 0.36), inset 0 0 18px oklch(0.76 0.22 295 / 0.12)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background =
              "linear-gradient(180deg, oklch(0.44 0.16 295 / 0.48), oklch(0.22 0.10 295 / 0.38))";
            el.style.borderColor = "oklch(0.86 0.22 295 / 0.95)";
            el.style.boxShadow =
              "0 0 34px oklch(0.62 0.20 295 / 0.52), inset 0 0 24px oklch(0.82 0.22 295 / 0.18)";
            el.style.transform = "translateY(-2px) scale(1.02)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background =
              "linear-gradient(180deg, oklch(0.34 0.13 295 / 0.34), oklch(0.16 0.08 295 / 0.28))";
            el.style.borderColor = "oklch(0.78 0.20 295 / 0.88)";
            el.style.boxShadow =
              "0 0 24px oklch(0.55 0.18 295 / 0.36), inset 0 0 18px oklch(0.76 0.22 295 / 0.12)";
            el.style.transform = "translateY(0)";
          }}
        >
          <span
            className="text-3xl tracking-[0.4em]"
            style={{
              color: "oklch(0.92 0.19 295)",
              fontWeight: 260,
              fontStyle: "italic",
              letterSpacing: "0.5em",
              textShadow: "0 0 28px oklch(0.62 0.20 295 / 0.78)",
            }}
          >
            Pātha
          </span>
        </button>
      </div>
    </div>
  );
}

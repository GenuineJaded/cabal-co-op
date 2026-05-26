import { shadeColor } from "@/lib/shades";

// Renders an attachment by type: images/video/audio inline, anything else as a chip.
export function FileAttachment({ url }: { url: string }) {
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
      onClick={(e) => e.stopPropagation()}
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

// Fractal heart — unlabeled, opens the Frayed Thread.
export function FractalHeart({ shade }: { shade: number }) {
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

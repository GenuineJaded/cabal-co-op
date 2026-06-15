import { describe, expect, it } from "vitest";
import { calculateShade } from "./db.js";

describe("calculateShade", () => {
  // A fixed reference instant. Shade is time-based, so the assertions about
  // "earned extra" measure remaining life at the moment of creation by passing
  // `now === createdAt` (elapsed = 0) for a deterministic result.
  const NOW = new Date("2026-01-01T00:00:00Z");
  const base = {
    id: 1,
    nama: null,
    body: "test",
    fileUrl: null,
    fileKey: null,
    type: "writing" as const,
    lifeSeconds: 604800,
    purpleShade: 0,
    isExpired: false,
    createdAt: NOW,
    lastInteractedAt: NOW,
  };

  const HOUR = 3600;
  const DAY = 86400;
  const BASE = 604800; // 7 days
  const at = (lifeSeconds: number) =>
    calculateShade({ ...base, lifeSeconds }, NOW);

  it("returns 0 for a fresh artifact (no earned extra)", () => {
    expect(at(BASE)).toBe(0);
  });

  it("returns 0 after a single view (only +6h of extra)", () => {
    expect(at(BASE + 6 * HOUR)).toBe(0);
  });

  it("returns 1 once 24h of extra balance has been earned", () => {
    expect(at(BASE + DAY)).toBe(1);
  });

  it("returns 3 with 72h of earned extra", () => {
    expect(at(BASE + 3 * DAY)).toBe(3);
  });

  it("caps at 12 no matter how much extra was earned", () => {
    expect(at(BASE + 100 * DAY)).toBe(12);
  });

  it("returns 12 exactly at the cap threshold (12 days of earned extra)", () => {
    expect(at(BASE + 12 * DAY)).toBe(12);
  });

  it("clamps to 0 when balance has dropped below the base", () => {
    expect(at(BASE - DAY)).toBe(0);
    expect(at(1)).toBe(0);
  });

  it("fades as the deadline approaches even without losing lifeSeconds", () => {
    // An artifact granted 3 extra days starts at shade 3, but two days later —
    // with lifeSeconds untouched — only one day of extra life remains: shade 1.
    const createdAt = new Date(Date.now() - 2 * DAY * 1000);
    const artifact = { ...base, createdAt, lifeSeconds: BASE + 3 * DAY };
    expect(calculateShade(artifact, new Date())).toBe(1);
  });

  it("treats an artifact past its deadline as fully faded (shade 0)", () => {
    const createdAt = new Date(Date.now() - 10 * DAY * 1000);
    const artifact = { ...base, createdAt, lifeSeconds: BASE };
    expect(calculateShade(artifact, new Date())).toBe(0);
  });
});

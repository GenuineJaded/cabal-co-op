import { describe, expect, it } from "vitest";
import { calculateShade } from "./db.js";

describe("calculateShade", () => {
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
    createdAt: new Date(),
    lastInteractedAt: new Date(),
  };

  const HOUR = 3600;
  const DAY = 86400;
  const BASE = 604800; // 7 days

  it("returns 0 for a fresh artifact (no earned extra)", () => {
    expect(calculateShade({ ...base, lifeSeconds: BASE })).toBe(0);
  });

  it("returns 0 after a single view (only +6h of extra)", () => {
    expect(calculateShade({ ...base, lifeSeconds: BASE + 6 * HOUR })).toBe(0);
  });

  it("returns 1 once 24h of extra balance has been earned", () => {
    expect(calculateShade({ ...base, lifeSeconds: BASE + DAY })).toBe(1);
  });

  it("returns 3 with 72h of earned extra", () => {
    expect(calculateShade({ ...base, lifeSeconds: BASE + 3 * DAY })).toBe(3);
  });

  it("caps at 12 no matter how much extra was earned", () => {
    expect(calculateShade({ ...base, lifeSeconds: BASE + 100 * DAY })).toBe(12);
  });

  it("returns 12 exactly at the cap threshold (12 days of earned extra)", () => {
    expect(calculateShade({ ...base, lifeSeconds: BASE + 12 * DAY })).toBe(12);
  });

  it("clamps to 0 when balance has dropped below the base", () => {
    expect(calculateShade({ ...base, lifeSeconds: BASE - DAY })).toBe(0);
    expect(calculateShade({ ...base, lifeSeconds: 1 })).toBe(0);
  });
});

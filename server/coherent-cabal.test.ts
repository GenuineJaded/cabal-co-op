import { describe, expect, it } from "vitest";
import { calculateShade, extendLife } from "./db.js";

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

describe("extendLife", () => {
  const HOUR = 3600;
  const DAY = 86400;
  const BASE = 604800; // 7 days
  const SPAN = 12 * DAY; // base → soft ceiling
  const CEILING = BASE + SPAN; // 19 days
  const VIEW = 6 * HOUR;
  const QUIP = 18 * HOUR;

  it("applies the full nominal gain at the base", () => {
    expect(extendLife(BASE, VIEW)).toBe(BASE + VIEW);
    expect(extendLife(BASE, QUIP)).toBe(BASE + QUIP);
  });

  it("applies the full nominal gain when balance is below the base", () => {
    expect(extendLife(BASE - DAY, VIEW)).toBe(BASE - DAY + VIEW);
  });

  it("halves the gain at the midpoint of the extension span", () => {
    // surplus = 6 days = half of the 12-day span → factor 0.5
    expect(extendLife(BASE + 6 * DAY, QUIP)).toBe(BASE + 6 * DAY + QUIP / 2);
  });

  it("applies almost nothing just under the soft ceiling", () => {
    // surplus = 11 days of a 12-day span → factor 1/12
    const result = extendLife(BASE + 11 * DAY, QUIP);
    expect(result).toBe(BASE + 11 * DAY + Math.floor(QUIP / 12));
    expect(result).toBeLessThan(CEILING);
  });

  it("never lets the balance climb past the soft ceiling", () => {
    expect(extendLife(CEILING, QUIP)).toBe(CEILING);
    expect(extendLife(CEILING - 60, 100 * DAY)).toBeLessThanOrEqual(CEILING);
  });

  it("makes a quip extend more than a view from the same balance", () => {
    const from = BASE + 3 * DAY;
    expect(extendLife(from, QUIP)).toBeGreaterThan(extendLife(from, VIEW));
  });
});

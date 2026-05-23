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
  };

  it("returns 0 for a fresh artifact", () => {
    expect(
      calculateShade({
        ...base,
        createdAt: new Date(),
        lastInteractedAt: new Date(),
      })
    ).toBe(0);
  });

  it("returns 1 after 18 hours of inactivity", () => {
    const t = new Date(Date.now() - 18 * 60 * 60 * 1000 - 1000);
    expect(
      calculateShade({ ...base, createdAt: t, lastInteractedAt: t })
    ).toBe(1);
  });

  it("returns 3 after 54 hours of inactivity", () => {
    const t = new Date(Date.now() - 54 * 60 * 60 * 1000 - 1000);
    expect(
      calculateShade({ ...base, createdAt: t, lastInteractedAt: t })
    ).toBe(3);
  });

  it("caps at 7 regardless of how old", () => {
    const t = new Date(Date.now() - 200 * 60 * 60 * 1000);
    expect(
      calculateShade({ ...base, createdAt: t, lastInteractedAt: t })
    ).toBe(7);
  });
});

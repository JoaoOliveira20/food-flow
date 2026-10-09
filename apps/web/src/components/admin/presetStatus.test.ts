import { describe, expect, it } from "vitest";
import { presetStatus } from "./presetStatus";

describe("presetStatus", () => {
  it("treats the initial preset as initial whatever the rest", () => {
    expect(presetStatus({ isInitial: true, isVisible: true, isAvailable: false })).toBe("initial");
  });

  it("reports a hidden preset as hidden even when its items are available", () => {
    expect(presetStatus({ isInitial: false, isVisible: false, isAvailable: true })).toBe("hidden");
    expect(presetStatus({ isInitial: false, isVisible: false, isAvailable: false })).toBe("hidden");
  });

  it("separates published presets from published ones blocked by hidden items", () => {
    expect(presetStatus({ isInitial: false, isVisible: true, isAvailable: true })).toBe("published");
    expect(presetStatus({ isInitial: false, isVisible: true, isAvailable: false })).toBe("unavailable");
  });
});

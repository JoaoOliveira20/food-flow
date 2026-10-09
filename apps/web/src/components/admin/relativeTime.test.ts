import { describe, expect, it } from "vitest";
import { relativeTime } from "./relativeTime";

const NOW = Date.parse("2026-10-07T12:00:00Z");

describe("relativeTime", () => {
  it.each([
    ["2026-10-07T11:59:40Z", "agora há pouco"],
    ["2026-10-07T11:55:00Z", "há 5 minutos"],
    ["2026-10-07T09:00:00Z", "há 3 horas"],
    ["2026-10-06T12:00:00Z", "ontem"],
    ["2026-09-23T12:00:00Z", "há 2 semanas"],
  ])("formats %s as %s", (iso, expected) => {
    expect(relativeTime(iso, NOW)).toBe(expected);
  });
});

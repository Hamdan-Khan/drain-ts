import { describe, expect, it } from "vitest";
import { TemplateMinerConfig } from "../src/index.js";

describe("TemplateMinerConfig", () => {
  it("uses constructor defaults", () => {
    const config = new TemplateMinerConfig();

    expect(config.drainSimTh).toBe(0.4);
    expect(config.drainDepth).toBe(4);
    expect(config.drainMaxChildren).toBe(100);
    expect(config.drainMaxClusters).toBeNull();
    expect(config.drainExtraDelimiters).toEqual([]);
    expect(config.parametrizeNumericTokens).toBe(true);
    expect(config.snapshotIntervalMinutes).toBe(1);
    expect(config.snapshotCompressState).toBe(true);
  });

  it("applies constructor custom overrides", () => {
    const config = new TemplateMinerConfig({
      drainSimTh: 0.7,
      drainDepth: 6,
      drainMaxChildren: 25,
      drainMaxClusters: 8,
      drainExtraDelimiters: ["=", "_"],
      parametrizeNumericTokens: false,
      snapshotIntervalMinutes: 0,
      snapshotCompressState: false,
    });

    expect(config.drainSimTh).toBe(0.7);
    expect(config.drainDepth).toBe(6);
    expect(config.drainMaxChildren).toBe(25);
    expect(config.drainMaxClusters).toBe(8);
    expect(config.drainExtraDelimiters).toEqual(["=", "_"]);
    expect(config.parametrizeNumericTokens).toBe(false);
    expect(config.snapshotIntervalMinutes).toBe(0);
    expect(config.snapshotCompressState).toBe(false);
  });

  it("fromObject maps valid values", () => {
    const config = TemplateMinerConfig.fromObject({
      drainSimTh: 0.55,
      drainDepth: 5,
      drainMaxChildren: 77,
      drainMaxClusters: 13,
      drainExtraDelimiters: ["|", ":"],
      parametrizeNumericTokens: false,
      snapshotIntervalMinutes: 3,
      snapshotCompressState: false,
    });

    expect(config.drainSimTh).toBe(0.55);
    expect(config.drainDepth).toBe(5);
    expect(config.drainMaxChildren).toBe(77);
    expect(config.drainMaxClusters).toBe(13);
    expect(config.drainExtraDelimiters).toEqual(["|", ":"]);
    expect(config.parametrizeNumericTokens).toBe(false);
    expect(config.snapshotIntervalMinutes).toBe(3);
    expect(config.snapshotCompressState).toBe(false);
  });

  it("fromObject ignores invalid types and preserves null for drainMaxClusters", () => {
    const config = TemplateMinerConfig.fromObject({
      drainSimTh: "0.9",
      drainDepth: "4",
      drainMaxChildren: false,
      drainMaxClusters: null,
      drainExtraDelimiters: ["-", 1],
      parametrizeNumericTokens: "yes",
      snapshotIntervalMinutes: "0",
      snapshotCompressState: "false",
    } as unknown as Record<string, unknown>);

    expect(config.drainSimTh).toBe(0.4);
    expect(config.drainDepth).toBe(4);
    expect(config.drainMaxChildren).toBe(100);
    expect(config.drainMaxClusters).toBeNull();
    expect(config.drainExtraDelimiters).toEqual([]);
    expect(config.parametrizeNumericTokens).toBe(true);
    expect(config.snapshotIntervalMinutes).toBe(1);
    expect(config.snapshotCompressState).toBe(true);
  });
});

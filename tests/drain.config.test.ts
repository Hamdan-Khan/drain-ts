import { describe, expect, it } from "vitest";
import { Drain } from "../src/drain/drain.js";
import { DrainBase } from "../src/drain/drainBase.js";

describe("Drain constructor and config", () => {
  it("uses expected default values", () => {
    const drain = new Drain();

    expect(drain.logClusterDepth).toBe(4);
    expect(drain.maxNodeDepth).toBe(2);
    expect(drain.simTh).toBe(0.4);
    expect(drain.maxChildren).toBe(100);
    expect(drain.maxClusters).toBeNull();
    expect(drain.paramStr).toBe("<*>");
    expect(drain.parametrizeNumericTokens).toBe(true);
  });

  it("applies custom constructor values", () => {
    const drain = new Drain(5, 0.75, 12, 3, ["_"], undefined, "#", false);

    expect(drain.logClusterDepth).toBe(5);
    expect(drain.maxNodeDepth).toBe(3);
    expect(drain.simTh).toBe(0.75);
    expect(drain.maxChildren).toBe(12);
    expect(drain.maxClusters).toBe(3);
    expect(drain.extraDelimiters).toEqual(["_"]);
    expect(drain.paramStr).toBe("#");
    expect(drain.parametrizeNumericTokens).toBe(false);
  });

  it("throws when depth is lower than 3", () => {
    expect(() => new Drain(2)).toThrow("depth argument must be at least 3");
  });

  it("tokenizes with trim, whitespace and extra delimiters", () => {
    const drain = new Drain(4, 0.4, 100, null, ["_", "="]);

    const tokens = drain.getContentAsTokens("  level=INFO  user_id=42  ");
    expect(tokens).toEqual(["level", "INFO", "user", "id", "42"]);
  });

  it("exposes static numeric detection utility", () => {
    expect(DrainBase.hasNumbers("abc")).toBe(false);
    expect(DrainBase.hasNumbers("abc123")).toBe(true);
  });
});

describe("Drain sequence helpers", () => {
  it("createTemplate replaces mismatches with wildcard token", () => {
    const drain = new Drain(4, 0.4, 100, null, [], undefined, "*");

    expect(
      drain.createTemplate(["aa", "bb", "dd"], ["aa", "bb", "cc"]),
    ).toEqual(["aa", "bb", "*"]);
    expect(drain.createTemplate(["aa", "bb"], ["aa", "bb"])).toEqual([
      "aa",
      "bb",
    ]);
  });

  it("throws when createTemplate receives different sequence lengths", () => {
    const drain = new Drain();

    expect(() => drain.createTemplate(["a", "b"], ["a"])).toThrow(
      "Sequence lengths must match",
    );
  });

  it("throws when getSeqDistance receives different sequence lengths", () => {
    const drain = new Drain();

    expect(() => drain.getSeqDistance(["a", "b"], ["a"], true)).toThrow(
      "Sequence lengths must match",
    );
  });
});

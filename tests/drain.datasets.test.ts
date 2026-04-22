import { describe, expect, it } from "vitest";
import { Drain } from "../src/drain/drain.js";
import { drainDatasets } from "./fixtures/logDatasets.js";

describe("Drain real-world dataset cases", () => {
  it.each(drainDatasets)(
    "clusters $name predictably",
    ({ entries, expectedClusterCount, simTh }) => {
      const drain = new Drain(4, simTh ?? 0.4);

      for (const line of entries) {
        drain.addLogMessage(line);
      }

      expect(drain.getTotalClusterSize()).toBe(entries.length);
      expect(drain.clusters).toHaveLength(expectedClusterCount);
      expect(
        drain.clusters.some((cluster) => cluster.template.includes("<*>")),
      ).toBe(true);
    },
  );
});
